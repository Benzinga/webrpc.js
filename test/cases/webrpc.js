var expect = require('chai').expect;
var WebRPC = require('../..');
var lolex = require('lolex');

var window = typeof global ? global : window;

describe('WebRPC', function() {
  var s = require('../server')();

  describe('#constructor', function() {
    it('should require new operator', function() {
      expect(WebRPC).to.throw(Error);
    });

    it('should connect to the server', function(done) {
      var client = new WebRPC(s.url);
      client.onconnect = function conn() { done(); };
    });
  });

  describe('#on', function() {
    it('should receive messages', function(done) {
      var client = new WebRPC(s.url);
      client.on('connected', function conn() { done(); });
    });

    it('should receive reply', function(done) {
      var client = new WebRPC(s.url);

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
  });

  describe('#send', function() {
    it('should send messages', function(done) {
      var client = new WebRPC(s.url);

      client.on('connected', function conn() {
        client.emit('hello');
      });

      client.on('hi', function hi() {
        done();
      });
    });

    it('should stay connected after invalid messages', function(done) {
      var client = new WebRPC(s.url);

      client.on('connected', function conn() {
        client._send(-1);
        client._send(3);
        client.emit('hello');
      });

      client.on('hi', function hi() {
        done();
      });
    });

    it('should queue messages', function(done) {
      var client = new WebRPC(s.url);

      client.emit('hello');

      client.on('hi', function conn() {
        done();
      });
    });
  });

  describe('#close', function() {
    it('should trigger client disconnect on close', function(done) {
      var client = new WebRPC(s.url);

      client.ondisconnect = function disconnectEvent() {
        client.ondisconnect = null;
        done();
      };

      client.close();
    });

    if (window.inBrowser)
      return;

    it('should trigger server disconnect on close', function(done) {
      var client = new WebRPC(s.url);

      s.serverDisconnect = function disconnectEvent() {
        s.serverDisconnect = null;
        done();
      };

      client.close();
    });
  });

  if (window.inBrowser)
    return;

  it('should reconnect after 1000ms', function(done) {
    var client = new WebRPC(s.url);
    var clock = lolex.install();

    client.ondisconnect = function disconnectEvent() {
      client.onconnect = function connectEvent() {
        done();
      };

      // Since the timer is scheduled AFTER the disconnect event, we need to
      // wait until next ev tick.
      process.nextTick(function cb() {
        clock.tick(1000);
      });
    };

    client.onconnect = function connectEvent() {
      for (var i = 0, l = s.server.wss.clients.length; i < l; ++i) {
        s.server.wss.clients[i].close(1001);
      }
    };
  });
});
