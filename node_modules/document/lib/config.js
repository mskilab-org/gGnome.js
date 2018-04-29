'use strict';

// generate the global configurations
// only used by bin

var config = module.exports = {};

var fs          = require('fs-sync');
var clean       = require('clean');

var lang        = require('./lang');

var node_url    = require('url');
var node_path   = require('path');
var node_fs     = require('fs');

// document.json > package.json > default

// function trim (string, trimmer) {
//     var regex = new RegExp('^(?:' + trimmer + ')+|(?:' + trimmer + ')$', 'g');

//     return string.replace(regex, '');
// }

var REGEX_TRIM_SLASH = /^\/+|\/+$/g;
var REGEX_GIT_SSH = /^git@/i;
var REGEX_GIT_COLON = /:(?!\d+\/)/;
var REGEX_GIT_EXT = /\.git$/i;

// standardize important config keys
var DEFAULT_SCHEMA = {
    site_root: {
        type: String,
        default: '/',
        setter: function (root) {
            root = root.replace(REGEX_TRIM_SLASH, '');

            if ( root ) {
                // '/'      -> ''
                // '/doc', '/doc/', 'doc/' -> '/doc'
                root = '/' + root;
            }

            return root;
        }
    },

    description: {
        setter: function (des) {
            return des || '';
        }
    },

    keywords: {
        setter: function (keywords) {
            return lang.makeArray(keywords);
        }
    },

    repositories: {
        setter: function (repos) {
            return lang.makeArray(repos);
        }
    },

    repository: {
        setter: function (repo) {
            repo = repo || this.get('repositories')[0];

            // simply convert git protocol and ssh to http 
            if ( repo && repo.url && repo.type === 'git' ) {
                var parsed = node_url.parse(repo.url);

                // is git protocal or http(s)
                // "git://github.com/name/repo.git"
                // -> http://github.com/name/repo.git
                if ( parsed.host ) {
                    if ( parsed.protocol === 'git:' ) {
                        parsed.protocol = 'http:';
                    }
                    repo.url = parsed.format();

                // is ssh
                // "git@github.com:user/repo.git"
                } else {
                    // -> "git@github.com/user/repo.git"
                    repo.url = repo.url.replace(REGEX_GIT_COLON, '/')
                        .replace(REGEX_GIT_EXT, '')
                        .replace(REGEX_GIT_SSH, 'http://');
                }
                
            }

            return repo;
        }
    },

    languages: {
        setter: function (languages) {
            return languages || {};
        }
    },

    default_language: {
        setter: function (default_language) {
            // make sure default_language is valid
            if ( default_language && !(default_language in this.get('languages')) ) {
                default_language = null;
            }

            return default_language || Object.keys(this.get('languages'))[0] || null;
        }
    },

    index: {
        default: 'README.md'
    },

    // not implemented yet
    url_rewrite_type: {
        default: 'title'
    }
};


// @param {Object} args arguments from cli
// - cwd: {path} repo root, requred
// - doc: {path=} document root, optional
// - theme: {path=} theme root, optional
config.get_config = function (cli_args, callback) {
    var cwd = cli_args.cwd;

    config.read_package_json(cwd, function (err, pkg) {
        if ( err ) {
            return callback(err);
        }

        var doc = cli_args.doc || 
            // make sure it's an absolute url
            node_path.join(
                cwd, 
                // commonjs: [package/1.0](http://wiki.commonjs.org/wiki/Packages/1.0)
                pkg.directories && pkg.directories.doc ||
                    // default to doc
                    'doc'
            );

        config.read_config_json(doc, function (err, cfg) {
            if ( err ) {
                return callback(err);
            }

            config.apply_package_json(cfg, pkg);

            clean({
                schema: DEFAULT_SCHEMA

            }).clean(cfg, function (err, result) {
                if ( err ) {
                    return callback(err);
                } 

                var theme = cli_args.theme || node_path.join(__dirname, '..', 'theme');

                var readme = node_path.join(cwd, 'README.md');
                var sys = {
                    cwd: cwd,
                    doc: doc,

                    // hard coded
                    theme: theme,
                    public_root: node_path.join(theme, 'public')
                };

                if ( fs.isFile(readme) ) {
                    sys.readme = readme;
                }

                callback(null, {
                    // user configurations that is mainly used by templates
                    user: result,

                    // configurations relevant to the system, which are critical and should not be exposed
                    sys: sys
                });
            });
        });
    });
};


var PICK_MAP = {
    title: 'name',
    tagline: 'description',
    keywords: 'keywords',
    repository: 'repository',
    repositories: 'repositories'
};


config.apply_package_json = function (cfg, pkg) {
    lang.each(PICK_MAP, function (pkg_key, cfg_key) {
        cfg[cfg_key] = cfg[cfg_key] || pkg[pkg_key];
    });
};


config.read_config_json = function (doc, callback) {
    var file = node_path.join(doc, 'config.json');

    config._read_json(file, callback);
};


config.read_package_json = function (cwd, callback) {
    var file = node_path.join(cwd, 'package.json');

    config._read_json(file, callback);
};


config._read_json = function (file, callback) {
    // for those which are not commonjs projects
    if ( !fs.exists(file) ) {
        return callback(null, {});

    } else {
        try {
            callback(null, require(file));
        } catch(e) {
            callback({
                code: 'EPARSEJSON',
                message: 'Error parsing "' + file + '"',
                data: {
                    file: file
                }
            });
        }
    }
};


