
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;


var misc = require('../js/misc.js');




describe('testing Misc functions', function() {
  it('isString()', function() {
    expect(misc.Misc.isString('foo')).to.be.true;
  });
});