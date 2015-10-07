var WebSocket = require('ws');

var DEFAULT_BACKOFF = 1000;
var MAX_BACKOFF = 30000;
var BACKOFF_INCR = 2000;

var EVENT = 1;
var REPLY = 2;
var PING = 3;
var PONG = 4;

var NO_ACK = 0;

// isObject returns true if the provided value is an object. (From lodash.)
function isObject(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function');
}

// isFunction returns true if the provided value is a function.
function isFunction(value) {
  return isObject(value) && Object.prototype.toString.call(value) === '[object Function]';
}

// WebRPC implements the WebRPC client.
function WebRPC(url, codec) {
  if (!(this instanceof WebRPC)) {
    throw new Error('Please use the \'new\' operator.');
  }

  var self = this;
  var backoff = DEFAULT_BACKOFF;

  function connect() {
    var ws = new WebSocket(url);
    ws.addEventListener('open', openEvent);
    ws.addEventListener('close', closeEvent);
    ws.addEventListener('message', messageEvent);

    return ws;
  }

  function send(type, name, data, ack) {
    var event = self.codec.encode({
      type: type,
      name: name,
      data: data,
      ack: ack
    });

    if (self.ws.readyState === 0) {
      self.sendq.push(event);
    } else {
      self.ws.send(event);
    }
  }

  function openEvent(e) {
    // Send queued events.
    for (var i = 0, len = self.sendq.length; i < len; i++) {
      self.ws.send(self.sendq[i]);
    }
    self.sendq = [];

    // Run onconnect handler.
    if (self.onconnect) {
      self.onconnect(e);
    }

    // Reset the reconnect backoff.
    backoff = DEFAULT_BACKOFF;
  }

  function closeEvent(e) {
    // Run ondisconnect handler.
    if (self.ondisconnect) {
      self.ondisconnect(e);
    }

    // Try reconnecting.
    setTimeout(backoff, function tryConnect() {
      self.ws = connect();
    });

    // Increase the reconnect backoff.
    backoff += BACKOFF_INCR;
    if (backoff > MAX_BACKOFF) {
      backoff = MAX_BACKOFF;
    }
  }

  function messageEvent(e) {
    // Decode message.
    var message = self.codec.decode(e.data);

    switch (message.type) {
    case PING:
      send(PONG);
      break;

    case REPLY:
      var resolve = self.dispatch[message.ack];
      if (resolve) {
        resolve.apply(self, message.data);
        delete self.dispatch[message.ack];
      }
      break;

    case EVENT:
      var listeners = self.listenermap[message.name];
      if (listeners) {
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i].apply(self, message.data);
        }
      }
      break;

    default:
      break;
    }
  }

  // Connection state.
  this.ws = connect();
  this.codec = codec || new JSONCodec();
  this.ack = 0;

  // RPC data.
  this.sendq = [];      // List of queued messages.
  this.dispatch = {};   // Map of ack ID => dispatch function.
  this.listenermap = {};  // Map of event name => array of listener functions.

  // Callbacks.
  this.onconnect = null;
  this.ondisconnect = null;

  // Expose direct send.
  this._send = send;
}

WebRPC.prototype.on = function on(name, listener) {
  var listeners = this.listenermap[name];

  if (!listeners) {
    listeners = [];
  }

  listeners.push(listener);

  this.listenermap[name] = listeners;
};

WebRPC.prototype.emit = function emit() {
  var name = arguments[0];
  var params = Array.prototype.splice.call(arguments, 1);

  if (isFunction(params[params.length - 1])) {
    var callback = params.pop();
    this._send(EVENT, name, params, ++self.ack);
    this.dispatch[self.ack] = callback;
  } else {
    this._send(EVENT, name, params, NO_ACK);
  }
};

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

module.exports = WebRPC;
module.exports.JSONCodec = JSONCodec;
