# Middler

## A Connect/Express-Style Middleware Implementation Exercise

[**Express.js**](http://expressjs.com/) is a popular server framework (way to more easily handle HTTP requests and reponses) for [**Node.js**](https://nodejs.org/en/) (a machine process that executes JavaScript and provides filesystem / network APIs). Express originally extended the [**Connect**](https://github.com/senchalabs/connect) middleware system with additional methods and capabilities; nowadays, Express is built on its own custom middleware system.

Novices to these concepts often express (hah!) confusion over "middleware." **Middler** is a [Testem](https://github.com/testem/testem)-based test spec that implements a simple Connect-style middleware framework. It covers several key features of Connect/Express, including mount paths, temporary url modification, error handling, and explicit/asynchronous control passing via `next` calls. It does not attempt to be as thorough or robust as a true library, however.

### Instructions

We assume you already have working versions of [Node.js, npm](https://nodejs.org/en/), and [Bower](http://bower.io/#install-bower) on your machine.

1. Fork this repo and `git clone` your fork.
* `cd` into the directory and `npm install` (which will automatically run `bower install` beforehand).
* execute the `npm test` command and open the URL displayed.
* Work in `source/middler.js` and follow the spec in `tests/middler.spec.js`.
* If you complete Middler, try the bonus spec in `tests/xtra.spec.js`.

### Notes & Hints

* You are strongly encouraged to look at `source/helper.js` and `tests/helper.spec.js` to understand the behavior and implementation of the `mountMatchesUrl` function. You can see the examples in action by changing `xdescribe` to `describe`.
* It is common practice that methods with a leading underscore (e.g. `app._handleHTTP`) are "internal" properties which are part of the underlying machinery, but are not typically meant to be directly accessed by the user/developer.
* `_handleHTTP` can be implemented with no loops, though that is not necessary.

### Post-Reading

After attempting Middler, you are highly encouraged to read the Netflix blog post [Node.js in Flames](http://techblog.netflix.com/2014/11/nodejs-in-flames.html). Your newfound perspective on Express's internal workings will help you appreciate the technical points which led to Netflix experiencing gradually worsening latency — in addition to underscoring the importance of selecting the right data structure for your use case.
