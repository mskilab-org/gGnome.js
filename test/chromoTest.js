
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


const Chromo = require("../js/chromo.js").Chromo;


// note --- we canont override these, it appears
//  this.scale = null;
//  this.innerScale = null;

// constructor

describe('testing chromo.js', function() {
  it('Chromo constructor', function() {
  	var chromo = new Chromo({"chromosome":12, "startPoint":57000, "endPoint":65000, "color": "blue"});  
    assert.equal(chromo.chromosome, 12);    
    assert.equal(chromo.startPoint, 57000);  
    assert.equal(chromo.endPoint, 65000);  
    assert.equal(chromo.color, "blue");  
    assert.equal(chromo.scale, null);  
    assert.equal(chromo.innerScale, null);  
  });
});

//var Chromo = new chromo.Chromo({"chromosome":12, "startPoint":57000, "endPoint":65000, "color": "blue"}); 

// console.log(Chromo.contains(100));  // TypeError: Cannot read property 'range' of undefined

// Chromo.chromoGenome()  TypeError: Cannot read property 'domain' of null