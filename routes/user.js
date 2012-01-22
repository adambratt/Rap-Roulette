var model = require('../lib/model')
	, express = require('express')
	, ea = require('../node_modules/everyauth/index')
;

// index route

exports.index = function (req, res) {
  res.partial('user/home', {
	'req': req 
  });
};

// session route

exports.session = function (req, res) {
  res.partial('user/session', {
	'req': req 
  });
};



// session info route

exports.test_create = function (req, res) {
  
  var User = model.User; 
  user = User.create({ service: 'facebook', screen_name: 'jpitts' },
	function (user) {
		
		res.partial('user/session', {
			'user': user
		});

	}
  );
  

};



