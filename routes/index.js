var model = require('../lib/model')
  , Player = model.Player
  , Room = model.Room
  , util = require('util')
;

/*
 * GET home page.
 */

exports.index = function(req, res){
  //console.log(util.inspect(req.session));
  
  
  Room.get(null, 'main_stage', function (err, room) {
    
    // set the room to be main_stage if the user is not logged in
    req.session.room_id = 'main_stage';

    res.render('index', { title: room.name, sid: req.sessionID, room: room })
  
  });

};
