var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Base = require('../js/base.js').Base;
const Connection = require('../js/connection.js').Connection;


//  constructor(con) {
//    super();
//    this.cid = con.cid;
//    this.source = con.source ? {sign: Math.sign(con.source), intervalId: Math.abs(con.source)} : null;
//    this.sink = con.sink ? {sign: Math.sign(con.sink), intervalId: Math.abs(con.sink)} : null;
//    this.title = con.title;
//    this.type = con.type;
//    this.weight = con.weight;
//    this.styleClass = `popovered connection local ${con.type}`;
//    this.clipPath = 'url("#clip")';
//    this.line = d3.line().curve(d3.curveBasis).x((d) => d[0]).y((d) => d[1]);
//    this.errors = [];
//  }

// constructor


describe('testing connection.js', function() {
  it('Connection constructor', function() {
    var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});        // default
    assert.equal(connection.cid, 42);
    assert.equal(connection.source, null);  
    assert.equal(connection.sink, null);  
    assert.equal(connection.title, "foo");  
    assert.equal(connection.type, "foobar");  
    assert.equal(connection.weight, undefined);  
    assert.equal(connection.styleClass, "popovered connection local foobar");   
    assert.equal(connection.clipPath, 'url("#clip")');     
  });
});


// valid()

describe('testing connection.js', function() {
  it('checking Connection valid()', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});    
    expect(connection.valid()).to.be.false;      
  });
});


// pinpoint()
// both 'this.sink' and 'this.source' are 'null'
describe('testing connection.js', function() {
  it('checking Connection pinpoint()', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});    
    expect(connection.pinpoint()).to.be.undefined;      
  });
});

// locateAnchor()
// /Users/ebiederstedt/gGnome.js/js/connection.js:77
//     if ((this.source.place <= fragment.domain[1]) && (this.source.place >= fragment.domain[0])) {
//
// TypeError: Cannot read property 'place' of null



// transform()

describe('testing connection.js', function() {
  it('checking Connection transform', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});    
    assert.equal(connection.transform, 'translate(0,0)');      
  });
});


// render()
// /Users/ebiederstedt/gGnome.js/js/connection.js:122
//     var origin = d3.min([this.source.scale(this.source.place), this.sink.scale(this.sink.place)]);
//     
// TypeError: Cannot read property 'scale' of null


// interConnectorEndpoints()
// /Users/ebiederstedt/gGnome.js/js/connection.js:122
//     var origin = d3.min([this.source.scale(this.source.place), this.sink.scale(this.sink.place)]);
// 
// TypeError: Cannot read property 'scale' of null



// looseConnectorEndpoints()
// /Users/ebiederstedt/gGnome.js/js/connection.js:161
//       [this.touchScale(this.touchPlaceX), this.yScale(this.touchPlaceY)],
// 
// TypeError: this.touchScale is not a function


describe('testing connection.js', function() {
  it('checking Connection transform', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});    
    assert.equal(connection.popoverTitle, 'Connection #42 - foobar');      
  });
});



// popoverContent

describe('testing connection.js', function() {
  it('checking Connection transform', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});    
    assert.equal(connection.popoverContent.substring(0, 17), '<div class="row">');      
  });
});

// location

describe('testing connection.js', function() {
  it('checking Connection transform', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});      
    assert.equal(connection.location.substring(0, 7), 'Unknown');  
  });
});


// toString

describe('testing connection.js', function() {
  it('checking Connection transform', function() {
  	var connection = new Connection({"cid":42, 'title':"foo", "type":"foobar"});      
    assert.equal(connection.toString.substring(0, 21), 'identifier: undefined');  
  });
});






