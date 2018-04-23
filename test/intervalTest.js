var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Base = require('../js/base.js').Base;
const Interval = require('../js/interval.js').Interval;


//  iid: 42,
//  chromosome: undefined,
//  startPoint: undefined,
//  endPoint: undefined,
//  intervalLength: NaN,
//  y: undefined,
//  title: undefined,
//  type: undefined,
//  strand: undefined,
//  errors: [] }

// constructor

describe('testing interval.js', function() {
  it('Interval constructor', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    assert.equal(interval.iid, 42);  
    assert.equal(interval.chromosome, 22);  
    assert.equal(interval.startPoint, 105000);
    assert.equal(interval.endPoint, 130000);  
    assert.equal(interval.intervalLength, 25001);  
    assert.equal(interval.y, 10);
    assert.equal(interval.title, "foo");  
    assert.equal(interval.type, undefined);  
    assert.equal(interval.strand, "*");  
  });
});

// valid()

describe('testing interval.js', function() {
  it('Interval valid', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    expect(interval.valid()).to.be.false;  
  });
});

// popoverTitle()

describe('testing interval.js', function() {
  it('Interval popoverTitle', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    assert.equal(interval.popoverTitle, "Interval #foo"); 
  });
});

// popoverContent()
// <div class="row">

describe('testing interval.js', function() {
  it('Interval popoverContent', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    assert.equal(interval.popoverContent.substring(0,17), '<div class="row">'); 
  });
});

// location()

describe('testing interval.js', function() {
  it('Interval location', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    assert.equal(interval.popoverContent.substring(0,17), '<div class="row">'); 
  });
});


// toString()

describe('testing interval.js', function() {
  it('Interval toString', function() {
    var interval = new Interval({"iid":42, "chromosome":22, "startPoint":105000, "endPoint":130000, "y":10, "title": "foo", "strand":"*"});
    assert.equal(interval.popoverContent.substring(0,17), '<div class="row">'); 
  });
});





