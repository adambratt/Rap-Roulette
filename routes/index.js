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
    
    // make sure the room exists
    if (typeof room === 'undefined') { 
      display_404(id, req, res); 
      return;
    }
    
    // set the room in case the user is not logged in
    req.session.room_id = room.id;
    delete room['_id'];
    
    // set up the battle state
    battleState = Battle.states[room.battle_id];
    
    // add ui triggers that may have been set in the session
    triggerEvents = [];
    if ((typeof req.session !== 'undefined' && typeof req.session.trigger_player_setup !== 'undefined') ) { 
      triggerEvents.push('uiPlayerSetup');
      delete req.session.trigger_player_setup;
    }
    // testing the ui triggers
    if (GLOBAL.game_debug > 0) {
      if (typeof req.query.trigger_events !== 'undefined') {
        triggerEvents = (req.query.trigger_events.length > 0) ? req.query.trigger_events.split(',') : [];
      }
    }
    
    // render the ejs template with these variables
    res.render('index', { 
      title: room.name, 
      sid: req.sessionID, 
      room: room,
      battleState: battleState,
      triggerEvents: triggerEvents
    });
  
  });

};

function display_404(id, req, res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write("<h1>404 Not Found</h1>");
  res.end("The room 'main_stage' cannot be found");
}


