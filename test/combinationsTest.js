
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
  	//var try1 = combinations.k_combinations([1, 2, 3], 1)
    assert.equal(combinations.k_combinations([1, 2, 3], 1).length, 3);
    assert.equal(combinations.k_combinations([1, 2, 3], 2).length, 3);
    assert.equal(combinations.k_combinations([1, 2, 3], 3).length, 1);
    assert.equal(combinations.k_combinations([1, 2, 3], 4).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], 0).length, 0);
    assert.equal(combinations.k_combinations([1, 2, 3], -1).length, 0);
    assert.equal(combinations.k_combinations([], 0).length, 0);    
  });
});



 // combinations([1, 2, 3])
 // -> [[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]
 // 
 // combinations([1])
 // -> [[1]]

describe('testing combinations.js', function() {
  it('combinations(set), checking output lengths', function() {
  	//var try1 = combinations.k_combinations([1, 2, 3], 1)
    assert.equal(combinations.combinations([1, 2, 3]).length, 7);
    assert.equal(combinations.combinations([1]).length, 1);   
  });
});






