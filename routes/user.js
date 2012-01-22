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
  	
  console.log(util.inspect(req.session.auth.facebook));
  //console.log(util.inspect(User.get(req,res)));
   
  console.log('screen id: ' + req.session.screen_id);
  
  res.partial('user/session', {
	facebook: req.session.auth.facebook	
  });
};


// session logout

exports.logout = function (req, res) {
  var User = model.User; 
  
  res.partial('user/session', {
	'req': req 
  });
};


// test create a user

exports.test_create = function (req, res) {
  
  var User = model.User; 
  User.create({ service: 'facebook', screen_name: 'jpitts' },
	function (user) {
		
		res.partial('user/session', {
			'user': user
		});

	}
  );
  
};



