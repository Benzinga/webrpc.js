var utf8 = require('utf8js');
var lz4 = require('lz4js');
var Promise = require('bluebird');

// Lz4Codec implements an Lz4 compression codec for WebRPC.
function Lz4Codec (codec) {
  if (!(this instanceof Lz4Codec)) {
    throw new Error('Please use the \'new\' operator.');
  }

  this._codec = codec;
}

Lz4Codec.prototype.encode = function lz4Encode (msg) {
  var text = Promise.resolve(this._codec.encode(msg));

  return text.then(utf8.encode).then(function (data) {
    var lzdata = lz4.compress(data);

    // Let's exploit websocket framing: the last 4 bytes of an Lz4 stream is
    // always zero, so put our size there. No dumb copies needed.
    lzdata[lzdata.length - 4] = (data.length >> 0) & 0xFF;
    lzdata[lzdata.length - 3] = (data.length >> 8) & 0xFF;
    lzdata[lzdata.length - 2] = (data.length >> 16) & 0xFF;
    lzdata[lzdata.length - 1] = (data.length >> 24) & 0xFF;

    return lzdata;
  });
};

Lz4Codec.prototype.decode = function lz4Decode (lzdata) {
  var len = 0;

  // Read uncompressed length.
  len |= lzdata[lzdata.length - 4] << 0;
  len |= lzdata[lzdata.length - 3] << 8;
  len |= lzdata[lzdata.length - 2] << 16;
  len |= lzdata[lzdata.length - 1] << 24;

  // Zero out last four bytes.
  lzdata[lzdata.length - 4] = 0;
  lzdata[lzdata.length - 3] = 0;
  lzdata[lzdata.length - 2] = 0;
  lzdata[lzdata.length - 1] = 0;

  // Uncompress.
  var data = lz4.decompress(lzdata, len);

  return utf8.decode(data).then(this._codec.decode);
};

module.exports = Lz4Codec;
