var expect = require('chai').expect;
var WebRPC = require('../..');

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
      
      client.onconnect = function() {
        client.ondisconnect = function() {
          if (done) {
            var d = done;
            done = null; // This prevents it from being called again
            d();
          }
        };
        client.close();
      };
    });

    it('should trigger server disconnect on close', function(done) {
      var client = new WebRPC(s.url);
      
      client.onconnect = function() {
        s.serverDisconnect = function() {
          if (done) {
            var d = done;
            done = null; // This prevents it from being called again
            d();
          }
        };
        client.close();
      };
    });
  });

  /* Begin Node Only Test Cases ***********************************************/
  if (window.inBrowser) return;

  it('should reconnect after 1000ms', function(done) {
    this.timeout(5000); // 5 seconds is plenty for a 1-second reconnect
    var client = new WebRPC(s.url);

    client.onconnect = function() {
      // First connection is successful, now set up the disconnect-to-reconnect flow
      client.ondisconnect = function disconnectEvent() {
        
        // This will be called once the 1000ms backoff timer finishes
        client.onconnect = function connectEvent() {
          done();
        };
      };

      // Kick the client from the server side
      if (s.server && s.server.wss && s.server.wss.clients) {
        s.server.wss.clients.forEach(function(c) {
          c.close();
        });
      }
    };
  });
  /* End Node Only Test Cases *************************************************/
});
