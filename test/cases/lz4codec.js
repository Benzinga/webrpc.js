/* eslint-env node, mocha */
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var JsonCodec = require('../../jsoncodec');
var Lz4Codec = require('../../lz4codec');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('Lz4Codec', function() {
  var codec = new Lz4Codec(new JsonCodec());

  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(Lz4Codec).to.throw(Error);
    });
  });

  describe('#encode', function() {
    it('should encode proper Lz4', function() {
      var msg = {
        type: 1,
        name: 'test',
        data: [1, 2, 3],
        ack: 0
      };

      var data = new Uint8Array([
         47,   0,   0,   0,   4,  34,  77,  24,  64, 112, 223,  47,
          0,   0, 128, 123,  34, 116, 121, 112, 101,  34,  58,  49,
         44,  34, 110,  97, 109, 101,  34,  58,  34, 116, 101, 115,
        116,  34,  44,  34, 100,  97, 116,  97,  34,  58,  91,  49,
         44,  50,  44,  51,  93,  44,  34,  97,  99, 107,  34,  58,
         48, 125,   0,   0,   0,   0
      ]);

      return expect(codec.encode(msg)).to.eventually.deep.equal(data);
    });
  });

  describe('#decode', function() {
    it('should decode Lz4', function() {
      var msg = {
        type: 1,
        name: 'test',
        data: [1, 2, 3],
        ack: 0
      };

      var data = new Uint8Array([
         47,   0,   0,   0,   4,  34,  77,  24,  64, 112, 223,  47,
          0,   0, 128, 123,  34, 116, 121, 112, 101,  34,  58,  49,
         44,  34, 110,  97, 109, 101,  34,  58,  34, 116, 101, 115,
        116,  34,  44,  34, 100,  97, 116,  97,  34,  58,  91,  49,
         44,  50,  44,  51,  93,  44,  34,  97,  99, 107,  34,  58,
         48, 125,   0,   0,   0,   0
      ]);

      return expect(codec.decode(data)).to.eventually.deep.equal(msg);
    });
  });
});
