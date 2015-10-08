var expect = require('chai').expect;
var WebRPC = require('..');
var WebRPCServer = require('../server');
var WebRPCConn = WebRPCServer.WebRPCConn;

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

describe('WebRPC', function() {
  var port = 13000 + 0|Math.random()*1000;
  var url = "ws://localhost:" + port + "/";
  var server = new WebRPCServer({ port: port });
  var serverDisconnect = null;

  server.onconnect = function connectEvent(ws) {
    ws.emit('connected');
    ws.on('hello', function hello() {
      ws.emit('hi');
    });
    ws.on('how are you?', function mood() {
      return 'good';
    });
    ws.ondisconnect = function disconnectEvent() {
      if (serverDisconnect) {
        serverDisconnect();
      }
    };
  };

  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(WebRPC).to.throw(Error);
    });

    it('should connect to the server', function(done) {
      var client = new WebRPC(url);
      client.onconnect = function conn() { done(); };
    });

    it('should receive messages', function(done) {
      var client = new WebRPC(url);
      client.on('connected', function conn() { done(); });
    });

    it('should send messages', function(done) {
      var client = new WebRPC(url);

      client.on('connected', function conn() {
        client.emit('hello');
      });

      client.on('hi', function hi() {
        done();
      });
    });

    it('should receive reply', function(done) {
      var client = new WebRPC(url);

      client.on('connected', function conn() {
        client.emit('hello');
      });

      client.on('hi', function hi() {
        client.emit('how are you?', function mood(value) {
          expect(value).to.be.equal('good');
          done();
        });
      });
    });

    it('should stay connected after invalid messages', function(done) {
      var client = new WebRPC(url);

      client.on('connected', function conn() {
        client._send(-1);
        client._send(3);
        client.emit('hello');
      });

      client.on('hi', function hi() {
        done();
      });
    });

    it('should trigger client disconnect on close', function(done) {
      var client = new WebRPC(url);

      client.ondisconnect = function disconnectEvent() {
        client.ondisconnect = null;
        done();
      };

      client.close();
    });

    it('should trigger server disconnect on close', function(done) {
      var client = new WebRPC(url);

      serverDisconnect = function disconnectEvent() {
        serverDisconnect = null;
        done();
      };

      client.close();
    });

    it('should queue messages', function(done) {
      var client = new WebRPC(url);

      client.emit('hello');

      client.on('hi', function conn() {
        done();
      });
    });
  });
});
