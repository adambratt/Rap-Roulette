var model = require('../lib/model')
	, express = require('express')
	, ea = require('../node_modules/everyauth/index')
	, util = require('util')
;

// login partial

exports.index = function (req, res) {
  res.partial('user/home', {
	'req': req 
  });
};


// session partial

exports.session = function (req, res) {
  var User = model.User; 
  	
  //console.log(util.inspect(req.session.auth.facebook));
  //console.log(util.inspect(User.get(req,res)));
   
  //console.log('screen id: ' + req.session.auth.facebook);
  
  console.log(req.session.service);
 
  res.partial('user/session', {
	facebook: req.session.auth.facebook	
  });
};


// session logout

exports.logout = function (req, res) {
  //var User = model.User;
  //User.delete_from_app(req, res);
  
  var Player = model.Player;
  Player.get_myself(null, req, function (err, player) {
  	Player.drop(null, player.id, function () {});
  });

  res.partial('user/logout', {});
};


// myself

exports.myself = function(req, res){
	
	player = Player.get_myself(null, req, function (err, dbUser) {
		});

  user_get_from_db({ service: req.session.service, screen_id: req.session.screen_id }, function (err, dbUser) {
    
	  res.writeHead(200, {"Content-Type": "application/json"});
		res.write(util.inspect(dbUser));
		res.end();
  
  });


};




