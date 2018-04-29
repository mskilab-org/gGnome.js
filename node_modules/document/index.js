'use strict';

var document = module.exports = {};

var Server = require('./lib/server');

document.Server = Server;

document.server = function (options) {
    return new Server(options);
};

