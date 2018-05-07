


var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Misc = require('../js/misc.js').Misc;


// isString()

describe('testing Misc functions', function() {
  it('isString()', function() {
    expect(Misc.isString('foo')).to.be.true;
  });
});


// chromosomeLabels()

describe('testing Misc functions', function() {
  it('chromosomeLabels()', function() {
    assert.equal(Misc.chromosomeLabels[0], 1);
    assert.equal(Misc.chromosomeLabels[22], 'X');
    assert.equal(Misc.chromosomeLabels[23], 'Y');
    assert.equal(Misc.chromosomeLabels[24], 'M');
  });
});


// connectionLabels()

describe('testing Misc functions', function() {
  it('connectionLabels()', function() {
    assert.equal(Misc.connectionLabels[0], 'LOOSE');
    assert.equal(Misc.connectionLabels[1], 'REF');
    assert.equal(Misc.connectionLabels[2], 'ALT');
  });
});


// unique(array)

describe('testing Misc functions', function() {
  it('unique(array)', function() {
    expect(Misc.unique([1, 1, 2, 1, 2, 2])).to.eql([ 1, 2 ]).but.not.equal([ 1, 2 ]);
    expect(Misc.unique(['foo', 'foo', 'foo', 'bar', '$', '%', '$'])).to.eql([ 'foo', 'bar', '$', '%' ]).but.not.equal([ 'foo', 'bar', '$', '%' ]);
  });
});


// server()

describe('testing Misc functions', function() {
  it('server()', function() {
    assert.equal(Misc.server, 'http://localhost:8000');
  });
});


// alerting(text, type)
// ReferenceError: $ is not defined
// 

// metadata()
// 

// console.log(Misc.metadata);

// console.log(misc.Misc.metadata);

// /Users/ebiederstedt/gGnome.js/js/misc.js:32
//        $.ajax({
//        ^
//
//  ReferenceError: $ is not defined


// guid()   Set the random seed
// set the random see via Math.random()


// magnitude(n) 

describe('testing Misc functions', function() {
  it('magnitude(n)', function() {
    assert.equal(Misc.magnitude(234182), 100000);
    assert.equal(Misc.magnitude(42), 10);
    assert.equal(Misc.magnitude(0), 0);
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









