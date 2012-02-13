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
  
	id = req.params.id;
  if (typeof id === 'undefined') id = 'main_stage';

  Room.get(null, id, function (err, room) {
    
    if (typeof room !== 'undefined') {

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
      // player setup trigger
      if ((typeof req.session !== 'undefined' && typeof req.session.trigger_player_setup !== 'undefined') ) { 
        triggerEvents.push('uiPlayerSetup');
        delete req.session.trigger_player_setup;
      } else {
        // show dialog trigger
        // session does not exist, or session does exist and player not logged in
        if (typeof req.session === 'undefined' || (typeof req.session !== 'undefined' && typeof req.session.player_id === 'undefined')) {
          triggerEvents.push('uiShowDialog');
        }
      }
      // testing the ui triggers
      if (GLOBAL.game_debug > 0) {
        if (typeof req.query.trigger_events !== 'undefined') {
          triggerEvents = (req.query.trigger_events.length > 0) ? req.query.trigger_events.split(',') : [];
        }
      }
      
      // set up player
      var player =  { sid: req.sessionID };
      if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
        
        Player.get_myself(null, req.session.player_id, function (err, myself) {

          // render the ejs template with these variables
          res.render('index', { 
            title: room.name, 
            player: { 
              sid: req.sessionID, 
              id: myself.id, 
              is_logged_in: true, 
              name: myself.name, 
              service_username: myself.service_username, 
              service_link: myself.service_link
            }, 
            room: room,
            battleState: battleState,
            triggerEvents: triggerEvents
          });

        });

      } else {

        // render the ejs template with these variables
        res.render('index', { 
          title: room.name, 
          player: { sid: req.sessionID, is_logged_in: false }, 
          room: room,
          battleState: battleState,
          triggerEvents: triggerEvents
        });
      
      }




    // room is not in the data store; create one and redirect to it
    } else {
      
       obj = {
        name: id,
        battle_id: null,
        player_queue: [],
        players: []
      };

      Room.create(null, obj, function (err, room) {
        res.redirect('/rooms/' + room.id);  
      }); 

    }

  });

};

function display_404(id, req, res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write("<h1>404 Not Found</h1>");
  res.end("The room 'main_stage' cannot be found");
}


