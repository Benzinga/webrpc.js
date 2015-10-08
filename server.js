var WebSocketServer = require('ws').Server;
var JSONCodec = require('./jsoncodec');
var Promise = require('bluebird');

var NO_ACK = 0;

var EVENT = 1;
var REPLY = 2;
var PING = 3;
var PONG = 4;

function WebRPCConn(ws) {
  if (!(this instanceof WebRPCConn)) {
    throw new Error('Please use the \'new\' operator.');
  }

  var self = this;

  function send(type, name, data, ack) {
    var event = self.codec.encode({
      type: type,
      name: name,
      data: data,
      ack: ack
    });

    ws.send(event);
  }

  function messageEvent(data) {
    var message = self.codec.decode(data);

    switch (message.type) {
    case EVENT:
      var listener = self.listeners[message.name];
      if (listener) {
        if (message.ack !== NO_ACK) {
          var ret = listener.apply(self, message.data);
          Promise.resolve(ret).then(function then(value) {
            send(REPLY, message.name, [value], message.ack);
          });
        } else {
          listener.apply(self, message.data);
        }
      }
      break;

    case PING:
      send(PONG);
      break;

    default:
      break;
    }
  }

  function disconnectEvent(e) {
    if (self.ondisconnect) {
      self.ondisconnect(e);
    }
  }

  ws.on('message', messageEvent);
  ws.on('close', disconnectEvent);

  // Connection state
  self.ws = ws;
  self.codec = new JSONCodec();

  // Callbacks.
  self.ondisconnect = null;
  self.listeners = {};

  // Expose send.
  self._send = send;
}

WebRPCConn.prototype.on = function on(name, listener) {
  this.listeners[name] = listener;
};

WebRPCConn.prototype.emit = function emit() {
  var name = arguments[0];
  var params = Array.prototype.splice.call(arguments, 1);

  this._send(EVENT, name, params, NO_ACK);
};

function WebRPCServer(options) {
  if (!(this instanceof WebRPCServer)) {
    throw new Error('Please use the \'new\' operator.');
  }

  var self = this;
  var wss = new WebSocketServer(options);

  function connectionEvent(ws) {
    var conn = new WebRPCConn(ws);

    if (self.onconnect) {
      self.onconnect(conn);
    }
  }

  wss.on('connection', connectionEvent);

  // Callbacks.
  self.onconnect = null;
}

module.exports = WebRPCServer;
