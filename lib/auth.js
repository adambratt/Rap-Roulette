var express = require('express')
  , ea = require('../node_modules/everyauth/index')
  , model = require('../lib/model')
  , util = require('util');


// debugging on dev

//if (global.process.env.NODE_ENV == 'development') {
  ea.debug = true;
//}


// facebook configuration

ea.facebook.appId('333001253396957')
	.appSecret('76d5222cd4c2bc4a7dbc00af1853a2c8')
	.handleAuthCallbackError(function(req, res) {
		// TODO flash message about authentication failing and redirect back to main page
    })
	.findOrCreateUser(function(session, accessToken, accessTokExtra, fbUserMeta) {
		 
		//console.log(util.inspect(fbUserMeta));
		//console.log(util.inspect(session));
		
		// woahhhhh, this is a cool idea
		var userPromise = this.Promise();
		
		// setting some variables for use later
		session.service = 'facebook';
		session.screen_id = fbUserMeta.id;
		session.screen_name = fbUserMeta.name;

		var User = model.User;
		var Player = model.Player;
			
		// see if the user is already in the db	
		User.get_from_db({ service: 'facebook', screen_id: fbUserMeta.id },
			function (err, user) {
				if (err) {
					return userPromise.fail(err);
				}
				
				if (user) {
					//console.log('user already exists in the db');
          session.user_id = user.id;
					Player.create(null, { id: user.id, service: 'facebook', name: fbUserMeta.name }, function (err, player) {
					  return userPromise.fulfill(user);            
          });

				}
				
				// create a new user
				User.create_in_db(err, { service: 'facebook', screen_name: fbUserMeta.name, screen_id: fbUserMeta.id }, function (err, user) {
					//console.log('create a new user');
					if (err) return userPromise.fail(err);
          session.user_id = user.id;
					Player.create(null, { id: user.id, service: 'facebook', name: fbUserMeta.name }, function (err, player) {
					  return userPromise.fulfill(user);
          });
				});
				
			});

		return userPromise;
		
	})
   .redirectPath('/');
