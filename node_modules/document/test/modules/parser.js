'use strict';

var dao = require('../../lib/dao');

var expect = require('chai').expect;
var node_path = require('path');

var doc_root = node_path.resolve('test/repo/doc');

dao.docs(doc_root, function (err, data) {
    console.log(
        require('util').inspect(data, {
            depth: 10
        })
    );
});

        