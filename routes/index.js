var model = require('../lib/model')
  , Player = model.Player
  , Room = model.Room
  , Battle = model.Battle
  , util = require('util')
;

/*
 * GET home page.
 */

exports.index = function(req, res){
  //console.log(util.inspect(req.session));
 
  

  Room.get(null, 'main_stage', function (err, room) {
      
    // set the room in case the user is not logged in
    req.session.room_id = room.id;
    
    delete room['_id'];
    
    battle = Battle.states[room.battle_id];
    delete battle['_id']; // possible unintended consequences here

    res.render('index', { 
      title: room.name, 
      sid: req.sessionID, 
      room: room,
      battle: battle,
    });
  
  });

};
