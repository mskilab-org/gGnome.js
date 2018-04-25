

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


var combinations = require('../js/combinations.js');



 //   k_combinations([1, 2, 3], 1)
 //  -> [[1], [2], [3]]
 // 
 //   k_combinations([1, 2, 3], 2)
 //   -> [[1,2], [1,3], [2, 3]]
 // 
 //   k_combinations([1, 2, 3], 3)
 //   -> [[1, 2, 3]]
 // 
 //   k_combinations([1, 2, 3], 4)
 //   -> []
 // 
 //   k_combinations([1, 2, 3], 0)
 //   -> []
 // 
 //   k_combinations([1, 2, 3], -1)
 //   -> []
 // 
 //   k_combinations([], 0)
 //   -> []



describe('testing combinations.js', function() {
  it('k_combinations(set, k), checking output lengths', function() {
    assert.equal(combinations.k_combinations([1, 2, 3], 1).length, 3);
    assert.equal(combinations.k_combinations([1, 2, 3], 2).length, 3);
    assert.equal(combinations.k_combinations([1, 2, 3], 3).length, 1);
    assert.equal(combinations.k_combinations([1, 2, 3], 4).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], 0).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], -1).length, 0);
    assert.equal(combinations.k_combinations([], 0).length, 0);    
  });
});


describe('testing combinations.js', function() {
  it('k_combinations(set, k), check output elements', function() {
    assert.equal(combinations.k_combinations([1, 2, 3], 1)[0], 1);
    expect(combinations.k_combinations([1, 2, 3], 2)[0]).to.eql([1, 2]).but.not.equal([1, 2]);
    expect(combinations.k_combinations([1, 2, 3], 3)[0]).to.eql([1, 2, 3]).but.not.equal([1, 2, 3]);
    assert.equal(combinations.k_combinations([1, 2, 3], 4).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], 0).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], -1).length, 0);
    assert.equal(combinations.k_combinations([], 0).length, 0);    
  });
});




describe('testing combinations.js', function() {
  it('combinations(set), checking output lengths', function() {
    assert.equal(combinations.combinations([1, 2, 3]).length, 7);
    assert.equal(combinations.combinations([1]).length, 1);   
  });
});


describe('testing combinations.js', function() {
  it('combinations(set), checking output elements', function() {
    assert.equal(combinations.combinations([1, 2, 3])[0], 1);
    expect(combinations.combinations([1, 2, 3])[3]).to.eql([1, 2]).but.not.equal([1, 2]);
    expect(combinations.combinations([1, 2, 3])[6]).to.eql([1, 2, 3]).but.not.equal([1, 2, 3]);
    assert.equal(combinations.combinations([1])[0], 1);   
  });
});






