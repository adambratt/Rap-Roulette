var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , model = require('../lib/model')
  , Battle = model.Battle
  , Room = model.Room
  , Socket = model.Socket
  , util = require('util')
  , opentok = require('opentok')
  , ot = (new opentok.OpenTokSDK('11620212', 'b5c822199772e6392d05ef182a1c2e55ce8a30ee'));


// catch uncaught exceptions that occur when mysql cannot be connected to

process.on('uncaughtException', function (err) {
  if (err.code == 'ECONNREFUSED') {
    console.log('Probably the database cannot be connected to in model.js');
  }
  console.log(err);
}); 

var numVotesLeft = 0;
var numVotesRight = 0;





// server clock
// ============================================================================

var serverTime;

// constructor

var ServerClock = exports.ServerClock = function (ss) {
  console.log('init server clock');
  serverTime = new Date();
  setInterval(function() { server_clock_tick(ss) }, 1000);
}


// tick

exports.ServerClock.tick = server_clock_tick = function (ss)  {
  serverTime.setSeconds(serverTime.getSeconds()+1);

  // print the time to the console every 10 sec
  if (GLOBAL.game_debug && serverTime.getSeconds() % 10 === 0 ) {
    console.log("serverClock Tick: " + server_clock_get_time_str());
  }

}

// get time

exports.ServerClock.get_time = server_clock_get_time = function () {
  return serverTime;
}

// get time as a formatted string

exports.ServerClock.get_time_str = server_clock_get_time_str = function () {
  var min = serverTime.getMinutes();
  if (min<10) { min="0"+min; }
  var sec = serverTime.getSeconds();
  if (sec<10) { sec="0"+sec; }
  return serverTime.getHours() + ":" + min + ":" + sec;
}


// battle clock
// ============================================================================


