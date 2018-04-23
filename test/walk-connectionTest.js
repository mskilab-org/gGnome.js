var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Base = require('../js/base.js').Base;
const WalkConnection = require('../js/walk-connection.js').WalkConnection;

// not sure how to use walk 

// constructor(con, wlk) {
//     super(con);
//     this.styleClass = `popovered walk-connection connection local ${con.type}`;
//     this.walk = wlk;


// WalkConnection {
//   cid: 42,
//   source: null,
//   sink: null,
//   title: 'foo',
//   type: 'foobar',
//   weight: undefined,
//   styleClass: 'popovered walk-connection connection local foobar',
//   clipPath: 'url("#clip")',
//   line: 
//    { [Function: line]
//      x: [Function],
//      y: [Function],
//      defined: [Function],
//      curve: [Function],
//      context: [Function] },
//   errors: [],
//   walk: 
//    { pid: 12,
//      cn: 2,
//      type: 'something',
//      strand: '*',
//      cids: 20,
//      iids: 230 } }


describe('testing walk-connection.js', function() {
  it('WalkConnection constructor', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"},
      {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});      
    assert.equal(walkconn.cid, 42);
    assert.equal(walkconn.source, null);  
    assert.equal(walkconn.sink, null);  
    assert.equal(walkconn.title, "foo");  
    assert.equal(walkconn.type, "foobar");  
    assert.equal(walkconn.weight, undefined);  
    assert.equal(walkconn.styleClass, "popovered walk-connection connection local foobar");   
    assert.equal(walkconn.clipPath, 'url("#clip")');     
    expect(walkconn.errors).to.eql([]).not.to.equal([]);
    assert.equal(walkconn.walk.pid, 12);  
    assert.equal(walkconn.walk.cn, 2);  
    assert.equal(walkconn.walk.type, "something");  
    assert.equal(walkconn.walk.strand, "*");  
    assert.equal(walkconn.walk.cids, 20); 
    assert.equal(walkconn.walk.iids, 230);  
  });
});


// valid() 

describe('testing walk-connection.js', function() {
  it('WalkConnection valid()', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"},
      {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});      
    expect(walkconn.valid()).to.be.false;
  });
});

// pinpoint()

describe('testing walk-connection.js', function() {
  it('WalkConnection pinpoint()', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"},
      {"pid":12, "cn":2, "type":"something", "strand":"*", "cids":20, "iids":230});      
    expect(walkconn.pinpoint()).to.be.undefined;
  });
});

// console.log(walkconn.interConnectorEndpoints);
// TypeError

// looseConnectorEndpoints()
// TypeError: this.touchScale is not a function

// popoverTitle()
// TypeError: Cannot read property 'pid' of undefined



