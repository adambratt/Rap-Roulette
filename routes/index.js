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

    if (typeof room === 'undefined') { 
      display_404(id, req, res); 
      return;
    } 

    // set the room in case the user is not logged in
    req.session.room_id = room.id;
    
    delete room['_id'];
     
    battleState = Battle.states[room.battle_id];
    
    res.render('index', { 
      title: room.name, 
      sid: req.sessionID, 
      room: room,
      battleState: battleState,
    });
  
  });

};

function display_404(id, req, res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write("<h1>404 Not Found</h1>");
  res.end("The room 'main_stage' cannot be found");
}


