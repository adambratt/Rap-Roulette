var model = require('../lib/model')
  , Socket = model.Socket
  , testing = require('../lib/testing')
  , Fixture = testing.Fixture
  , Player = model.Player
  , Room = model.Room
  , Battle = model.Battle
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


// opentok
// test opentok interaction


exports.opentok = function(req, res){
  
  player = {
    sid: req.sessionID
  };

  res.render('admin/opentok', { title: 'OpenTok Test', player: player })

};






// room
// returns a page for controlling what happens in a room

exports.room = function(req, res){
  room_id = req.params.room_id;
  
  Room.get(null, room_id, function (err, room) {
    
    delete room['_id'];
      
    res.render('admin/room', { 
      layout: 'admin/layout',
      title: 'Control Booth',
      room: room,
      battleState: Battle.states[room.battle_id]
    });

  });
};


// room_clock_run_mode
// sends 

exports.room_clock_run_mode = function(req, res){
  room_id = req.params.room_id;
  command = req.params.command;
  
  Room.get(null, room_id, function (err, room) {
    
    delete room['_id'];
    
    var battleClock = Room.battle_clocks[room.id];
    
    if (typeof battleClock !== 'undefined') {
      battleClock.changeRunMode(null, command, function (err, isSuccessful) {
	      res.json({ success: { message: 'The ' + room.id + ' battle clock has been told to ' + command + '.'} });
      });
    } else {
	    res.json({ error: { message: 'The ' + room_id + ' battle clock is not yet running. Try again soon, but it may be in a bad state.'} });
    }
    
  });
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





