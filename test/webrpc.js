var expect = require('chai').expect;
var WebRPC = require('..');

describe('WebRPC', function() {
  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(WebRPC).to.throw(Error);
    });
  });
});
