var model = require('../lib/model')
	, Battle = model.Battle
	, util = require('util')
;


// index

exports.index = function(req, res){
	//res.render('index')
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write("Battles");
	res.end();
};


// create
// TODO: post-only this

exports.create = function(req, res){
  
  obj = {
    room_id: req.query.room_id,
    song_id: req.query.song_id,
    name: req.query.name,
    players: ( (typeof req.query.players !== 'undefined') ? req.query.players.split(',') : [])
  };
 		
	battle = Battle.create(null, obj, function () {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(battle));
	res.end();
};


// drop

exports.drop = function(req, res){
		
	id = req.params.id;
	
  Battle.drop(null, id, function() {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect({ success: { message: 'The battle was dropped' } }));
	res.end();
};


// list

exports.list = function(req, res){
	battles = Battle.list(null, {}, function () {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(battles));
	res.end();

};


// view

exports.view = function(req, res){
		
	id = req.params.id;
	
	battle = Battle.get(null, id, function () {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(battle));
	res.end();
};