var battleScript = [
	// A list of actions that should happen and how long they should take

  // new battle
  [function(ss, battle) {
		//console.log(util.inspect(battle));
    Room.get_queue_names(null, battle.room_id, function (err, player_names) {
      console.log(util.inspect(player_names));
      ss.sockets.emit('stateNewBattle', {
        battleState:battle, 
        queue:player_names,
      });
    });
    }, 5000],
	  

  // pre rap battle
	[function(ss, battle) {
		battle.current_round = battle.rounds[0];
		if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('unmute');
      		Socket.players[battle.players[0]].emit('prepareToRap');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('mute');
      	}
		
		ss.sockets.emit("statePreRap", battle.song_id);
		}, 5000],
  
  // player 1 rap
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
  // before player 2 rap
	[function(ss, battle) {
    battle.current_player_id = null;
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('mute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('unmute');
      		Socket.players[battle.players[1]].emit('prepareToRap');
      	}
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
  // player 2 rap
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
  // before player 1 rap (round 2)
	[function(ss, battle) {
    battle.current_player_id = null;
    	battle.current_round = battle.rounds[1];
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('unmute');
      		Socket.players[battle.players[0]].emit('prepareToRap');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('mute');
      	}
		ss.sockets.emit("stateBeforePlayer1");
		}, 5000],
	
  // player 1 rap (round 2)
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
  // before player 2 rap (round 2)
	[function(ss, battle) {
    battle.current_player_id = null;
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('mute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('unmute');
      		Socket.players[battle.players[1]].emit('prepareToRap');
      	}
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
  // player 2 rap (round 2)
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
  // final voting
	[function(ss, battle) {
    battle.current_player_id = null;
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('mute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('mute');
      	}
		ss.sockets.emit("stateFinalVoting");
		}, 5000],
	
  // post rap battle
	[function(ss, battle) {
		ss.sockets.emit("statePostRap");
		}, 10000]
	
];


var maxBeats=9; // temporary until we use the song database in mongo


var BattleClock = function (config) {
	// An object to create battles and trigger events according to a script
	console.log("BattleClock: constructing for " + config.room_id);
	
	this.room_id = config.room_id;
	this.ss = config.ss;
	this.script = config.script;
	this.battle_speed = (typeof config.battle_speed !== 'undefined') ? config.battle_speed : 1;
  
	this.state = -1; // Start out at -1 so the first changeState bumps up to 0
	this.battle = undefined;
  
  // battle clock is...
  this.run_mode = 'running'; 
  // other run_modes include: paused, unpaused, restart

	// initial battle
	this.createBattle (null, {
		room_id: "main_stage",
		song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
		name: "fake_name",
		//players: ["fake_player_1", "fake_player_2"], // these are now dealt with in Battle.create
		create_rounds: true, number_of_rounds: 2
		}, function () {
	});
}

// BattleClock methods
BattleClock.prototype = {
  
  // change the running mode of the clock
  
  changeRunMode: function (err, command, cb) {
		var battleClock = this;

    // valid commands: 
    //    pause:    clock stops at the next state change, and remains stopped
    //    unpause:  changeState will be triggered, clock will then start ticking according to its script
    //    restart:  changeState battleDestroy will be triggered, clock will then start ticking according to its script
    //    end:      changeState before battleDestroy will be triggered, clock will then start ticking according to its script
    
    var prev_run_mode = battleClock.run_mode;
    
    // pause
    if (typeof command !== 'undefined' && command == 'pause') {
      console.log('BattleClock for ' + battleClock.room_id + ' will now ' + command);
      battleClock.run_mode = 'paused';
      // NOTE: do not run battleClock.changeState() as it will be run soon due to a setTimeout
      cb(err, true);
    }
  
    // unpause
    if (typeof command !== 'undefined' && command == 'unpause') {
      console.log('BattleClock for ' + battleClock.room_id + ' will now ' + command);
      
      if (typeof prev_run_mode !== 'undefined' && prev_run_mode == 'running') {
        console.log('BattleClock for ' + battleClock.room_id + ' will not unpause');
        cb(err, false);

      } else if (typeof prev_run_mode !== 'undefined' && prev_run_mode == 'unpaused') {
        console.log('BattleClock for ' + battleClock.room_id + ' will wait ubtil the unpause command has completed');
        cb(err, true);

      } else if (typeof prev_run_mode !== 'undefined' && prev_run_mode == 'restarting') {
        console.log('BattleClock for ' + battleClock.room_id + ' will wait ubtil the restart command has completed');
        cb(err, true);

      } else {
        battleClock.run_mode = 'unpaused';
        battleClock.changeState(null, function (err, isSuccessful) { cb(err, isSuccessful); });
      }
    }
    
    // restart
    if (typeof command !== 'undefined' && command == 'restart') {
      console.log('BattleClock for ' + battleClock.room_id + ' will now ' + command);
      battleClock.run_mode = 'restarting';
      
      // restart from paused
      if (typeof prev_run_mode !== 'undefined' && prev_run_mode == 'paused') {
        console.log('BattleClock for ' + battleClock.room_id + ' will restart immediately');
        battleClock.changeState(null, function (err, isSuccessful) { cb(err, isSuccessful); });
      
      // restart from unpaused or from running
      } else {
        console.log('BattleClock for ' + battleClock.room_id + ' will restart in a moment');

        // NOTE: do not run battleClock.changeState() as it will be run soon due to a setTimeout
        cb(err, true);
      }

    }

    // end
    if (typeof command !== 'undefined' && command == 'end') {
      console.log('BattleClock for ' + battleClock.room_id + ' will now ' + command);
      battleClock.run_mode = 'ending';
      
      // restart from paused
      if (typeof prev_run_mode !== 'undefined' && prev_run_mode == 'paused') {
        console.log('BattleClock for ' + battleClock.room_id + ' will end its round immediately');
        battleClock.changeState(null, function (err, isSuccessful) { cb(err, isSuccessful); });
      
      // restart from unpaused or from running
      } else {
        console.log('BattleClock for ' + battleClock.room_id + ' will end its round in a moment');

        // NOTE: do not run battleClock.changeState() as it will be run soon due to a setTimeout
        cb(err, true);
      }

    }

    
  },
  
  // create a new battle

	createBattle: function(err, obj, cb) {
		var battleClock = this;

		numVotesLeft = 0;
		numVotesRight = 0;
		Battle.create(null, obj, function (err, battle, round_data) {
			//console.log(util.inspect(battle));
			if (err) { console.error('BattleClock.createBattle error: ' . err.code); cb(err); return; }
			
			    // set up the battle state (temporary data for use in the battle events... the db will be updated on destroy)
      		// --------------------------------------------------
      
      		//battle.started_at = (new Date().getTime())/1000;
      		battle.started_at = new Date();
			
      		// battle script (event instructions)
      		battle.script = [];
      		for ( var i=0; i < battleClock.script.length; i++ ) {
      			battle.script.push(battleClock.script[i][1]); // load in event time lengths
			    }
      
      		// store the round data (for mad_props and other scoring per round)
      		for ( var r=0; r < battle.rounds.length; r++) {
        		delete round_data[battle.rounds[r]]['_id']; // get the mongo id out of the way
      		}
      		battle.round = round_data; // to increment a score: battle.round[a893dVOL].mad_props = 2
      
      		// store the battle in node (for easy access all over the system)
      		delete battle['_id']
      		model.Battle.states[battle.id] = battle; // node state of the current battle
      		model.Room.battle_states[battle.room_id] = battle; // node state of the current battle
		  
      		// store in the BattleClock for easy access
      		battleClock.battle = model.Battle.states[battle.id];
      
      		// --------------------------------------------------
      		// done setting up the battle state
      
      		//console.log('battleClock.battle:');
      		//console.log(battleClock.battle);
      
      		// start the clock
      		battleClock.start();
      		battleClock.battle.left={};
			    battleClock.battle.right={};

			
      		// Start rappers' tok box sessions
      		if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      			Socket.players[battle.players[0]].emit('startOpenTok', 0);
				    battleClock.battle.left.player_id=battle.players[0];
				    battleClock.battle.player[battle.players[0]].side = 'left';
					

      		}
      		if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      			Socket.players[battle.players[1]].emit('startOpenTok', 1);
				    battleClock.battle.right.player_id=battle.players[1];
				    battleClock.battle.player[battle.players[1]].side = 'right';
      		}
			
      		//cb(err, battleClock.battle);
      	});
	},
	
	// destroy the battle
	destroyBattle: function (err, cb) {
		console.log("BattleClock "+this.room_id+" destroy battle");
    	var battleClock = this;
	    var battle_id = this.battle.id;
	    var room_id = this.battle.room_id;

    	//console.log(this.battle);
    	if (typeof this.battle !== 'undefined') {

		    // Choose winner
        this.battle['update_rounds'] = true;
        if (typeof this.battle.dropped_player_id === 'undefined') {
		      if(numVotesRight>numVotesLeft )	{
			      this.battle.winning_player_id = this.battle.players[1];
			      losing_player_id = this.battle.players[0];
		      } else	{
			      this.battle.winning_player_id=this.battle.players[0];
			      losing_player_id = this.battle.players[1];
		      }
        // player was dropped
        } else {
          // player 0 dropped; and loses
          if (this.battle.dropped_player_id == this.battle.players[0])	{
			      this.battle.winning_player_id = this.battle.players[1];
			      losing_player_id = this.battle.players[0];
		      // player 1 dropped; and loses
          } else	{
			      this.battle.winning_player_id=this.battle.players[0];
			      losing_player_id = this.battle.players[1];
		      }
        }
        
        console.log('WINNER: '+this.battle.winning_player_id);
        
        // Kick loser off of OpenTok
		
        if (typeof Socket.players[losing_player_id] !== 'undefined') {
      	  Socket.players[losing_player_id].emit('stopOpenTok', 0);
			    console.log('stopped ' + losing_player_id);
        }
        
        // save the battle before deleting its state
      	Battle.update(null, this.battle, function (err, isGreatSuccess) {
           
        	//console.log('delete the battle state');
          delete model.Battle.states[battle_id];
          delete model.Room.battle_states[room_id];
        	
          cb(err, true);
        
        });

      // });
    
    	} else {
    		console.error('BattleClock.destroyBattle error: battle was not defined');
      		cb(err, false);
      
    	}
    
    },
 

	// end the battle due to a player drop
	endByDrop: function (err, dropped_player_id, cb) {
		console.log("BattleClock "+this.room_id+" drop player " + dropped_player_id + "from battle");
    	var battleClock = this;
       
      this.changeRunMode(err, 'end', function (err, isGreatSuccess) {
        battleClock.battle.dropped_player_id = dropped_player_id;
        cb(err, false);
      });
    
  },
  
  // start of the battle event
    
  start: function () {
    	
    // Begin following the battle script
		console.log("BattleClock "+this.room_id+" battle starting");
		this.state = -1;
		this.changeState(null, function(){});
	
  },


	// change to the next battle event
  
  changeState: function (err, cb) {
    
    // look for changes in the run mode
    if (typeof this.run_mode !== 'undefined' && this.run_mode == 'paused') {
      console.log('changeState: battle clock is in paused run_mode');
      return; // pause the clock
    }
    if (typeof this.run_mode !== 'undefined' && this.run_mode == 'unpaused') {
      console.log('changeState: battle clock is in unpaused run_mode, and it will soon be running at state=' + (this.script.length+1));
      this.run_mode = 'running'; 
    }
    if (typeof this.run_mode !== 'undefined' && this.run_mode == 'restarting') {
      console.log('changeState: battle clock is in restarting run_mode, and it will soon be running at state=0');
      this.run_mode = 'running';
      this.state = this.script.length-1; // throw the state into the last element
    }
    if (typeof this.run_mode !== 'undefined' && this.run_mode == 'ending') {
      console.log('changeState: battle clock is in ending run_mode, and it will soon be running at state=' + (this.script.length-1));
      this.run_mode = 'running';
      this.state = this.script.length-2; // throw the state into the last-1 element
    }

    // Trigger the current event and set a timer for the next one
    this.state += 1;
    this.battle.current_state_id = this.state; 
    var battleClock = this; // for use inside of timeouts
    
    // start over
    //console.log('script length: ' + this.script.length);
    if ( this.state >= this.script.length ) {
      var previous_battle_id = this.battle.id;
      console.log("BattleClock "+this.room_id+" battle ending"); 
      
			battleClock.destroyBattle(null, function (err, isSuccess) {
			  
				  // create a new battle, restarting the battle event sequence
				  battleClock.createBattle(null, {
            previous_battle_id: previous_battle_id,
          	room_id: "main_stage",
          	song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
          	name: "fake_name",
          	//players: ["fake_player_1", player_id], // these are now dealt with in Battle.create
          	create_rounds: true, number_of_rounds: 3
          	}, function (err, battle) {
          		
              console.log('created battle');
              
              // callback
              cb(err, true); 

          		//console.log(util.inspect(battle));
          	}); 
          
      	});
      	return;
		}

		console.log("BattleClock "+this.room_id+" changed to state "+this.state);
	  
    	// call the script function
		this.script[this.state][0](this.ss, this.battle);
		
    	// schedule the next event
		var duration = this.script[this.state][1];
		setTimeout(function() { battleClock.changeState(null, function(){});}, (duration / this.battle_speed));
	  
    // callback
    cb(err, true);

	}
	
}


