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


battleSpeed = 1;  // increase this value to make testing easier
var maxBeats=8; // temporary until we use the song database in mongo


function BattleClock ( ss, script ) {
	// An object to trigger battle events according to the script object
	console.log("Creating battle clock");
	this.ss = ss;
	this.script = script;
	this.state = -1; // Start out at -1 so the first changeState bumps up to 0
	
	var clock = this;
	
  this.createBattle = function(obj) {
		Battle.create(null, obj, function (err, battle) {
      battle.started_at = (new Date().getTime())/1000;
			battle.script = [];
			for ( var i=0; i < clock.script.length; i++ ) {
				battle.script.push(clock.script[i][1]);
			}
			model.Battle.states[battle.id] = battle; // node state of the current battle
      delete model.Battle.states[battle.id]['_id']; // get the mongo id out of the way
		  clock.battle = model.Battle.states[battle.id];
      clock.start();
		});
	}

  this.destroyBattle = function () {
    console.log("Room "+this.battle.room_id+" battle ending"); 
    delete model.Battle.states[this.battle.id];
    delete this.battle;
  }

  // initial create
  	
  this.createBattle({
		room_id: "main_stage",
    song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
		name: "fake_name",
		players: ["fake_player_1", "fake_player_2"]
	});
  

  // start of the battle event
	
  this.start = function () {
		// Begin following the battle script
		console.log("Room "+this.battle.room_id+" battle starting");
		this.state = -1;
		this.changeState();
	}
	
	this.changeState = function () {
		// Trigger the current event and set a timer for the next one
		this.state += 1;
    this.battle.current_state_id = this.state; 
    
    // start over
		if ( this.state >= this.script.length ) {
      
      var destroyBattle = this.destroyBattle;
      setTimeout(function() {
        destroyBattle();		
      }, 0);
    
      // create a new battle, restarting the battle event sequence
      var createBattle = this.createBattle;
      setTimeout(function() { 
          createBattle({
            room_id: "main_stage",
            song_id: 'beat' + Math.floor(Math.random()*maxBeats+1).toString(),
            name: "fake_name",
            players: ["fake_player_1", "fake_player_2"]
          }); 
      }, 0);

      return;
		}

		console.log("Room "+this.battle.room_id+" changed to state "+this.state);
	  
    // call the script function
		this.script[this.state][0](this.ss, this.battle);
		
		var duration = this.script[this.state][1];
		var clock = this;
		setTimeout(function() { clock.changeState(); }, (duration / battleSpeed));
	}
	
}


// socket events
// ============================================================================


module.exports.initGame = function(ss) {
  
  // start the server clock immediately
  ServerClock(ss);
  
  // wait a bit before starting the battle clock
  setTimeout( function () {
      battleClock = new BattleClock( ss, battleScript );
  }, 4000);
  
	
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
