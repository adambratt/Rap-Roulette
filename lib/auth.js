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
          		
				
				console.log('fb name: ' + fbUserMeta.name);
				
				//FUTURE: for use with the model
				var userPromise = this.Promise();
				
    			var User = model.User;
  				User.get_from_db({ service: 'facebook', screen_id: fbUserMeta.id },
    				function (err, user) {
      					if (err) return userPromise.fail(err);
      					if (user) return userPromise.fulfill(user);
      					// else create a new user
      					User.create(err, { service: 'facebook', screen_name: fbUserMeta.name, screen_id: fbUserMeta.id }, function (err, user) {
        					if (err) return userPromise.fail(err);
        					return userPromise.fulfill(user);
      					});
    				});
    			return userPromise;
				
			})
           .redirectPath('/');
