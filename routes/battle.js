var model = require('../lib/model')
	, Battle = model.Battle
	, util = require('util')
;


/*
 * GET home page.
 */

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
		
	var obj = {
		song_id: req.query.song_id,

		players: [
		{
			id: 1, 
			name: 'Test 1',
		},
		{
			id: 2,
			name: 'Test 2',
		}
		],
	};
	
	battle = Battle.create(null, obj, function () {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(battle));
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


// list

exports.list = function(req, res){
	battles = Battle.list(null, {}, function () {});
	
	res.writeHead(200, {"Content-Type": "application/json"});
	res.write(util.inspect(battles));
	res.end();

};


