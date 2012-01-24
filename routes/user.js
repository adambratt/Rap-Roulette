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
  
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(req.session));
	res.end();
   
};


// myself
// returns the database representation of the user

exports.myself = function(req, res){
	
	player = Player.get_myself(null, req, function (err, dbUser) {
		});

  user_get_from_db({ service: req.session.service, screen_id: req.session.screen_id }, function (err, dbUser) {
    
	  res.writeHead(200, {"Content-Type": "application/json"});
		res.write(util.inspect(dbUser));
		res.end();
  
  });


};




