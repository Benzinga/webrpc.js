var WebSocketServer = require('ws').Server;
var JSONCodec = require('./jsoncodec');
var Lz4Codec = require('./lz4codec');
var Promise = require('bluebird');

var NO_ACK = 0;

var INIT = 0;
var EVENT = 1;
var REPLY = 2;
var PING = 3;
var PONG = 4;

function WebRPCConn(ws, options) {
  if (!(this instanceof WebRPCConn)) {
    throw new Error('Please use the \'new\' operator.');
  }

  var self = this;

  function send(type, name, data, ack, force) {
    var message = {
      type: type,
      name: name,
      data: data,
      ack: ack
    };

    if (!force && !self.ready) {
      self.sendq.push(message);
      return;
    }

    return Promise.resolve(self.codec.encode(message)).then(function(event) {
      ws.send(event);
    });
  }

  function initMessageEvent(e) {
    Promise.resolve(self.codec.decode(e.data)).then(function(message) {
      switch (message.type) {
      case INIT:
        if (message.data && message.data.lz4) {
          self.codec = new Lz4Codec(self.codec);
        }

        // Set ready flag.
        self.ready = true;
        ws.onmessage = messageEvent;

        // Send queued messages.
        Promise.mapSeries(self.sendq, function(message) {
          return send(message.type, message.name, message.data, message.ack, true);
        });
        break;
      default:
        break;
      }
    });
  }

  function messageEvent(e) {
    Promise.resolve(self.codec.decode(e.data)).then(function(message) {
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
    });
  }

  function disconnectEvent(e) {
    if (self.ondisconnect) {
      self.ondisconnect(e);
    }
  }

  ws.onmessage = initMessageEvent;
  ws.on('close', disconnectEvent);

  // Connection state
  self.ws = ws;
  self.codec = new JSONCodec();
  self.sendq = [];
  self.ready = false;

  // Callbacks.
  self.ondisconnect = null;
  self.listeners = {};

  // Expose send.
  self._send = send;

  // Set up parameters.
  var params = {};

  if (options && options.lz4 !== undefined) {
    params.lz4 = options.lz4 == true;
  } else {
    params.lz4 = true;
  }

  // Send init message. Currently not used.
  send(INIT, undefined, params, undefined, true);
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
    var conn = new WebRPCConn(ws, options);

    if (self.onconnect) {
      self.onconnect(conn);
    }
  }

  wss.on('connection', connectionEvent);

  // Server
  self.wss = wss;

  // Callbacks.
  self.onconnect = null;
}

WebRPCServer.prototype.close = function close() {
  return this.wss.close();
};

module.exports = WebRPCServer;
module.exports.WebRPCConn = WebRPCConn;
