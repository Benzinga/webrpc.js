var expect = require('chai').expect;
var WebRPCServer = require('../../server');
var WebRPCConn = require('../../server').WebRPCConn;

describe('WebRPCConn', function() {
  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(WebRPCConn).to.throw(Error);
    });
  });
});

describe('WebRPCServer', function() {
  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(WebRPCServer).to.throw(Error);
    });
  });
});
