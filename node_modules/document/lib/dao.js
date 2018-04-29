'use strict';

var dao = module.exports = {};
var parser = require('./parser');
var config = require('./config');

// a simple pool
dao._queue = [];
dao._pending = false;

// get the whole data tree
dao.tree = function (options, callback) {
    if ( dao._data ) {
        return callback(null, dao._data);
    }

    dao._queue.push(callback);

    if ( dao._pending ) {
        return;
    }

    dao._pending = true;

    var sys = options.sys;
    var user = options.user;

    parser.raw_tree( sys.doc, user.index, function (err, raw_tree) {
        if ( err ) {
            return dao._complete(err);
        }

        var ltree = parser.language_tree(raw_tree, user.languages);

        parser.create_data(ltree, sys, function (err, data) {
            if ( err ) {
                return dao._complete(err);
            }

            dao._data = data;
            dao._complete(null, data);
        });
    });
};


// get the current document
dao.current = function (req_data, options, callback) {
    dao.tree(options, function (err, tree) {
        if ( err ) {
            return callback(err);
        }

        var lang = require('./lang');

        // our logic make sure the `ltree` always exists
        var ltree = dao._language_tree(tree, req_data.language);
        var found;
        var slices = req_data.path_slices;
        var is_homepage = slices.length === 0;

        if ( is_homepage ) {
            found = ltree;
        } else {
            found = dao._route(ltree, slices);
        }

        callback(null, {
            current     : found,
            tree        : ltree,
            is_homepage : is_homepage
        });
    });
};


dao._language_tree = function (tree, language) {
    language = language || 'default';

    tree = tree[language.toLowerCase()];

    if ( !tree ) {
        return null;
    }

    return tree.tree;
};


dao._route = function (tree, slices) {
    var slash = '/';
    // support encoding
    var pathname = slash + decodeURIComponent( slices.join(slash) ) + slash;

    return dao._search_into(tree, pathname);
};


dao._search_into = function (node, pathname) {
    var pages = node.pages;
    var match;

    if ( pages ) {
        pages.some(function (sub_node) {
            var sub_uri = sub_node.url + '/';

            if ( pathname.indexOf(sub_uri) === 0 ) {
                match = sub_node;
                return true;
            }
        });
    }
    
    return match && dao._search_into(match, pathname) || match || null;
};


dao._complete = function (err, data) {
    dao._pending = false;

    dao._queue.forEach(function (callback) {
        callback(err, data);
    });

    dao._queue.length = 0;
};

