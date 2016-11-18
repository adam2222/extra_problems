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

var Middler = function(){ // eslint-disable-line no-unused-vars
  return new App();
};

/*======== Follow the spec in middler.spec.js ========*/

// user interface (API) for registering middleware
App.prototype.use = function(path) {

  const chain = this._chain,
        start = typeof path === 'string' ? 1 : 0,
        handlers = [].slice.call(arguments, start);

  path = start ? path : '/';

  handlers.forEach(handler => {
    chain.push({
      mount: path,
      middleware: handler
    });
  });

};

// internal method triggered by a hypothetical HTTP request
App.prototype._handleHTTP = function(request, response) {

  const chain = this._chain,
        originalUrl = request.url;
  let link = 0;

  next();

  function next (err) {

    const current = chain[link++];
    request.url = originalUrl;

    if (!current) return final(response, err);

    if (mountMatchesUrl(current.mount, request.url)) {
      request.url = request.url.slice(current.mount.length);
      if (request.url[0] !== '/') request.url = '/' + request.url;
      const arity = current.middleware.length;
      try {
        if (!err && arity < 4) {
          return current.middleware(request, response, next);
        } else if (err && arity === 4) {
          return current.middleware(err, request, response, next);
        }
      } catch (caught) {
        err = caught;
      }
    }

    next(err);

  }

  function final (res, err) {
    if (!err) return;
    res.statusCode = err.status || 500;
    res.end(err);
  }

};
