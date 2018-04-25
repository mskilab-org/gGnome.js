
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const misc = require('../js/misc.js');

// isString()

describe('testing Misc functions', function() {
  it('isString()', function() {
    expect(misc.Misc.isString('foo')).to.be.true;
  });
});


// chromosomeLabels()

describe('testing Misc functions', function() {
  it('chromosomeLabels()', function() {
    assert.equal(misc.Misc.chromosomeLabels[0], 1);
    assert.equal(misc.Misc.chromosomeLabels[22], 'X');
    assert.equal(misc.Misc.chromosomeLabels[23], 'Y');
    assert.equal(misc.Misc.chromosomeLabels[24], 'M');
  });
});


// connectionLabels()

describe('testing Misc functions', function() {
  it('connectionLabels()', function() {
    assert.equal(misc.Misc.connectionLabels[0], 'LOOSE');
    assert.equal(misc.Misc.connectionLabels[1], 'REF');
    assert.equal(misc.Misc.connectionLabels[2], 'ALT');
  });
});


// unique(array)

describe('testing Misc functions', function() {
  it('unique(array)', function() {
    expect(misc.Misc.unique([1, 1, 2, 1, 2, 2])).to.eql([ 1, 2 ]).but.not.equal([ 1, 2 ]);
    expect(misc.Misc.unique(['foo', 'foo', 'foo', 'bar', '$', '%', '$'])).to.eql([ 'foo', 'bar', '$', '%' ]).but.not.equal([ 'foo', 'bar', '$', '%' ]);
  });
});


// server()

describe('testing Misc functions', function() {
  it('server()', function() {
    assert.equal(misc.Misc.server, 'http://localhost:8000');
  });
});


// alerting(text, type)
// ReferenceError: $ is not defined
// 


// metadata()
// 

// /Users/ebiederstedt/gGnome.js/js/misc.js:32
//        $.ajax({
//        ^
//
//  ReferenceError: $ is not defined
// console.log(misc.Misc.metadata);



// guid()   Set the random seed
// set the random see via Math.random()


// magnitude(n) 

describe('testing Misc functions', function() {
  it('magnitude(n)', function() {
    assert.equal(misc.Misc.magnitude(234182), 100000);
    assert.equal(misc.Misc.magnitude(42), 10);
    assert.equal(misc.Misc.magnitude(0), 0);
  });
});



// intervals
// console.log(misc.Misc.intervals(50, 70));
// /Users/ebiederstedt/gGnome.js/js/misc.js:49
//        $.ajax({



// ['a', 'b', 'c', 'b', 'a', 'b', 'c', 'a', 'a', 'a']

// groupBy

// describe('testing Misc functions', function() {
//   it('groupBy(list, keyGetter)', function() {
//   	var list1 = ['a', 'b', 'c', 'b', 'a', 'b', 'c', 'a', 'a', 'a'];
//     
//   });
// });









