var numVotesLeft = 0;
var numVotesRight = 0;


module.exports.startGame = function(ss) {

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
    
    socket.on('vote', function(msg) {
    	// When a client votes, update the vote totals for everybody
    	
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
      syncState();
    });
  

    // when a player enters or exuts the room queue, emit syncRoomQueue to all clients in that room
    socket.on('enterRoomQueue', function (msg) {
      
    });    


  });
	
	function syncState() {
		// This syncs all parts of the game state to get everybody up to date
		ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
	}

}
