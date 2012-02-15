var model = require('../lib/model')
  , Room = model.Room
  , Battle = model.Battle
  , Player = model.Player
  , util = require('util')
  , routes = require('../routes/index')
;


// index

exports.index = function(req, res){
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("Rooms");
  res.end();
};


// create
// TODO: post-only this

exports.create = function(req, res){
  //console.log(req.query.players.length); 
  //console.log((typeof req.query.player_queue !== 'undefined' && req.query.player_queue.length > 0));  
  //console.log((typeof req.query.player_queue !== 'undefined'));  

  obj = {
    name: req.query.name,
    battle_id: null, // battle can only be created after room created
    player_queue: ( (typeof req.query.player_queue !== 'undefined' && req.query.player_queue.length > 0) ? req.query.player_queue.split(',') : []),
    players: ( (typeof req.query.players !== 'undefined' && req.query.players.length > 0) ? req.query.players.split(',') : [])
  };

  room = Room.create(null, obj, function (err, room) {
    delete room['_id'];
    res.json(room);

  });
};


// drop

exports.drop = function(req, res){
		
	id = req.params.id;
    
  Room.drop(null, id, function(err) {
	  res.json({ success: { message: 'The room was dropped' } });
  });

};

// enter

exports.enter = function(req, res){

  id = req.params.id;
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {

    // get the room
    Room.get(null, id, function (err, room) {
      
      // enter this room
      Room.enter(null, room, req.session.player_id, function (err, room) {
        res.json({ success: {message: "Player entered " + room.name} });
      });

    });
  
  } else {
    res.json({ error: {message: "Player needs to be logged in to perform this action."} });
  }

};


// enter queue

exports.enter_queue = function(req, res){

  id = req.params.id;

  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {

    // get the room
    Room.get(null, id, function (err, room) {
      
      // enter this room
      Room.enter_queue(null, req.session.player_id, function (err, room) {
        res.json({ success: {message: "Player entered the queue in " + room.name} });
      });

    });

  } else {
    res.json({ success: {message: "Player needs to be logged in to perform this action."} });
  }

};


// get

exports.get = function(req, res){
    
  id = req.params.id;
  Room.get(null, id, function (err, room) {
    delete room['_id'];
    res.json(room);
  });

};



// get_battle_state
// returns the battle state as stored in node
// this will only exist while a battle is active

exports.get_battle_state = function(req, res){
		
  id = req.params.id;
  Room.get(null, id, function (err, room) {	  
    battleState = Battle.states[room.battle_id];
    
    res.json(battleState);
  });

};




// get queue

exports.get_queue = function(req, res){
    
  id = req.params.id;
  
  Room.get_queue_names(null, id, function (err, player_names) {
      res.json(player_names);
  });
    
};


// leave

exports.leave = function(req, res){

  id = req.params.id;
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {

    // get the room
    Room.get(null, id, function (err, room) {
    
      // leave this room
      Room.leave(null, room, req.session.player_id, function (err, room) {
        res.json({ success: { message: "Player left " + room.name} });
      });

    });
  
  } else {
    res.json({ success: {message: "Player needs to be logged in to perform this action."} });
  }

};


// leave_queue

exports.leave_queue = function(req, res){

  id = req.params.id;

  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
  
    // get the room
    Room.get(null, id, function (err, room) {
    
      // leave this room queue
      Room.leave_queue(null, req.session.player_id, function (err, room) {
        res.json({ success: { message: "Player left the queue in " + room.name} });
      });

    });
    
  } else {
    res.json({ success: {message: "Player needs to be logged in to perform this action."} });
  }

};


// myroom

exports.myroom = function(req, res){
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
   
    Room.get_myroom(null, req.session.player_id, function (err, room) {
      delete room['_id'];
      res.json(room);
    });

  } else {  
    res.json({ error: { message: "Player needs to be logged in in order to perform this action"} });
  
  }

};


// myroom_redirect
// redirect the user to their room, or, by default, redirects to the main stage


exports.myroom_redirect = function(req, res){
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
   
    Room.get_myroom(null, req.session.player_id, function (err, room) {
      
      if (room.id == 'main_stage') {
        res.redirect('/');
      } else {
        res.redirect('/rooms/' + room.id);
      }
      
    });

  } else {  
    res.redirect('/');
  }

};




// list

exports.list = function(req, res){
  
  Room.list(null, {}, function (err, rooms) {

    // remove the mongo _id
    for (var i=0; i < rooms.length; i++) {
      delete rooms[i]['_id'];
    }
    
    res.json(rooms);
  
  });
  
};


// pop_top_queue

exports.pop_top_queue = function(req, res){
  
  id = req.params.id;
  
  Room.pop_top_queue(null, id, function (err, player_id) {
    res.json(player_id);
  });
  
};


// view_battle_state
// presents the battle state as stored in node
// this will only exist while a battle is active

exports.view_battle_state = function(req, res){
		
  id = req.params.id;
  Room.get(null, id, function (err, room) {	  
    battleState = Battle.states[room.battle_id];
    battleClock = Room.battle_clocks[room.id];

    if (typeof battleState !== 'undefined') {
    
      res.render('battle/view_battle_state', { 
        layout: true,
        title: room.name, 
        room: room,
        battleState: battleState,
        battleClock: battleClock,
      });

    } else {
      res.json('New battle just now being created due to supervisor restart... just refresh.'); 
    }

  });

};




// view

exports.view = function(req, res){
  routes.index(req, res);
};