// socket events
// ============================================================================


module.exports.initGame = function(ss) {
  
  // start the server clock immediately
  ServerClock(ss);
  
  // determine if the battle clock should be started
  if (typeof GLOBAL.game_start_time != 'undefined' && GLOBAL.game_start_time != null) {
    
    // wait a bit before starting the battle clock
    if (GLOBAL.game_start_time > 0) {
      
      setTimeout( function () {
        model.Room.battle_clocks['main_stage'] = new BattleClock({ 
          room_id: 'main_stage', ss: ss, 
          script: battleScript, 
          battle_speed: GLOBAL.battle_speed 
        });
      }, GLOBAL.game_start_time);
    
    // start the clock immediately
    } else {
        model.Room.battle_clocks['main_stage'] = new BattleClock({ 
          room_id: 'main_stage', ss: ss, 
          script: battleScript, 
          battle_speed: GLOBAL.battle_speed 
        });
    }
  }
  
	
  // define listeners on the socket.io connection
  ss.sockets.on('connection', function(socket) {

    
    // user-generated events
    // ========================================================================
    
    // sendSound
    // when a client emits sendSound, emit playSound to all clients
    
    socket.on('sendSound', function(msg) {
      ss.sockets.emit('playSound', msg);
      
    });
    
    socket.on('stopSound', function(msg) {
      ss.sockets.emit('stopSound', msg);
    });

    // sendKey
    // when a client emits sendKey, emit playKey to all clients
    
    socket.on('sendKey', function(msg) {
      ss.sockets.emit('playKey', msg);
    });
    

    // vote
    // When a client votes, update the vote totals for everybody
    
    socket.on('vote', function(msg) {
      console.log('socket.on:vote');
    	
		var battle = model.Room.battle_states['main_stage'];
		
		if	(typeof battle.current_battle === undefined)
			return;
		
    	if ( msg == "left" ) {
    		numVotesLeft += 1;
			battle.round[battle.current_round].player[battle.players[0]].mad_props++;
			}
    	else if ( msg == "right" ){
    		numVotesRight += 1;
			battle.round[battle.current_round].player[battle.players[1]].mad_props++;
			}
		else if ( msg == "switch right"){ //player had voted left, now votes right
			numVotesLeft--;
			numVotesRight++;
			battle.round[battle.current_round].player[battle.players[0]].mad_props--;
			battle.round[battle.current_round].player[battle.players[1]].mad_props++;
		}	
		else if ( msg == "switch left"){ //player had voted right, now votes left
			numVotesRight--;
			numVotesLeft++;
			battle.round[battle.current_round].player[battle.players[1]].mad_props++;
			battle.round[battle.current_round].player[battle.players[0]].mad_props--;
		}	
		
    	else
    		console.log("Vote signal had invalid message: "+msg);
      
      ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
      
    });


    // opentok events
    // ========================================================================
    

    // published
    // when a client starts publishing, store their streamId and side they're on 
    
    socket.on('published', function (msg) {
    /* var example_msg= {
      side: 0,
      stream_id: l0ngStr1ng,
      player_id: An0ther-l0ng$tr1nG
      }
    */
      console.log('socket.on:published stream' + msg.side +' from' + msg.player_id);
      
      var battle = model.Room.battle_states['main_stage'];
      if(msg.side==0)
      {
        battle.left.stream_id=msg.stream_id;
		battle.left.published = true;
		 ss.sockets.emit('setLeft', msg); //tells client what the current left player is
      }
      else
      {
        battle.right.stream_id=msg.stream_id;
		battle.right.published = true;
		 ss.sockets.emit('setRight', msg); //
      }
      
    });
    

    // opentok init
    
    socket.on('opentok.init', function (msg) {
      console.log('opentok.init for ' + msg.sid);

      // Create an OpenTok session for each user
      ot.createSession('localhost', {}, function(opentokSession) {

        // Send initialization data back to the client
        socket.emit('opentok.init.reply', {
          sessionId: opentokSession.sessionId,
          
          // SEE: http://www.tokbox.com/opentok/api/tools/documentation/api/server_side_libraries.html#generate_token
          token: ot.generateToken({
            sessionId: opentokSession.sessionId,
            role: opentok.Roles.SUBSCRIBER        
          })

        });
        
      });

    });
    
  
    // room and queue
    // ========================================================================

    // room.enter
    // when a player enters or leaves the room, emit syncRoom to all clients in that room
    // currently assumes that the player is logged in
    
    socket.on('room.enter', function (msg) {
      /*
      var example_msg = {
        sid: Lots8And7Lots6Of2Letters.3And4Numbers,
        room_id: main_stage
      };
      */

      //syncState();
      //console.log(util.inspect(msg));
      
      // set the session and room in this socket

      socket.set('sid', msg.sid, function(){
        Socket.sessions[msg.sid] = socket; // session-identifiable socket

        socket.set('room_id', msg.room_id, function(){
          
          // determine if there is an authenticated session in place
          
          // get the session from mongo 
          coll = mongo_client.collection('sessions');
          coll.findOne({ _id: msg.sid }, function(err, session) {

            // session is stored as unthawed json in mongodb
            session = JSON.parse(session.session);
            //console.log(util.inspect(session));
            
            if (typeof session !== 'undefined' && typeof session.player_id !== 'undefined') {
              socket.set('player_id', session.player_id, function () {
                Socket.players[session.player_id] = socket; // player-identifiable socket
                console.log('player_id ' + session.player_id + ' entered room_id ' + msg.room_id);  
              });

            } else {
              console.log('sid ' + msg.sid + ' entered room_id ' + msg.room_id + ' (but not attached to a player yet)');  

            }

          });

        
        });
      });
    });


    // leave room
    // defines the disconnect listener
    socket.on('disconnect', function() {
      
      if (typeof socket.sid !== 'undefined') {
        console.log('session_id ' + socket.sid + ' left room_id ' + socket.room_id);  
        delete Socket.sessions[socket.sid]; // delete the session-identifiable socket
      }
      
      if (typeof socket.player_id !== 'undefined') {
        console.log('player_id ' + socket.player_id + ' left room_id ' + socket.room_id);  
        delete Socket.players[socket.player_id]; // delete the player-identifiable socket
      }

    });
    
    // room.enterQueue
    // when a player enters or leaves the room queue, emit setQueue to all clients in that room
    // currently assumes that the player is logged in
    
    socket.on('room.enterQueue', function (msg) {
      
      /*
      var example_msg = {
        sid: Lots8And7Lots6Of2Letters.3And4Numbers,
        room_id: main_stage
      };
      */
      
      //console.log(msg.sid);
      //console.log(msg.room_id);
      
      Room = model.Room;
      Player = model.Player;
       
      // get the session from mongo 
      coll = mongo_client.collection('sessions');
      coll.findOne({ _id: msg.sid }, function(err, session) {

        // session is stored as unthawed json in mongodb
        session = JSON.parse(session.session);

        // get the player
        Player.get(null, session.player_id, function (err, player) {
 
          // enter this queue
          Room.enter_queue(null, player.id, function (err, room) {
          
            //ss.sockets.emit('syncRoomQueue', JSON.stringify({success: {message: "Player entered the queue."}}));
            ss.sockets.emit('setQueue', {
              success: {message: player.name + " entered the queue."}, 
              player: { id: player.id, name: player.name },
              room: { id: room.id }
            });
        
          });

        });

      });
      
    });    

    socket.on('room.leaveBattle', function (msg) {
      Room = model.Room;
      Player = model.Player;
      // get the session from mongo 
      coll = mongo_client.collection('sessions');
      coll.findOne({ _id: msg.sid }, function(err, session) {

        // session is stored as unthawed json in mongodb
        session = JSON.parse(session.session);
        
        // get the player
        Player.get(null, session.player_id, function (err, player) {
          var battleState = Room.battle_states[player.room_id];          
          var battleClock = Room.battle_clocks[player.room_id];
          
          if (typeof battleState !== 'undefined') {
            //console.log(util.inspect(battleState));

            if (typeof battleState.player[player.id] !== 'undefined') {
              battleClock.endByDrop(null, player.id, function () {
                
                ss.sockets.emit('endBattleByDrop', {
                  success: {message: player.name + " dropped out of the battle!"}, 
                  player: { id: player.id, name: player.name },
                  room: { id: player.room_id }
                });

              });

            } else {
              console.log('ERROR: ' + player.id + ' attempted to drop from a battle that player is not in!');
            }
            
          
          }
          
	      });

      });

    });


    socket.on('room.leaveQueue', function (msg) {
         Room = model.Room;
      Player = model.Player;
      // get the session from mongo 
      coll = mongo_client.collection('sessions');
      coll.findOne({ _id: msg.sid }, function(err, session) {

        // session is stored as unthawed json in mongodb
        session = JSON.parse(session.session);

        // get the player
        Player.get(null, session.player_id, function (err, player) {
 
          // leave this queue
          Room.leave_queue(null, player.id, function (err, room) {
          
            //ss.sockets.emit('syncRoomQueue', JSON.stringify({success: {message: "Player entered the queue."}}));
            ss.sockets.emit('setQueue', {
              success: {message: player.name + " left the queue."}, 
              player: { id: player.id, name: player.name },
              room: { id: room.id }
            });

          });

	      });

      });

    });


    // authentication
    // ========================================================================
    
    // authLogin
    // inform the client that the popup window has successfully logged in
    // TODO: not fully implemented
    
    socket.on('authLogin', function (player) {
      if (player.socket_transport_sessionid) {
        ss.clients[player.socket_transport_sessionid].send(player);
      }
    });
 

  });
  // end defining connection listeners


	function syncState() {
		// This syncs all parts of the battle state to get everybody up to date
		ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
		
	}

}
