var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

const Base = require('../js/base.js').Base;


/// not sure how to test his properly
// log() 

describe('testing base.js', function() {
  it('Base', function() {
  	expect(Base).to.be.undefined;
  });
});
