'use strict';

// parse the data of documents
// only used by DAO

var parser = module.exports = {};

var glob        = require('glob');
var marked      = require('marked');
var highlight   = require('highlight.js');
var node_path   = require('path');
var sep         = node_path.sep;
var node_fs     = require('fs');
var lang        = require('./lang');
var async       = require('async');


// parse the tree structure of the document
// basic infomations
// @param {path} dir absolute dir of the document root

// tree:
// {
//     index: 'README.md',
//     // relative depth
//     rel_depth: 0,
//     pages: {
//         '1_a.md': {
//             name: '1_a.md',
//             parent: <recursive>,
//             rel_depth: 1,
//             // empty array indicates there're no sub pages
//             pages: {}
//         }
//     }
// }
parser.raw_tree = function (dir, index_file, callback) {
    glob('**/*.md', {
        cwd: dir,
        strict: true

    }, function (err, files) {
        if ( err ) {
            return callback(err);
        }

        var tree = {
            // rel_depth: 0,
            pages: {},
            type: 'dir'
        };

        files.forEach(function (file) {
            parser._save_item(tree, file, dir, index_file);
        });

        callback(null, tree);
    });
};


parser._save_item = function (tree, path, root, index_file) {
    var parent = tree;
    var abs = root;

    path.split(sep).some(function (slice, i) {
        abs = node_path.join(abs, slice);

        if ( slice === index_file && node_fs.statSync(abs).isFile() ) {
            parent.path = abs;
            return true;
        }

        var current = parent.pages[slice];

        if ( !current ) {
            current = parent.pages[slice] = {
                // duplicate data for more easily parsing
                name: slice,
                // recursive data
                parent: parent
            };

            if ( node_fs.statSync(abs).isDirectory() ) {
                if ( !current.pages ) {
                    current.pages = {};
                }

                current.type = 'folder';
                parent = current;

            } else {
                current.type = 'file';
                current.path = abs;
                // if file occurs, skip parsing
                return true;
            }
        }

        parent = current;
    });
};


// TODO
var REGEX_NAME_SPLITTER = /[_\s]+/g;
var REGEX_INT = /^\d+$/;

parser.cook_name = function (name) {
    var split = name.split(REGEX_NAME_SPLITTER).filter(Boolean);

    var first = split[0];

    // number string
    if ( REGEX_INT.test(first) ) {
        split.shift();
    }

    return {
        // '01_abc_def' -> 'Abc Def'
        display_name: split.map(function (part) {
            return lang.capitalize(part);
        }).join(' '),

        // '01_abc_def' -> 'abc-def'
        uri_name    : split.map(function (part) {
            return part.toLowerCase();
        }).join('-')
    }
};


// @param {Object=} languages
// {
//     "zh-CN": {
//     }
// }
parser.language_tree = function (raw_tree, languages) {
    if ( lang.isEmptyObject(languages) ) {
        languages = null;
    }

    var ret = {};

    if ( languages ) {
        var root = raw_tree.pages || {};

        lang.each(languages, function (name, language) {
            var ltree = root[language] || {};
            delete ltree.parent;

            // It's hard to detect the closest match if user had a wrong configuration
            // convert to lowercase to make it easier
            ret[language.toLowerCase()] = {
                name: name,
                tree: ltree
            };


            ltree.language = language;
            ltree.language_text = name;
        });

        return ret;

    } else {
        return {
            default: {
                tree: raw_tree
            }
        };
    }
};


var SUPPORTED_LANG = Object.keys(highlight.LANGUAGES);

var marked_opt = {
    breaks: false,
    gfm: true,
    langPrefix: 'language-',
    pedantic: false,
    sanitize: false,
    silent: false,
    smartLists: false,
    smartypants: false,
    tables: true,
    highlight: function (code, lang) {
        if ( ~ SUPPORTED_LANG.indexOf(lang) ) {
            return highlight.highlight(lang, code).value;
        } else {
            return highlight.highlightAuto(code).value;
        }
    }
};

// options.
parser.markdown = function (code, callback) {
    marked(code, marked_opt, callback);
};


var REGEX_MATCH_H1 = /<h1>(.*?)<\/h1>/i;

parser.get_title = function (html) {
    html = html || '';

    var match = html.match(REGEX_MATCH_H1);

    return match ? match[1] : undefined;
};


// @param {Object} options
// - define 
parser.sort_pages = function (pages) {
    pages.sort(function (a, b) {
        return a.name < b.name ? - 1 : 1;
    });
};


// create a cache
parser.create_data = function (language_tree, sys, callback) {
    var counter = Object.keys(language_tree).length;
    var error;
    var nodes = [];

    function iterator (data, done) {
        var node = data.node;
        var descend = data.descend;

        nodes.push(node);

        parser._parse_content(node, function (err, html) {
            if ( err ) {
                return done(err);
            }

            var title;

            if ( html ) {
                node.html = html;
                // There might be no title inside the html
                title = parser.get_title(html);
            }

            parser._generate_url(node, title || node.name);

            var pages = node.pages;

            if ( pages ) {
                // `pages` from object to array 
                node.pages = Object.keys(pages).map(function (name) {
                    return pages[name];
                });

                parser.sort_pages(node.pages);
            }

            descend();
            done(null);
        });
    };

    lang.each(language_tree, function (l, language) {
        var tree = l.tree;

        if ( !tree.path ) {
            tree.path = sys.readme;
        }

        parser.walk(l.tree, iterator, function (err) {
            if ( err ) {
                error = err;
                return callback(err);

            } else if (error) {
                return;

            } else if ( -- counter === 0 ) {
                nodes.forEach(function (node) {
                    if ( node ) {
                        // remove recursive property
                        // delete node.parent;
                        // remove private data
                        delete node.path;
                    }
                });
                // free
                nodes.length = 0;

                return callback(null, language_tree);
            }
        });
    });
};


parser._parse_content = function (node, callback) {
    var file = node.path;

    if ( file ) {
        node_fs.readFile(file, function (err, content) {
            if ( err ) {
                return done(err);
            }

            parser.markdown(content.toString(), callback);
        });

    } else {
        callback(null);
    }
};


// TODO: #7
parser._generate_url = function (node, name) {
    if ( !node.parent ) {
        node.url = '';

    } else {
        if ( !name ) {
            console.log(node);
        }

        var cooked = parser.cook_name(name);
        node.display_name = cooked.display_name;
        node.uri_name = cooked.uri_name;

        node.url = node.parent.url + '/' + node.uri_name;
    }
};


// walk and traverse a tree
parser.walk = function (tree, iterator, callback) {
    var q = async.queue(iterator);
    var errors = [];

    q.drain = function () {
        callback( errors.length ? errors : null );
    };

    function walk (node, depth) {
        node.depth = depth;

        q.push({
            node: node,

            // descend a specific node or descend all
            descend: function (sub_node) {
                if ( sub_node ) {
                    walk(sub_node, depth + 1);

                } else if ( node.pages ) {
                    node.pages.forEach(function (sub_node, name) {
                        walk(sub_node, depth + 1);
                    });
                }
            }

        }, function (err){
            if ( err ) {
                errors.push(err);
            }
        });
    }

    walk(tree, 0);
};

