var WebRPCServer = require('../server');

var window = typeof global ? global : window;

function serve() {
  var s = {};
  s.port = 55001;
  s.url = 'ws://localhost:' + s.port + '/';

  // Browser mode: server runs separately in Node.
  if (window.inBrowser)
    return s;

  s.server = new WebRPCServer({ port: s.port });
  s.serverDisconnect = null;

  s.server.onconnect = function connectEvent(ws) {
    ws.emit('connected');
    ws.on('hello', function hello() {
      ws.emit('hi');
    });
    ws.on('how are you?', function mood() {
      return 'good';
    });
    ws.ondisconnect = function disconnectEvent() {
      if (s.serverDisconnect) {
        s.serverDisconnect();
      }
    };
  };

  return s;
}

function fileServe() {
  var http = eval("require('http')");

  var finalhandler = eval("require('finalhandler')");
  var serveStatic = eval("require('serve-static')");

  var serve = serveStatic("./build");

  var server = http.createServer(function(req, res) {
    var done = finalhandler(req, res);
    serve(req, res, done);
  });

  server.listen(8080);

  return server;
}

function sauceTest(fn) {
  var sauceConnectLauncher = eval("require('sauce-connect-launcher')");
  var MochaSauce = eval("require('./mocha-sauce-server')");

  // Open a sauce-connect connection.
  sauceConnectLauncher({
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    build: process.env.TRAVIS_BUILD_NUMBER,
    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
  }, function (err, sauceConnectProcess) {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log("Sauce Connect ready");

    var sauce = new MochaSauce({
      name: "webrpc.js",
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      build: process.env.TRAVIS_BUILD_NUMBER,
      tunnel: process.env.TRAVIS_JOB_NUMBER,
      url: "http://localhost:8080/"
    });

    // A simple browser matrix.
    sauce.browser({ browserName: 'firefox', platform: 'Windows 7' });
    sauce.browser({ browserName: 'chrome', platform: 'Windows 7' });
    sauce.browser({ browserName: 'internet explorer', version: '10', platform: 'Windows 7' });
    sauce.browser({ browserName: 'internet explorer', version: '11', platform: 'Windows 7' });

    // Console output for debugging.
    sauce.on('init', function(browser) {
      console.log('  init : %s %s', browser.browserName, browser.platform);
    });
    sauce.on('start', function(browser) {
      console.log('  start : %s %s', browser.browserName, browser.platform);
    });
    sauce.on('end', function(browser, res) {
      console.log('  end : %s %s : %d failures', browser.browserName, browser.platform, res.failures);
    });

    // Run tests, close tunnel, run callback.
    sauce.start(function() {
      sauceConnectProcess.close(function () {
        console.log("Closed Sauce Connect process");
      });

      if (fn) fn();
    });
  });
}

function harness() {
  process.chdir(__dirname);
  var webpack = eval("require('webpack')");
  var cfg = eval("require('./webpack.config')");

  // start websocket server
  var s = serve().server;

  // compile code
  webpack(cfg, function(err, stats) {
    if (err)
      throw err;

    var fs = fileServe();

    // If SAUCE_ACCESS_KEY is set, test via SauceLabs.
    if (process.env.SAUCE_ACCESS_KEY)
      sauceTest(function() {
        s.close();
        fs.close();
        process.exit();
      });
  })
}

require.main === module && harness();
module.exports = serve;
