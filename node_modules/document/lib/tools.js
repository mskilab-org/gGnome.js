'use strict';

var tools = module.exports = {};
var lang = require('./lang');

tools._tree_contains = function (parent, child) {
    while (child = child.parent) {
        if ( child === parent ) {
            return true;
        }
    }

    return false;
};

// render a navigation struture 
tools.nav = function (tree, current_doc, config) {
    var html = '<ul class="nav nav-list depth-' + tree.depth + '">';
    var pages = tree.pages;

    if ( pages ) {
        pages.forEach(function (node, name) {
            if ( node === current_doc ) {
                html += '<li class="active open">';
            } else if (tools._tree_contains(node, current_doc)) {
                html += '<li class="open">';
            } else {
                html += '<li>';
            }

            var is_folder = node.type === 'folder';

            if ( is_folder ) {
                var content_link = node.url && node.html && (config.site_root + node.url);
                html += '<a href="' + (content_link || '#') + '" class="J_nav ' + (content_link ? 'J_has-content ' : '') + 'folder">' + node.display_name + '</a>';

                html += tools.nav(node, current_doc, config);

            } else {
                html += '<a href="' + config.site_root + node.url + '">' + node.display_name + '</a>';
            }

            html += '</li>';
        });
    }

    html += '</ul>';

    return html;
};