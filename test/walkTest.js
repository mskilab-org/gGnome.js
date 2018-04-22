
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Base = require('../js/base.js').Base;
const Walk = require('../js/walk.js').Walk;


// What should this be? walk.type;

//  constructor(walk) {
//    super();
//    this.pid = walk.pid;
//    this.cn = walk.cn;
//    this.type = walk.type;
//    this.strand = walk.strand;
//    this.cids = walk.cids;
//    this.iids = walk.iids;
//    this.title = `${this.pid} | ${this.cn}`;
//    this.errors = [];
//  }

// constructor

describe('testing walk.js', function() {
  it('Walk constructor', function() {
  	var walk = new Walk({"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});  
    assert.equal(walk.pid, 12);  
    assert.equal(walk.cn, 2);  
    assert.equal(walk.type, "something");  
    assert.equal(walk.strand, "*");  
    assert.equal(walk.cids, 20);  
    assert.equal(walk.iids, 230);    
  });
});


// valid(), validateWalkConnections()

// What would be valid??

describe('testing chromo.js', function() {
  it('checking Walk valid() and validateWalkConnections()', function() {
  	var walk = new Walk({"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});  
    expect(walk.valid()).to.be.false;      
  });
});

// popoverTitle()

describe('testing chromo.js', function() {
  it('checking Walk popoverTitle()', function() {
  	var walk = new Walk({"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});  
    assert.equal(walk.popoverTitle, "Interval #12 | 2");     
  });
});

// popoverContent

describe('testing chromo.js', function() {
  it('checking Walk popoverContent()', function() {
  	var walk = new Walk({"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});  
    assert.equal(walk.popoverContent.substring(0, 17), '<div class="row">');     
  });
});


/// WHY IS THIS HERE???
// location() 
//   get location() {
//    return `${this.chromosome}: ${this.startPoint} - ${this.endPoint}`;
//  }


// toString()
// identifier? 
// iid?









