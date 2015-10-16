document.write('<div id="mocha"></div>');

require('mocha/mocha.css');
require('mocha/mocha.js');

window.inBrowser = true;
mocha.setup('bdd');

// Load all test cases.
function requireAll(r) { r.keys().forEach(r); }
requireAll(require.context("./cases", true, /\.js$/));

require('./mocha-sauce-client')();
