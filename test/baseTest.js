var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

const Base = require('../js/base.js');


/// not sure how to test his properly
// log() 

describe('testing fragment.js', function() {
  it('Fragment constructor', function() {
    var base = new Base();
    expect(base).to.eql({});
  });
});

