'use strict';

// No scaffolding here... if you have a working Middler framework, try the bonus specs in `tests/xtra.spec.js` to build some example middleware for our app to use.

function queryParser (req, res, next) {

  req.query = {};

  var queryPos = req.url.indexOf('?') + 1;
  if (!queryPos) return next();

  var queryStr = req.url.slice(queryPos);

  var pairs = queryStr.split('&').map(function(pair){

    var tokens = pair.split('='),
        val = tokens[1].replace(/%20/g, ' ');

    if (/^\d+$/.test(val)) val = Number(val);
    else if (val === 'true') val = true;
    else if (val === 'false') val = false;

    return {
      key: tokens[0],
      val: val
    };

  });

  pairs.forEach(function(pair){
    req.query[pair.key] = pair.val;
  });

  next();

}
