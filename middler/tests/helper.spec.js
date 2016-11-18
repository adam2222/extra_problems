'use strict';
/* global mountMatchesUrl */

// you can change `xdecribe` to `describe` to see these tests pass.
xdescribe('mountMatchesUrl', function(){

  var mount, url;

  describe('a mount path of `/users`', function(){

    beforeEach(function(){
      mount = '/users';
    });

    var matchingUrls = [
      '/users',
      '/users/',
      '/users?lastname=smith',
      '/users/?lastname=smith',
      '/users/123',
      '/users/123/comments',
      '/users/123/comments?approved=false'
    ];

    matchingUrls.forEach(function(url){
      it('matches a url `' + url + '`', function(){
        expect(mountMatchesUrl(mount, url)).toBe(true);
      });
    });

    var nonMatchingUrls = [
      '/user',
      '/users-list',
      '/api/users',
      '/yousers'
    ];

    nonMatchingUrls.forEach(function(url){
      it("DOESN'T match `" + url + '`', function(){
        expect(mountMatchesUrl(mount, url)).toBe(false);
      });
    });

  });

  describe('a request for the url `/api/kittens?color=grey`', function(){

    beforeEach(function(){
      url = '/api/kittens';
    });

    var matchingMounts = [
      '/',
      '/api',
      '/api/',
      '/api/kittens',
      '/api/kittens/'
    ];

    matchingMounts.forEach(function(mount){
      it('matches for a mount `' + mount + '`', function(){
        expect(mountMatchesUrl(mount, url)).toBe(true);
      });
    });

    var nonMatchingMounts = [
      '/api/kit',
      '/api/kittensilly',
      '/api/kittens/felix'
    ];

    nonMatchingMounts.forEach(function(mount){
      it("DOESN'T match mount `" + mount + '`', function(){
        expect(mountMatchesUrl(mount, url)).toBe(false);
      });
    });

  });

});
