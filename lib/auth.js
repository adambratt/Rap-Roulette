var express = require('express')
  , ea = require('../node_modules/everyauth/index')
  , model = require('../lib/model')
  , util = require('util');


// debugging on dev

if (global.process.env.NODE_ENV == 'development') {
  ea.debug = true;
}


// facebook configuration

ea.facebook.appId('333001253396957')
	.appSecret('76d5222cd4c2bc4a7dbc00af1853a2c8')
	.handleAuthCallbackError(function(req, res) {
		// TODO flash message about authentication failing and redirect back to main page
    })
	.findOrCreateUser(function(session, accessToken, accessTokExtra, fbUserMeta) {
		 
		//console.log(util.inspect(fbUserMeta));
		//console.log(util.inspect(session));
		
		// woahhhhh, this is a cool idea
		var userPromise = this.Promise();
		
		// setting some variables for use later
		session.service = 'facebook';
		session.screen_id = fbUserMeta.id;
		session.screen_name = fbUserMeta.name;
    
    // determine if this user needs to be added to the queue
    enterQueue = false;
    if (typeof session.trigger_enter_queue_after_login !== 'undefined') {
      //console.log('enter queue after: ' + session.trigger_enter_queue_after_login);
      enterQueue = session.trigger_enter_queue_after_login; 
      delete session.trigger_enter_queue_after_login;
    }

		var Player = model.Player;
		var Room = model.Room;
			
		// see if the user is already in the db	

    //
    // player already exists
    //
    
		Player.collection.findOne({ service: 'facebook', screen_id: fbUserMeta.id },
			function (err, player) {
				if (err) {
					return userPromise.fail(err);
				}
				
        // this remotely authenticated player is in the system
				if (player) {
					
          //console.log('user already exists in the db');
          //console.log('set player id: ' + player.id);
          
          session.player_id = player.id;
          session.player_name = player.name;
          
          // store that the player is logged in
          Player.collection.findAndModify( {        
              query: {id: player.id}, 
              update : { "$set": { is_logged_in: 1} }, 
              'new': false
            },
            function (err) {
              // enter the room if it was previously defined in the session
              if (typeof session.room_id !== 'undefined') {
                
                Room.get(null, session.room_id, function (err, room) {
                  Room.enter(null, room, player.id, function (err, room) { 
                    
                    // enter the queue
                    if (enterQueue == true) {
                      Room.enter_queue(null, player.id, function (err, room) {
                        //console.log('player ' + player.id + ' entered ' + room.id + ' (and entered the queue)');
                        return userPromise.fulfill(player);
                      });
                    } else {
                      //console.log('player ' + player.id + ' entered ' + room.id);
                      return userPromise.fulfill(player);            
                    }

                  });
                });

              } else {
                return userPromise.fulfill(player);            
              }
            }
          );
        
        //
        // create a new player
        //

				} else {
          
          obj = { 
            // remote service identification
            service: 'facebook', screen_name: fbUserMeta.name, screen_id: fbUserMeta.id, 
            
            // player info
            name: fbUserMeta.name, is_logged_in: 1
          };
          
					Player.create(null, obj, function (err, player) {
					  session.player_id = player.id;
					  session.player_name = player.name;
            session.trigger_player_setup = true;

            // enter the room if it was previously defined in the session
            if (typeof session.room_id !== 'undefined') {
              
              Room.get(null, session.room_id, function (err, room) {
                Room.enter(null, room, player.id, function (err, room) { 
                  
                  // enter the queue
                  if (enterQueue == true) {
                    Room.enter_queue(null, player.id, function (err, room) {
                      //console.log('player ' + player.id + ' entered ' + room.id + ' (and entered the queue)');
                      return userPromise.fulfill(player);
                    });
                  } else {
                    //console.log('player ' + player.id + ' entered ' + room.id);
                    return userPromise.fulfill(player);            
                  }

                });
              });

            } else {
              return userPromise.fulfill(player);            
            }
          });

        }
				
			});

		return userPromise;
		
	})
   .redirectPath('/player/login_redirected');
