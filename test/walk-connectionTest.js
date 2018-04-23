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

var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"});

// constructor

// WalkConnection {
//  cid: 42,
//  source: null,
//  sink: null,
//  title: 'foo',
//  type: 'foobar',
//  weight: undefined,
//  styleClass: 'popovered walk-connection connection local foobar',
//  clipPath: 'url("#clip")',
//  line: 
//   { [Function: line]
//     x: [Function],
//     y: [Function],
//     defined: [Function],
//     curve: [Function],
//     context: [Function] },
//  errors: [],
//  walk: undefined }

describe('testing walk-connection.js', function() {
  it('WalkConnection constructor', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"});      
    assert.equal(walkconn.cid, 42);
    assert.equal(walkconn.source, null);  
    assert.equal(walkconn.sink, null);  
    assert.equal(walkconn.title, "foo");  
    assert.equal(walkconn.type, "foobar");  
    assert.equal(walkconn.weight, undefined);  
    assert.equal(walkconn.styleClass, "popovered walk-connection connection local foobar");   
    assert.equal(walkconn.clipPath, 'url("#clip")');     
    expect(walkconn.errors).to.eql([]).not.to.equal([]);
    expect(walkconn.walk).to.be.undefined;   
  });
});


// valid() 

describe('testing walk-connection.js', function() {
  it('WalkConnection valid()', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"});      
    expect(walkconn.valid()).to.be.false;
  });
});

// pinpoint()

describe('testing walk-connection.js', function() {
  it('WalkConnection pinpoint()', function() {
    var walkconn = new WalkConnection({"cid":42, 'title':"foo", "type":"foobar"});      
    expect(walkconn.pinpoint()).to.be.undefined;
  });
});

// console.log(walkconn.interConnectorEndpoints);
// TypeError

// looseConnectorEndpoints()
// TypeError: this.touchScale is not a function

// popoverTitle()
// TypeError: Cannot read property 'pid' of undefined



