
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

/// examples

describe('Array', function() {
  it('should start empty', function() {
    var arr = [];

    assert.equal(arr.length, 0);
  });
});


describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});

var user = {name: 'Scott'};

// Requirement: The object 'user' should have the property 'name'


describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      expect(user).to.have.property('name');  
    });
  });
});
