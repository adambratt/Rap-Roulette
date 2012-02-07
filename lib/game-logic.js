var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , model = require('../lib/model')
  , Battle = model.Battle
  , util = require('util');


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

  // print the time to the console every 60 sec
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


// battle
// ============================================================================

var battleScript = [
	// A list of actions that should happen and how long they should take
	
  [function(ss, battle) {
		//console.log(util.inspect(battle));
    ss.sockets.emit('stateNewBattle', battle);
		}, 5000],
		
	[function(ss, battle) {
		ss.sockets.emit("statePreRap");
		}, 5000],
		
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
		ss.sockets.emit("stateBeforePlayer1");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
		ss.sockets.emit("stateFinalVoting");
		}, 5000],
	
	[function(ss, battle) {
		numVotesLeft = 0;
		numVotesRight = 0;
		ss.sockets.emit("statePostRap");
		}, 10000]
	
];


var maxBeats=8; // temporary until we use the song database in mongo


var BattleClock = function (config) {
	// An object to create battles and trigger events according to a script
	console.log("BattleClock: constructing for " + config.room_id);
	
	this.room_id = config.room_id;
	this.ss = config.ss;
	this.script = config.script;
	this.battleSpeed = (typeof config.battleSpeed !== 'undefined') ? config.battleSpeed : 1;
	
	this.state = -1; // Start out at -1 so the first changeState bumps up to 0
	this.battle = undefined;
	
	// initial battle
	this.createBattle (null, {
		room_id: "main_stage",
		song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
		name: "fake_name",
		players: ["fake_player_1", "fake_player_2"],
		create_rounds: true, number_of_rounds: 3
		}, function () {
	});
}

// BattleClock methods
BattleClock.prototype = {

	createBattle: function(err, obj, cb) {
		var battleClock = this;
		Battle.create(null, obj, function (err, battle, round_data) {
			//console.log(util.inspect(battle));
			if (err) { console.error('BattleClock.createBattle error: ' . err.code); cb(err); return; }
			
			// set up the battle state (temporary data for use in the battle events... the db will be updated on destroy)
      		// --------------------------------------------------
      
      		battle.started_at = (new Date().getTime())/1000;
			
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
      		//delete model.Battle.states[battle.id]['_id']; // get the mongo id out of the way
		  
      		// store in the BattleClock for easy access
      		battleClock.battle = model.Battle.states[battle.id];
      
      		// --------------------------------------------------
      		// done setting up the battle state

      
      		//console.log('battleClock.battle:');
      		//console.log(battleClock.battle);
      
      		// start the clock
      		battleClock.start();
      
      		//cb(err, battleClock.battle);
      	});
	},
	
	// destroy the battle
	destroyBattle: function (err, cb) {
		console.log("BattleClock "+this.room_id+" destroy battle");
    	var battleClock = this;
		
    	console.log(this.battle);
    	if (typeof this.battle !== 'undefined') {
      
      		// save the battle before deleting its state
      		//Battle.update(null, this.battle, function (err, greatSuccess) {
      
        	//this.battle = undefined;
        	delete model.Battle.states[this.battle.id];
        	cb(err, true);
    
      // });
    
    	} else {
    		console.error('BattleClock.destroyBattle error: battle was not defined');
      		cb(err, false);
      
    	}
    
    },
    
    // start of the battle event
    start: function () {
    	// Begin following the battle script
		console.log("BattleClock "+this.room_id+" battle starting");
		this.state = -1;
		this.changeState();
	},
	
	// change to the next battle event
  	changeState: function () {
  		// Trigger the current event and set a timer for the next one
		this.state += 1;
    	this.battle.current_state_id = this.state; 
    	var battleClock = this; // for use inside of timeouts
    
    	// start over
    	//console.log('script length: ' + this.script.length);
		if ( this.state >= this.script.length ) {
			battleClock.destroyBattle(null, function (err, isSuccess) {
				console.log("BattleClock "+this.room_id+" battle ending"); 
				
				// create a new battle, restarting the battle event sequence
				battleClock.createBattle(null, {
          			room_id: "main_stage",
          			song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
          			name: "fake_name",
          			players: ["fake_player_1", "fake_player_2"],
          			create_rounds: true, number_of_rounds: 3
          			}, function (err, battle) {
          		//console.log('created battle');
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
		setTimeout(function() { battleClock.changeState(); }, (duration / this.battleSpeed));
		
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
        battleClock = new BattleClock({ room_id: 'main_stage', ss: ss, script: battleScript });
      }, GLOBAL.game_start_time);
    
    // start the clock immediately
    } else {
        battleClock = new BattleClock({ room_id: 'main_stage', ss: ss, script: battleScript });
    }
  }
  
	
  // websocket connection
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
    	
    	if ( msg == "left" )
    		numVotesLeft += 1;
    	else if ( msg == "right" )
    		numVotesRight += 1;
    	else
    		console.log("Vote signal had invalid message: "+msg);
      
      ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
      
    });
  

    // room and queue
    // ========================================================================

    // room.enter
    // when a player enters or exits the room, emit syncRoom to all clients in that room
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
                console.log('player_id ' + session.player_id + ' entered room_id ' + msg.room_id);  
              });

            } else {
              console.log('sid ' + msg.sid + ' entered room_id ' + msg.room_id);  

            }

          });

        
        });
      });
    });
    
    
    // room.enterQueue
    // when a player enters or exits the room queue, emit setQueue to all clients in that room
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
	
	function syncState() {
		// This syncs all parts of the battle state to get everybody up to date
		ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
	}

}
