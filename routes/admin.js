var model = require('../lib/model')
  , Socket = model.Socket
  , testing = require('../lib/testing')
  , Fixture = testing.Fixture
  , util = require('util')
;


// emit_alert

exports.emit_alert = function(req, res){
  
  message = req.body.message;
  player_id = req.body.player_id;
  
  
  if (typeof Socket.players[player_id] !== 'undefined') {
    
    Socket.players[player_id].emit('playerAlert', message);

	  res.writeHead(200);
	  res.write('Emitted: ' + message + ' to ' + player_id);
    res.end();
  
  } else {
	  res.writeHead(200);
	  res.write('Player not found: ' + message + ' to ' + player_id);
    res.end();
  
  }


};




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





