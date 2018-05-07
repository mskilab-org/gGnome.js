var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

const Base = require('../js/base.js');

var sinon = require("sinon");


/// not sure how to test his properly
// log() 

describe('testing fragment.js', function() {	
  it('Fragment constructor', function() {
    var base = new Base();
    expect(base.log()).to.undefined;  // makes sense as returning nothing
  });
});


// revise to use Sinon
// expect(base.log()).to.undefined;  // makes sense as returning nothing



// various notes:

// brush-container.js 
// involves the functionality pertaining to the brush and zoom

// index.js 
// this is the entry point
// it initialises the Frame class and contains the data loading part
// it has the functionality for resizing the browser
// and the reaction to the navigation bar buttons

// misc.js 
// contains auxilliary functions

// SVGFilter.js 
// contains the functionality to build the gradients for the rectangles on top of the panels
// the color gradients for the rectangles showing the chromosome for each panel