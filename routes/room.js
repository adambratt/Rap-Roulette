var model = require('../lib/model')
  , Room = model.Room
  , util = require('util')
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
    
  obj = {
    name: req.query.name,
    battle_id: null, // battle can only be created after room created
    player_queue: ( (typeof req.query.player_queue !== 'undefined') ? req.query.player_queue.split(',') : []),
    players: ( (typeof req.query.players !== 'undefined') ? req.query.players.split(',') : [])
  };

  room = Room.create(null, obj, function (err, room) {
  
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(util.inspect(room));
    res.end();

  });
};


// drop

exports.drop = function(req, res){
		
	id = req.params.id;
    
  Room.drop(null, id, function(err) {
	  res.writeHead(200, {"Content-Type": "application/json"});
	  res.write(util.inspect({ success: { message: 'The room was dropped' } }));
	  res.end();
  });

};


// myroom

exports.myroom = function(req, res){
    
  Room.get_myroom(null, req, function (err, room) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(util.inspect(room));
    res.end();
  });
  

};


// list

exports.list = function(req, res){
  
  Room.list(null, {}, function (err, rooms) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(util.inspect(rooms));
    res.end();
  });
  
};


// view

exports.view = function(req, res){
    
  id = req.params.id;
  Room.get(null, id, function (err, room) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(util.inspect(room));
    res.end();      
  });
  

};


