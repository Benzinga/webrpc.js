var utf8 = require('utf8js');
var lz4 = require('lz4js');

// Lz4Codec implements an Lz4 compression codec for WebRPC.
function Lz4Codec(codec) {
  if (!(this instanceof Lz4Codec)) {
    throw new Error('Please use the \'new\' operator.');
  }

  this._codec = codec;
}

Lz4Codec.prototype.encode = function lz4Encode(msg) {
  var text = JSON.stringify(msg);

  return utf8.encode(text).then(function(data) {
    var lzdata = lz4.compress(data);
    var buf = new Uint8Array(lzdata.length + 4);

    // Write uncompressed length to output buffer.
    buf[0] = (text.length >> 0) & 0xFF;
    buf[1] = (text.length >> 8) & 0xFF;
    buf[2] = (text.length >> 16) & 0xFF;
    buf[3] = (text.length >> 24) & 0xFF;

    // Copy lzdata to output buffer.
    for (var i = 0; i < lzdata.length; i++) {
      buf[i + 4] = lzdata[i];
    }

    return buf;
  });
};

Lz4Codec.prototype.decode = function lz4Decode(buf) {
  var lzdata = new Uint8Array(buf.length - 4);
  var len = 0;

  // Read uncompressed length.
  len |= buf[0] << 0;
  len |= buf[1] << 8;
  len |= buf[2] << 16;
  len |= buf[3] << 24;

  // Copy lz4 data to buffer.
  for (var i = 0; i < buf.length; i++) {
    lzdata[i] = buf[i + 4];
  }

  // Uncompress.
  var data = lz4.uncompress(lzdata);

  return utf8.decode(data);
};

module.exports = Lz4Codec;
