var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , model = require('../lib/model')
  , Battle = model.Battle
  , Socket = model.Socket
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


// battle
// ============================================================================

var battleScript = [
	// A list of actions that should happen and how long they should take
	
  [function(ss, battle) {
		//console.log(util.inspect(battle));
    ss.sockets.emit('stateNewBattle', battle);
		}, 5000],
		
	[function(ss, battle) {
		battle.current_round = battle.rounds[0];
		if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('unmute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('mute');
      	}
		ss.sockets.emit("statePreRap", battle.song_id);
		}, 5000],
		
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('mute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('unmute');
      	}
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
    	battle.current_round = battle.rounds[1];
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('unmute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('mute');
      	}
		ss.sockets.emit("stateBeforePlayer1");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[0];
		ss.sockets.emit("statePlayer1Rap");
		}, 30000],
	
	[function(ss, battle) {
    battle.current_player_id = null;
    	if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      		Socket.players[battle.players[0]].emit('mute');
      	}
      	if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      		Socket.players[battle.players[1]].emit('unmute');
      	}
		ss.sockets.emit("stateBeforePlayer2");
		}, 5000],
	
	[function(ss, battle) {
    battle.current_player_id = battle.players[1];
		ss.sockets.emit("statePlayer2Rap");
		}, 30000],
	
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
	
	[function(ss, battle) {
		numVotesLeft = 0;
		numVotesRight = 0;
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

	createBattle: function(err, obj, cb) {
		var battleClock = this;

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
      		//delete model.Battle.states[battle.id]['_id']; // get the mongo id out of the way
		  
      		// store in the BattleClock for easy access
      		battleClock.battle = model.Battle.states[battle.id];
      
      		// --------------------------------------------------
      		// done setting up the battle state
      
      		//console.log('battleClock.battle:');
      		//console.log(battleClock.battle);
      
      		// start the clock
      		battleClock.start();
      		
      		// Start rappers' tok box sessions
      		if (typeof Socket.players[battle.players[0]] !== 'undefined') {
      			Socket.players[battle.players[0]].emit('startOpenTok', 0);
      		}
      		if (typeof Socket.players[battle.players[1]] !== 'undefined') {
      			Socket.players[battle.players[1]].emit('startOpenTok', 1);
      		}
      
      		//cb(err, battleClock.battle);
      	});
	},
	
	// destroy the battle
	destroyBattle: function (err, cb) {
		console.log("BattleClock "+this.room_id+" destroy battle");
    	var battleClock = this;
	    var battle_id = this.battle.id;

    	//console.log(this.battle);
    	if (typeof this.battle !== 'undefined') {

		// Choose winner
        this.battle['update_rounds'] = true;
		
		if(numVotesRight>numVotesLeft)	{
			this.battle.winning_player_id = this.battle.players[1];
			losing_player_id = this.battle.players[0];
		}
		else	{
			this.battle.winning_player_id=this.battle.players[0];
			losing_player_id = this.battle.players[1];
		}
        console.log('WINNER: '+this.battle.winning_player_id);
        
        // Kick loser off of OpenTok
        if (typeof Socket.players[losing_player_id] !== 'undefined') {
      		Socket.players[losing_player_id].emit('stopOpenTok', 0);
      	}
        
        // save the battle before deleting its state
      	Battle.update(null, this.battle, function (err, isGreatSuccess) {
           
        	//console.log('delete the battle state');
          delete model.Battle.states[battle_id];
        	
          cb(err, true);
        
        });

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
		setTimeout(function() { battleClock.changeState(); }, (duration / this.battle_speed));
		
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
        battleClock = new BattleClock({ room_id: 'main_stage', ss: ss, script: battleScript, battle_speed: GLOBAL.battle_speed });
      }, GLOBAL.game_start_time);
    
    // start the clock immediately
    } else {
        battleClock = new BattleClock({ room_id: 'main_stage', ss: ss, script: battleScript, battle_speed: GLOBAL.battle_speed });
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
    	
    	if ( msg == "left" )
    		numVotesLeft += 1;
    	else if ( msg == "right" )
    		numVotesRight += 1;
		else if ( msg == "switch right"){ //player had voted left, now votes right
			numVotesLeft--;
			numVotesRight++;
		}	
		else if ( msg == "switch left"){ //player had voted right, now votes left
			numVotesRight--;
			numVotesLeft++;
		}	
		
		
    	else
    		console.log("Vote signal had invalid message: "+msg);
      
      ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
      
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
