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
  
  res.writeHead(200, {"Content-Type": "application/json"});
  res.write(util.inspect(player));
  res.end();
};

// myself

exports.myself = function(req, res){
    
  player = Player.get_myself(null, req, function (err, dbUser) {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.write(util.inspect(dbUser));
    res.end();
  });
  

};

// view

exports.view = function(req, res){
    
  id = req.params.id;
  
  player = Player.get(null, id, function () {});
  
  res.writeHead(200, {"Content-Type": "application/json"});
  res.write(util.inspect(player));
  res.end();
};


// list

exports.list = function(req, res){
  players = Player.list(null, {}, function () {});
  
  res.writeHead(200, {"Content-Type": "application/json"});
  res.write(util.inspect(players));
  res.end();

};


