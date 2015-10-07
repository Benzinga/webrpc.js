var expect = require('chai').expect;
var JSONCodec = require('..').JSONCodec;

describe('JSONCodec', function() {
  var codec = new JSONCodec();

  describe('#encode', function() {
    it('should encode proper JSON', function() {
      var msg = {
        type: 1,
        name: 'test',
        data: [1, 2, 3],
        ack: 0
      };

      var data = codec.encode(msg);
      expect(JSON.parse(data)).to.deep.equal(msg);
    });
  });

  describe('#decode', function() {
    it('should decode JSON', function() {
      var msg = {
        type: 1,
        name: 'test',
        data: [1, 2, 3],
        ack: 0
      };

      var data = JSON.stringify(msg);
      expect(codec.decode(data)).to.deep.equal(msg);
    });
  });
});
