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
 		
	Battle.create(null, obj, function (err, battle) {
    
    delete battle['_id'];
    res.json(battle); 
    
  });
};


// drop

exports.drop = function(req, res){
		
	id = req.params.id;
	
  Battle.drop(null, id, function(err) {
	
	  res.json({ success: { message: 'The battle was dropped' } })

  });

};


// list

exports.list = function(req, res){
	
  Battle.list(null, {}, function (err, battles) {
    
    // remove the mongo _id
    for (var i=0; i < battles.length; i++) {
      delete battles[i]['_id'];
    }

    res.json(battles);

  });

};


// song
// get info about the song for a given battle

exports.song = function(req, res){
	Song = model.Song
	
	battle_id = req.params.id;
	
  Battle.get(null, battle_id, function (err, battle) {
    
    if (typeof battle !== 'undefined') {
	      
      Song.get(null, battle.song_id, function (err, song) {
        if (typeof song !== 'undefined') {
            
          delete song['_id'];
          res.json(song);
          
        } else {
	        res.json({ error: { message: "Song not found."}});

        }
      });

    } else {

	    res.json({ error: { message: "Battle does not exist."}});
    }

  });

};


// view

exports.view = function(req, res){
		
	id = req.params.id;
	
	Battle.get(null, id, function (err, battle) {
    
    delete battle['_id'];
    res.json(battle);

  });

};


