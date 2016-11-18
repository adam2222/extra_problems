'use strict';
/* global mountMatchesUrl */

/*----------- Helper function you can use -----------*/

// `mountMatchesUrl` is a function defined in `helper.js`, accessible here.

// It returns true if mount path matches beginning of url.
// Properly ignores query string and handles implicit trailing slash.
// Check out the `helper.js` file for more details & examples.

/*--------- Main App Constructor and Factory --------*/

var App = function () {
  this._chain = [];
};

var Middler = function(){
  return new App();
};

/*======== Follow the spec in middler.spec.js ========*/

// user interface (API) for registering middleware
App.prototype.use = function() {
  // ▼ DEFINE THIS FUNCTION ▼

};

// internal method triggered by a hypothetical HTTP request
App.prototype._handleHTTP = function(request, response) {
  // ▼ DEFINE THIS, CALLED ONCE PER HTTP REQUEST ▼

  function next(){
    // ▼ DEFINE THIS, CALLED ONCE FOR EACH MIDDLEWARE ▼

  }
  next(); // starts the chain
};
