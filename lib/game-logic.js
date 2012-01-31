var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , model = require('../lib/model')
  , util = require('util');


// catch uncaught exceptions that occur when mysql cannot be connected to

process.on('uncaughtException', function (err) {
  if (err.code == 'ECONNREFUSED') {
    console.log('Probably the database cannot be connected to in model.js');
  }
  console.log(err);
}); 

var voteValue = 0;
var numVotes = 0;


module.exports.startGame = function(ss) {

  // websocket connection
  ss.sockets.on('connection', function(socket) {
    
    // assign a random id to this connection
    //socket.id = model.create_random_id(16);
    //console.log('new socket connection: ' + socket.id);
  
    // sendSound
    // when a client emits sendSound, emit playSound to all clients
    
    socket.on('sendSound', function(msg) {
      
      ss.sockets.emit('playSound', msg);
      
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
      syncState();
    });
    
    
    // room.enterQueue
    // when a player enters or exits the room queue, emit setQueue to all clients in that room
    // currently assumes that the player is logged in
    
    socket.on('room.enterQueue', function (msg) {
      
      /*
      var example_msg = {
        sid: Lots8And7Lots6Of2Letters.3And4Numbers,
        room_id: 1
      };
      */
      
      console.log(msg.sid);
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
		// This syncs all parts of the game state to get everybody up to date
		ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
	}

}
