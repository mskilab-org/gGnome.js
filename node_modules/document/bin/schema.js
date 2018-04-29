'use strict';

// options and argv schema
// only used by bin

var node_path = require('path');
var fs = require('fs-sync');

exports.shorthands = {
    c: 'cwd',
    h: 'help',
    p: 'port'
};

exports.schema = {
    help: {
        type: Boolean
    },

    // cwd will always be defined
    cwd: {
        type: node_path,
        default: process.cwd()
    },

    doc: {
        setter: function (doc, is_default) {
            // defined, but not an absolute path
            if ( doc && doc !== node_path.resolve(doc) ) {
                doc = node_path.resolve(this.get('cwd'), value);
            }

            return doc;
        }
    },

    port: {
        type: Number,
        // d0mT
        default: 9037
    },

    theme: {
    },

    open: {
        type: Boolean,
        default: true
    }
};