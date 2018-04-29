#!/usr/bin/env node

'use strict';

var clean = require('../');
var expect = require('chai').expect;

var node_path = require('path');
var node_url = require('url');

var schema = {
    cwd: {
        type: node_path
    },

    a: {
        type: Boolean
    },

    url: {
        type: node_url
    }
};

var shorthands = {
    'c': 'cwd'
}

describe(".parse()", function(){
    it("complex", function(done){
        clean({
            schema: schema,
            shorthands: shorthands

        }).parseArgv(['node', 'my command', '-c', 'abc', '-a', '--url', 'abc'], function(err, results, details){
            done();
            expect(err).not.to.equal(null);
            expect(results.cwd).to.equal(node_path.resolve('abc'));
            expect(details.url.error).not.to.equal(null);
        });
    });
});


describe(".clean()", function(){
    it("default value of String should be ''", function(done){
        clean({
            schema: {
                a: {
                    type: String
                },
                b: {
                    type: String,
                    default: null
                }
            }
        }).clean({}, function(err, results){
            done();

            expect(results.a).to.equal('');
            expect(results.b).to.equal('null');
        });
    });
});