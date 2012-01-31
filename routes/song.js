var model = require('../lib/model')
	, Song = model.Song
	, util = require('util')
;


// index

exports.index = function(req, res){
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write("Songs");
	res.end();
};


// create
// TODO: post-only this

exports.create = function(req, res){
  
  obj = {
    name: req.query.name,
    artist: req.query.artist,
    file_uri: req.file_uri
  };
 		
	Song.create(null, obj, function (err, song) {
    
    delete song['_id'];
    res.json(song); 
    
  });
};


// drop

exports.drop = function(req, res){
		
	id = req.params.id;
	
  Song.drop(null, id, function(err) {
	
	  res.json({ success: { message: 'The song was dropped' } })

  });

};


// list

exports.list = function(req, res){
	
  Song.list(null, {}, function (err, songs) {
    
    // remove the mongo _id
    for (var i=0; i < songs.length; i++) {
      delete songs[i]['_id'];
    }

    res.json(songs);

  });

};


// view

exports.view = function(req, res){
		
	id = req.params.id;
	
	Song.get(null, id, function (err, song) {
    if (typeof song !== 'undefined') { 
      delete song['_id'];
      res.json(song);
    } else {
      res.json({error: {message: 'Song not found.'}});
    }

  });

};


