var model = require('../lib/model')
  , testing = require('../lib/testing')
  , Fixture = testing.Fixture
  , util = require('util')
;


// load_fixtures

exports.load_fixtures = function(req, res){
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
  
    name = req.params.name;
    
    Fixture.load(null, name, function (err, fixtureData) {
	    res.writeHead(200);
	    res.write('Fixtures loaded for ' + name);
	    res.end();
    });
    
  } else {  
    res.json({ error: { message: "Player needs to be logged in in order to perform this action"} });
  
  }

};


// unload_fixtures

exports.unload_fixtures = function(req, res){
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
  
    name = req.params.name;
    
    Fixture.unload(null, name, function (err, fixtureData) {
	    res.writeHead(200);
	    res.write('Fixtures un-loaded for ' + name);
	    res.end();
    });
    
  } else {  
    res.json({ error: { message: "Player needs to be logged in in order to perform this action"} });
  
  }

};



// testboard
// returns a page containing useful REST links for developers


exports.testboard = function(req, res){

  res.render('admin/testboard', { title: 'Developer Test Board' })

};





