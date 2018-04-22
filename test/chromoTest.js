
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


var chromo = require('../js/chromo.js');


// note --- we canont override these, it appears
//  this.scale = null;
//  this.innerScale = null;

// constructor

describe('testing chromo.js', function() {
  it('Chromo constructor', function() {
  	var Chromo = new chromo.Chromo({"chromosome":12, "startPoint":57000, "endPoint":65000, "color": "blue"});  
    assert.equal(Chromo.chromosome, 12);    
    assert.equal(Chromo.startPoint, 57000);  
    assert.equal(Chromo.endPoint, 65000);  
    assert.equal(Chromo.color, "blue");  
    assert.equal(Chromo.scale, null);  
    assert.equal(Chromo.innerScale, null);  
  });
});

//var Chromo = new chromo.Chromo({"chromosome":12, "startPoint":57000, "endPoint":65000, "color": "blue"}); 

// console.log(Chromo.contains(100));  // TypeError: Cannot read property 'range' of undefined

// Chromo.chromoGenome()  TypeError: Cannot read property 'domain' of null