#!/usr/bin/env node

'use strict';

var document    = require('../');
var express     = require('express');
var clean       = require('clean');
var schema      = require('./schema');
var config      = require('../lib/config');
var server      = require('../lib/server');

var node_path   = require('path');

clean(schema).parseArgv(process.argv, function(err, args, details){
    if ( args.help ) {
        return help();
    } else {
        delete args.help;
    }

    var port = args.port;
    var open = args.open;
    delete args.port;
    delete args.open;

    config.get_config(args, function (err, cfg) {
        if ( err ) {
            return console.log(err.stack || err.message || err);
        }

        var site_root = cfg.user.site_root;

        var app = express();
        app.use(site_root, express.static( cfg.sys.public_root ));
        app.use(site_root, server(cfg));

        app.listen(port, function () {
            console.log('started at http://localhost:' + port );
            open && require('child_process').exec('open http://localhost:' + port + site_root);
        });
    });
});


function help () {
    console.log('nothing here by far');
}