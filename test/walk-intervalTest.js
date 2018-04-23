var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Interval = require("../js/interval.js").Interval;
const WalkInterval = require('../js/walk-interval.js').WalkInterval;



// constructor(hap, wlk)


// WalkInterval {
//   iid: 42,
//   chromosome: 22,
//   startPoint: 105000,
//   endPoint: 130000,
//   intervalLength: 25001,
//   y: 10,
//   title: 'foo',
//  type: undefined,
//  strand: '*',
//  errors: [],
//  walk: 
//   { pid: 12,
//     cn: 2,
//     type: 'something',
//     strand: '*',
//     cids: 20,
//     iids: 230 },
//  uid: '12#42',
//  coordinates: '22-105000-130000',
//  margins: { arrow: 5 } }
//

// constructor()

describe('testing walk-interval.js', function() {
  it('WalkInterval constructor', function() {
    var walkinterval = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"*"}, {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});
    assert.equal(walkinterval.iid, 42);
    assert.equal(walkinterval.chromosome, 22);
    assert.equal(walkinterval.startPoint, 105000);
    assert.equal(walkinterval.endPoint, 130000);
    assert.equal(walkinterval.intervalLength, 25001);
    assert.equal(walkinterval.y, 10);
    assert.equal(walkinterval.title, "foo");    
    assert.equal(walkinterval.strand, "*"); 
    expect(walkinterval.errors).to.eql([]).not.to.equal([]); 
    assert.equal(walkinterval.walk.pid, 12);  
    assert.equal(walkinterval.walk.cn, 2);  
    assert.equal(walkinterval.walk.type, "something");  
    assert.equal(walkinterval.walk.strand, "*");  
    assert.equal(walkinterval.walk.cids, 20);    
    assert.equal(walkinterval.walk.iids, 230);
    assert.equal(walkinterval.uid, "12#42");
    assert.equal(walkinterval.coordinates, "22-105000-130000");    
    assert.equal(walkinterval.margins.arrow, 5); 
  });
});

// valid() 

describe('testing walk-interval.js', function() {
  it('WalkInterval valid()', function() {
    var walkinterval = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"*"}, {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});
    expect(walkinterval.valid()).to.be.false;
  });
});


// popoverTitle

describe('testing walk-interval.js', function() {
  it('WalkInterval valid()', function() {
    var walkinterval = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"*"}, {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});
    assert.equal(walkinterval.popoverTitle, "Walk Interval #foo of walk #12");
  });
});


// popoverContent

describe('testing walk-interval.js', function() {
  it('WalkInterval valid()', function() {
    var walkinterval = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"*"}, {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});
    assert.equal(walkinterval.popoverContent.substring(0, 17), '<div class="row">');
  });
});


// points

/// These attributes aren't defined here: this.shapeWidth > this.margins.arrow)
// Why? 

// [ 0, 0, undefined, 0, undefined, undefined, 0, undefined ]

describe('testing walk-interval.js', function() {
  it('WalkInterval valid()', function() {
    var walkinterval = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"*"}, {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});
    assert.equal(walkinterval.points[0], 0);
    assert.equal(walkinterval.points[1], 0);
    expect(walkinterval.points[2]).to.be.undefined;  
    assert.equal(walkinterval.points[3], 0);
    expect(walkinterval.points[4]).to.be.undefined;  
    expect(walkinterval.points[5]).to.be.undefined;  
    assert.equal(walkinterval.points[6], 0);    
    expect(walkinterval.points[7]).to.be.undefined;  
    var walkinterval_positiveStrand = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"+"}, {"pid":12, "cn":2, "type":"something", "strand":"+", "cids":20, "iids":230});
    assert.equal(walkinterval_positiveStrand.points[0], 0);
    assert.equal(walkinterval_positiveStrand.points[1], 0);
    expect(walkinterval_positiveStrand.points[2]).to.be.undefined;  
    assert.equal(walkinterval_positiveStrand.points[3], 0);
    expect(walkinterval_positiveStrand.points[4]).to.be.undefined;  
    expect(walkinterval_positiveStrand.points[5]).to.be.undefined;  
    assert.equal(walkinterval_positiveStrand.points[6], 0);    
    expect(walkinterval_positiveStrand.points[7]).to.be.undefined; 
    var walkinterval_negativeStrand = new WalkInterval({"iid":42, "chromosome":22, "startPoint":105000, 
	    "endPoint":130000, "y":10, "title": "foo", "strand":"+"}, {"pid":12, "cn":2, "type":"something", "strand":"-", "cids":20, "iids":230});   
    assert.equal(walkinterval_negativeStrand.points[0], 0);
    assert.equal(walkinterval_negativeStrand.points[1], 0);
    expect(walkinterval_negativeStrand.points[2]).to.be.undefined;  
    assert.equal(walkinterval_negativeStrand.points[3], 0);
    expect(walkinterval_negativeStrand.points[4]).to.be.undefined;  
    expect(walkinterval_negativeStrand.points[5]).to.be.undefined;  
    assert.equal(walkinterval_negativeStrand.points[6], 0);    
    expect(walkinterval_negativeStrand.points[7]).to.be.undefined; 
  });
});




