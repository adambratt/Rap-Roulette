var model = require('../lib/model')
	, Player = model.Player
	, util = require('util')
;


/*
 * GET home page.
 */

// index

exports.index = function(req, res){
	//res.render('index')
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write("Players");
	res.end();
};


// create
// TODO: post-only this

exports.create = function(req, res){
		
	obj = {
		name: req.query.name 
	};
	player = Player.create(null, obj, function () {});
	
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<html><body>Player Created");
	res.write("<br/>" + util.inspect(player));
	res.write("</body></html>");
	res.end();
};


// view

exports.view = function(req, res){
		
	id = req.params.id;
	
	player = Player.get(null, id, function () {});
	
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<br/>" + util.inspect(player));
	res.write("</body></html>");
	res.end();
};


// list

exports.list = function(req, res){
	players = Player.list(null, {}, function () {});
	
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write("<html><body>");
	res.write(util.inspect(players));
	res.write("</body></html>");
	res.end();

};


