var express = require('express')
  , ea = require('../node_modules/everyauth/index')
  , model = require('../lib/model')
  , util = require('util');

//var app = module.exports = express.createServer();

exports.index = function (req, res) {
  res.partial('user/home', {
	'req': req 
  });
};

ea.debug = true;

var usersById = {};
var nextUserId = 0;

ea.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

var usersByFacebookId = {};

ea.facebook.appId('333001253396957')
           .appSecret('76d5222cd4c2bc4a7dbc00af1853a2c8')
           .handleAuthCallbackError(function(req, res) {
             // TODO flash message about authentication failing and redirect back to main page
           })
           
			.findOrCreateUser(function(session, accessToken, accessTokExtra, fbUserMeta) {
             
			//console.log(util.inspect(fbUserMeta));
            //return usersByFacebookId[fbUserMeta.id] || (usersByFacebookId[fbUserMeta.id] = addUser('facebook', fbUserMeta));
          		
				//console.log(util.inspect(session));
				
				//console.log('fb name: ' + fbUserMeta.name);
				
				// woahhhhh, this is a cool idea
				var userPromise = this.Promise();
    			
				var User = model.User;
				var Player = model.Player;
				
				// see if the user is already in the app
				/*
				var appUser = User.get_from_app('facebook', fbUserMeta.id);
				if (appUser) {
					console.log('user already exists in the app');
					return userPromise.fulfill(appUser);
				} else {
					User.create_in_app('facebook', fbUserMeta.id);
					console.log('user is not logged in the app');
				}
				*/

				// see if the user is already in the db	
  				User.get_from_db({ service: 'facebook', screen_id: fbUserMeta.id },
    				function (err, user) {
      					if (err) {
							return userPromise.fail(err);
      					}
						
						if (user) {
							console.log('user already exists in the db');
							Player.create(null, { id: user.id, service: 'facebook', name: fbUserMeta.name }, function () {});
							return userPromise.fulfill(user);
      					}
						
						// create a new user
      					User.create_in_db(err, { service: 'facebook', screen_name: fbUserMeta.name, screen_id: fbUserMeta.id }, function (err, user) {
        					if (err) return userPromise.fail(err);
							Player.create(null, { id: user.id, service: 'facebook', name: fbUserMeta.name }, function () {});
        					return userPromise.fulfill(user);
      					});
						
    				});
    			return userPromise;
				
			})
           .redirectPath('/');
