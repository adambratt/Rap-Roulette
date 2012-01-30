var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , mongo_store = require('connect-mongo')
  , model = require('../lib/model')
  , util = require('util');


// catch uncaught exceptions that occur when mysql cannot be connected to

process.on('uncaughtException', function (err) {
  if (err.code == 'ECONNREFUSED') {
    console.log('Probably the database cannot be connected to in model.js');
  }
  console.log(err);
}); 

var sessionStore = new mongo_store(cfg.mongodb)

var voteValue = 0;
var numVotes = 0;


module.exports.startGame = function(ss) {
  

  // start the sound track
  ss.emit('playSound', { id : 'lemonade' });
 

  // websocket connection
  ss.sockets.on('connection', function(socket) {
   

    // when a client emits sendSound, emit playSound to all clients
    socket.on('sendSound', function(msg) {
      
      ss.sockets.emit('playSound', msg);
      
    });
    

    // when a client emits sendKey, emit playKey to all clients
    socket.on('sendKey', function(msg) {

      ss.sockets.emit('playKey', msg);

    });
    

    // when a client emits vite, emit syncVode to all clients
    socket.on('vote', function(msg) {
      
      numVotes++;
      voteValue = (parseInt(msg) + voteValue) / numVotes;
      
      ss.sockets.emit('syncVote', voteValue.toString());
      
    });
  

    // room and queue
    // ========================================================================

    // when a player enters or exits the room, emit syncRoom to all clients in that room
    // currently assumes that the player is logged in
    socket.on('enterRoom', function (msg) {
      ss.sockets.emit('syncRoomPlayers', room);
      // TODO: implement  
    });
    
    
    // when a player enters or exuts the room queue, emit syncRoomQueue to all clients in that room
    // currently assumes that the player is logged in
    socket.on('enterRoomQueue', function (msg) {
      
      /*
      var example_msg = {
        sid: Lots8And7Lots6Of2Letters.3And4Numbers,
        room_id: 1
      };
      */
      
      console.log(msg.sid);
      console.log(msg.room_id);
      
      Room = model.Room;
      Player = model.Player;
       
      // get the session from mongo 
      coll = mongo_client.collection('sessions');
      coll.findOne({ _id: msg.sid }, function(err, session) {

      //sessionStore.get(msg.sid, function (error, session) {
      // WTF NOTE: this called the callback twice, I kid you not 
        
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
            });
        
          });

        });

      });
      
    });    
    
    
    // authentication
    // ========================================================================

    // inform the client that the popup window has successfully logged in
    // TODO: not fully implemented
    socket.on('authLogin', function (player) {
      if (player.socket_transport_sessionid) {
        ss.clients[player.socket_transport_sessionid].send(player);
      }
    });
 

  });
}
