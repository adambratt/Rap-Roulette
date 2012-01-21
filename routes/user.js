var express = require('express')
  , ea = require('../node_modules/everyauth/index')
  , conf = require('../conf/user');

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

var usersByTwitId = {};

ea
  .twitter
    .consumerKey(conf.twit.consumerKey)
    .consumerSecret(conf.twit.consumerSecret)
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
      return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
    })
    .redirectPath('/')



