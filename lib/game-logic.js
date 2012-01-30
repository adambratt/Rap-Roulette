var numVotesLeft = 0;
var numVotesRight = 0;


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
    	
    	if ( msg == "left" )
    		numVotesLeft += 1;
    	else if ( msg == "right" )
    		numVotesRight += 1;
    	else
    		console.log("Vote signal had invalid message: "+msg);
      
      ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
      
    });
    

    // when a player enters or exits the room, emit syncRoom to all clients in that room
    socket.on('enterRoom', function (msg) {
      
    });
  

    // when a player enters or exuts the room queue, emit syncRoomQueue to all clients in that room
    socket.on('enterRoomQueue', function (msg) {
      
    });    


  });
}
