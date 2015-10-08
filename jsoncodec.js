// JSONCodec implements a JSON codec for WebRPC (the default.)
function JSONCodec() {
  if (!(this instanceof JSONCodec)) {
    throw new Error('Please use the \'new\' operator.');
  }
}

JSONCodec.prototype.encode = function jsonEncode(msg) {
  return JSON.stringify(msg);
};

JSONCodec.prototype.decode = function jsonDecode(data) {
  return JSON.parse(data);
};

module.exports = JSONCodec;
