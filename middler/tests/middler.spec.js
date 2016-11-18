'use strict';
/* global Middler sinon */
/* eslint-disable callback-return, new-cap, max-statements-per-line */

// write your solution in `/source/middler.js`
describe('app', function(){

  var app;
  beforeEach(function(){
    app = Middler();
  });

  // our test middleware function, for which we will make spy versions
  function goToNext (req, res, next) { if (next) next(); }

  // this will let our spies have "names" for more descriptive test errors
  var namedFuncs = {
    middleware1: goToNext,
    middleware2: goToNext,
    middleware3: goToNext,
    middleware4: goToNext,
    middleware5: goToNext
  };

  // spies are just functions that keep track of whether they were called, what they were called with, how many times they were called, etc. These spies all call a third parameter `next`, if it is defined.
  var middleware1 = sinon.spy(namedFuncs, 'middleware1');
  var middleware2 = sinon.spy(namedFuncs, 'middleware2');
  var middleware3 = sinon.spy(namedFuncs, 'middleware3');
  var middleware4 = sinon.spy(namedFuncs, 'middleware4');
  var middleware5 = sinon.spy(namedFuncs, 'middleware5');

  // every test will begin with a blank slate (spies with no meta-information)
  beforeEach(function(){
    middleware1.reset();
    middleware2.reset();
    middleware3.reset();
    middleware4.reset();
    middleware5.reset();
  });

  describe('.use', function(){

    it('registers a given middleware function, mounted by default at the root', function(){
      // register middleware
      app.use(middleware1);
      // test app state
      expect(app._chain).toEqual([
        { mount: '/', middleware: middleware1 }
      ]);
    });

    it('registers multiple middleware via successive calls', function(){
      // register middleware
      app.use(middleware1);
      app.use(middleware2);
      app.use(middleware3);
      // test app state
      expect(app._chain).toEqual([
        { mount: '/', middleware: middleware1 },
        { mount: '/', middleware: middleware2 },
        { mount: '/', middleware: middleware3 }
      ]);
    });

    // don't hard-code many params; use `arguments`
    it('registers multiple middleware through a single call', function(){
      // register middleware
      app.use(middleware1, middleware2, middleware3);
      // test app state
      expect(app._chain).toEqual([
        { mount: '/', middleware: middleware1 },
        { mount: '/', middleware: middleware2 },
        { mount: '/', middleware: middleware3 }
      ]);
    });

    describe('custom mounting', function(){

      it('registers a given middleware function for a specific mount path', function(){
        // register middleware
        app.use('/bagels', middleware1);
        // test app state
        expect(app._chain).toEqual([
          { mount: '/bagels', middleware: middleware1 }
        ]);
      });

      it('registers given middleware for multiple mount paths', function(){
        // register middleware
        app.use('/cereal', middleware1);
        app.use('/cereal/cheerios', middleware2);
        app.use('/', middleware3);
        app.use('/admin', middleware4);
        // test app state
        expect(app._chain).toEqual([
          { mount: '/cereal', middleware: middleware1 },
          { mount: '/cereal/cheerios', middleware: middleware2 },
          { mount: '/', middleware: middleware3 },
          { mount: '/admin', middleware: middleware4 }
        ]);
      });

      it('registers multiple middleware for a specific mount path', function(){
        // register middleware
        app.use('/bagels', middleware1, middleware2, middleware3);
        // test app state
        expect(app._chain).toEqual([
          { mount: '/bagels', middleware: middleware1 },
          { mount: '/bagels', middleware: middleware2 },
          { mount: '/bagels', middleware: middleware3 }
        ]);
      });

      it('registers multiple middleware for multiple mount paths', function(){
        // register middleware
        app.use('/cereal', middleware1, middleware2, middleware4);
        app.use('/cereal/cheerios', middleware3);
        app.use('/', middleware2, middleware1);
        app.use('/admin', middleware4);
        // test app state
        expect(app._chain).toEqual([
          { mount: '/cereal', middleware: middleware1 },
          { mount: '/cereal', middleware: middleware2 },
          { mount: '/cereal', middleware: middleware4 },
          { mount: '/cereal/cheerios', middleware: middleware3 },
          { mount: '/', middleware: middleware2 },
          { mount: '/', middleware: middleware1 },
          { mount: '/admin', middleware: middleware4 }
        ]);
      });

    });

  });

  describe('._handleHTTP', function(){

    var request, response, end = sinon.spy(function end () {
      if (response.headersSent) throw new Error('cannot set headers after they are sent');
      response.headersSent = true;
    });
    beforeEach(function(){
      request = {
        method: 'GET',
        url: '/'
      };
      response = {
        statusCode: undefined,
        headersSent: false,
        end: end
      };
      end.reset();
    });

    describe('core functionality', function(){

      it('calls a registered middleware function with the request and response objects created by a Node.js server, plus a `next` function', function(){
        // register middleware
        app.use(middleware1); // mounted by default at the `/` URI
        expect(middleware1).not.toHaveBeenCalled();
        // simulate http event
        app._handleHTTP(request, response);
        // sinon.match.func is a test tool that matches any function
        expect(middleware1).toHaveBeenCalledWith(request, response, sinon.match.func);
      });

      it('calls multiple registered middleware functions in order', function(){
        var log = '';
        function writeA (req, res, next) { log += 'A'; if (next) next(); }
        function writeB (req, res, next) { log += 'B'; if (next) next(); }
        function writeC (req, res, next) { log += 'C'; if (next) next(); }
        // register middleware
        app.use(writeA, writeB, writeC, middleware4);
        expect(log).toBe('');
        // simulate http event
        app._handleHTTP(request, response);
        expect(log).toBe('ABC');
        expect(middleware4).toHaveBeenCalledWith(request, response, sinon.match.func);
      });

    });

    describe('mount path matching and url modification', function(){

      it('skips middleware whose mount path does not equal the request url', function(){
        // simulate an HTTP request for the `/puppies` URI
        request.url = '/puppies';
        // m1 on wrong mount path
        app.use('/kittens', middleware1);
        app._handleHTTP(request, response);
        expect(middleware1).not.toHaveBeenCalled();
        // m2 on correct mount path
        app.use('/puppies', middleware2);
        app._handleHTTP(request, response);
        expect(middleware1).not.toHaveBeenCalled();
        expect(middleware2).toHaveBeenCalledWith(request, response, sinon.match.func);
      });

      // REMEMBER: we are giving you a convenient `mountMatchesUrl` function!
      it('skips middleware whose mount path does not *match* the request url', function(){
        // simulate an HTTP request for all the contented sounds Felix makes
        request.url = '/kittens/felix/sounds?type=contented';
        // m1 on various non-matching mount paths: m1 is not called
        app.use('/kitten', middleware1);
        app.use('/api/kittens', middleware1);
        app.use('/puppies', middleware1);
        app.use('/kittens/felix/siblings', middleware1);
        app._handleHTTP(request, response);
        expect(middleware1).not.toHaveBeenCalled();
        // m2, 3, 4, 5 on matching mount paths: m1 – 5 all called
        app.use('/kittens', middleware2);
        app.use('/kittens/', middleware3);
        app.use('/kittens/felix', middleware4);
        app.use('/kittens/felix/sounds', middleware5);
        app._handleHTTP(request, response);
        expect(middleware1).not.toHaveBeenCalled();
        expect(middleware2).toHaveBeenCalledWith(request, response, sinon.match.func);
        expect(middleware3).toHaveBeenCalledWith(request, response, sinon.match.func);
        expect(middleware4).toHaveBeenCalledWith(request, response, sinon.match.func);
        expect(middleware5).toHaveBeenCalledWith(request, response, sinon.match.func);
      });

      // note: in reality this gets more complicated with potential trailing slashes, but we will ignore that for simplicity's sake
      it('temporarily strips the mount off of req.url when the mount and url match', function() {

        /**
         * You might imagine that if I made a request to http://localhost/kittens/felix
         * that the `req.url` property would be http://localhost/kittens/felix. If not that
         * you could imagine it would be /kittens/felix. This is not necessarily the case.
         * In express, `req.url` has _perspective_.
         */

        /**
         * If we make a request to `/` and we have middleware mounted at `/`, the `req.url`
         * will be `/`. No surprises there.
         */
        var reqUrl = getReqUrlFromPerspectiveOfMiddleware('/', '/');
        expect(reqUrl).toBe('/');

        /**
         * If we make a request to `/kittens/felix` and we have middleware mounted at `/`
         * the `req.url` will be `/kittens/felix`. Also no big surprises!
         */
        reqUrl = getReqUrlFromPerspectiveOfMiddleware('/', '/kittens/felix');
        expect(reqUrl).toBe('/kittens/felix');

        /**
         * If we have middleware mounted at `/kittens` (meaning we only want it to fire
         * if the client's requet's URL begins with `/kittens`), and we make a request to
         * `/kittens/felix`, the middleware will fire. But! the `req.url` will be `/felix`
         * and *not* `/kittens/felix`. Another way to look at this is that the
         *
         *     `req.url` = request's path - middleware mounting path
         *
         */
        reqUrl = getReqUrlFromPerspectiveOfMiddleware('/kittens', '/kittens/felix');
        expect(reqUrl).toBe('/felix');

        /** One more example */
        reqUrl = getReqUrlFromPerspectiveOfMiddleware('/puppies/rover', '/puppies/rover/bone');
        expect(reqUrl).toBe('/bone');

        /**
         * mounts middleware on the app, makes a request, records the `req.url` from the perspective
         * of that middleware.
         * @param  {String} middlewarePath       this is the path that goes into app.use()
         * @param  {String} requestUrl           URL requested from the client
         * @return {String}                      the `req.url` as observed inside the middleware callback
         */
        function getReqUrlFromPerspectiveOfMiddleware(middlewarePath, requestUrl) {
          request.url = requestUrl;
          var tempUrl;
          app.use(middlewarePath, function(req) {
            tempUrl = req.url;
          });
          app._handleHTTP(request, response);
          // prevents side effects
          app._chain.pop();
          return tempUrl;
        }

      });

      it('restores the original url after each middleware, so it can match the next mount path', function(){
        var tempUrl1, tempUrl2;
        request.url = '/kittens/felix/friends';
        app.use('/kittens', function(req, res, next){
          tempUrl1 = req.url;
          next();
        });
        app.use('/kittens/felix', function(req, res, next){
          tempUrl2 = req.url;
          next();
        });
        app._handleHTTP(request, response);
        expect(tempUrl1).toBe('/felix/friends');
        expect(tempUrl2).toBe('/friends');
        expect(request.url).toBe('/kittens/felix/friends');
      });

    });

    describe('explicitly passing control', function(){

      it('only continues on to the next middleware when the current middleware calls `next`', function(){
        var log = '';
        app.use(function f1 (req, res, next){
          log += 'called f1.';
          next();
        });
        app.use(function f2 (req, res, next){
          log += ' called f2.';
          // does not call next!
        });
        app.use(function f3 (req, res, next){
          log += ' called f3.';
          next();
        });
        expect(log).toBe('');
        app._handleHTTP(request, response);
        expect(log).toBe('called f1. called f2.'); // never got to f3
      });

      it('can handle async middleware by letting the `next` call asynchronously trigger the next middleware in the chain.', function(done){
        var log = '';
        app.use(function f1 (req, res, next){
          log += 'called f1.';
          next();
        });
        app.use(function f2 (req, res, next){
          log += ' called f2.';
          setTimeout(function(){
            next();
          }, 100); // calls `next` only after 0.1 seconds
        });
        app.use(function f3 (req, res, next){
          log += ' called f3.';
          next();
        });
        expect(log).toBe('');
        app._handleHTTP(request, response);
        expect(log).toBe('called f1. called f2.'); // hasn't called f3 yet!
        setTimeout(function(){
          expect(log).toBe('called f1. called f2. called f3.');
          done();
        }, 200); // 0.2 seconds later, f3 was called after calling `next`.
      });

    });

    // NOTE: at this point, you can proceed to the bonus specs in `/test/xtra.spec.js` if you want to try actually writing an example middleware function. The following error-handling section is good to understand for Express but is not required for the bonus specs.
    describe('error handling', function(){

      // our test error-handling middleware has arity 4 (4 named parameters) and calls `next` with the existing error in order to continue on to the next available error-handling middleware.
      function nextErr (err, req, res, next) { if (next) next(err); }
      namedFuncs.errMiddleware1 = nextErr;
      namedFuncs.errMiddleware2 = nextErr;
      var errMiddleware1 = sinon.spy(namedFuncs, 'errMiddleware1');
      var errMiddleware2 = sinon.spy(namedFuncs, 'errMiddleware2');

      beforeEach(function(){
        errMiddleware1.reset();
        errMiddleware2.reset();
      });

      it('does not execute middleware with arity 4 (i.e. middleware with 4 named parameters) if there is no error', function(){
        app.use(errMiddleware1);
        app._handleHTTP(request, response);
        expect(errMiddleware1).not.toHaveBeenCalled();
      });

      it('*skips* error-handling middleware (arity 4) if there is no error, by moving on to the next normal middleware (arity 3 or less)', function(){
        // middleware registration
        app.use(middleware1);
        app.use(errMiddleware1);
        app.use(errMiddleware2);
        app.use(middleware2);
        // simulate HTTP event
        app._handleHTTP(request, response);
        // test what happened to the spies
        expect(middleware1).toHaveBeenCalled();
        expect(errMiddleware1).not.toHaveBeenCalled();
        expect(errMiddleware2).not.toHaveBeenCalled();
        expect(middleware2).toHaveBeenCalled();
      });

      describe('explicit triggering', function(){

        it('executes error middleware if a truthy value is passed to the `next` function', function(){
          // error instances (objects) are one example of a truthy value
          var errObj = new Error('example error object');
          // middleware registration
          app.use(middleware1);
          app.use(function triggersError (req, res, next){
            next(errObj); // deliberate error triggering
          });
          app.use(errMiddleware1);
          // simulate HTTP event
          app._handleHTTP(request, response);
          // test what happened to the spies
          expect(middleware1).toHaveBeenCalled();
          expect(errMiddleware1).toHaveBeenCalledWith(errObj, request, response, sinon.match.func);
        });

        it('skips normal middleware if there is an error, until it reaches the next error-handling middleware', function(){
          var errObj = new Error('example error object');
          // middleware registration
          app.use(middleware1);
          app.use(function triggersError (req, res, next){
            next(errObj); // deliberate error triggering
          });
          app.use(middleware2);
          app.use(middleware3);
          app.use(errMiddleware1);
          // simulate HTTP event
          app._handleHTTP(request, response);
          // test what happened to the spies
          expect(middleware1).toHaveBeenCalled();
          expect(middleware2).not.toHaveBeenCalled();
          expect(middleware3).not.toHaveBeenCalled();
          expect(errMiddleware1).toHaveBeenCalledWith(errObj, request, response, sinon.match.func);
        });

        // the devil is in the details… lots of combinations to check!
        it('skips normal middleware even following middleware with the wrong mount if there is an error, until it reaches the next error-handling middleware', function(){
          var errObj = new Error('example error object');
          // middleware registration
          app.use(function triggersError (req, res, next){
            next(errObj); // deliberate error triggering
          });
          app.use('/kittens', middleware1);
          app.use(middleware2);
          app.use(errMiddleware1);
          // simulate HTTP event
          app._handleHTTP(request, response);
          // test what happened to the spies
          expect(middleware1).not.toHaveBeenCalled();
          expect(middleware2).not.toHaveBeenCalled();
          expect(errMiddleware1).toHaveBeenCalledWith(errObj, request, response, sinon.match.func);
        });

      });

      describe('thrown error', function(){

        // hint: you will have to use the try-catch syntax for these

        it('activates error-handling middleware if normal middleware throws an error', function(){
          var errObj = new Error('catch me if you can!');
          // middleware registration
          app.use(function throwsError (req, res, next){
            throw errObj;
          });
          app.use(middleware1);
          app.use(errMiddleware1);
          // simulate HTTP event
          app._handleHTTP(request, response);
          // test what happened to the spies
          expect(middleware1).not.toHaveBeenCalled();
          expect(errMiddleware1).toHaveBeenCalledWith(errObj, request, response, sinon.match.func);
        });

        // this may pass on its own, depending on your solution.
        it('activates error-handling middleware if error-handling middleware throws an error', function(){
          var errObj = new Error('catch me if you can!');
          // middleware registration
          app.use(function normalTriggersError (req, res, next){
            next(true); // deliberately triggers error-handling middleware
          });
          app.use(middleware1);
          app.use(function errorThrowsError (err, req, res, next){
            function hypotheticalErrorPageRenderer () {}
            hypotheticalErrorPageRenderer(err);
            throw errObj; // should trigger next error-handling middleware
          });
          app.use(middleware2);
          app.use(errMiddleware1);
          // simulate HTTP event
          app._handleHTTP(request, response);
          // test what happened to the spies
          expect(middleware1).not.toHaveBeenCalled();
          expect(middleware2).not.toHaveBeenCalled();
          expect(errMiddleware1).toHaveBeenCalledWith(errObj, request, response, sinon.match.func);
        });

      });

      describe('default error handling', function(){

        it('does not modify the response if there is no unhandled error', function(){
          app.use(middleware1);
          app._handleHTTP(request, response);
          expect(end).not.toHaveBeenCalled();
          expect(response).toEqual({
            statusCode: undefined,
            headersSent: false,
            end: end
          });
        });

        it('sets status to 500 and calls res.end with an unhandled error if there is one', function(){
          var errObj = new Error('unhandled error');
          app.use(function throwsErr (req, res, next){
            throw errObj;
          });
          app._handleHTTP(request, response);
          expect(end).toHaveBeenCalledWithExactly(errObj);
          expect(response).toEqual({
            statusCode: 500, // you will have to set this yourself
            headersSent: true, // set for you by calling the `end` function
            end: end
          });
        });

        it('honors the `.status` property of a passed-in error', function(){
          var status = [401, 403, 404, 409][Math.floor(Math.random() * 4)];
          var errObj = new Error('unhandled error');
          errObj.status = status; // your code will have to detect this
          app.use(function throwsErr (req, res, next){
            throw errObj;
          });
          app._handleHTTP(request, response);
          expect(end).toHaveBeenCalledWithExactly(errObj);
          expect(response).toEqual({
            statusCode: status, // this is what we are testing
            headersSent: true,
            end: end
          });
        });

      });

    });

  });

});
