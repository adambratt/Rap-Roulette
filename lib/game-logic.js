var numVotesLeft = 0;
var numVotesRight = 0;


module.exports.startGame = function(ss) {
  
  ss.emit('playSound', { id : 'lemonade' });
  
  ss.sockets.on('connection', function(socket) {
    
    socket.on('sendSound', function(msg) {
      
      ss.sockets.emit('playSound', msg);
      
    });
    
   socket.on('sendKey', function(msg) {

      ss.sockets.emit('playKey', msg);

    });
    
    socket.on('vote', function(msg) {
    	
    	if ( msg == "left" )
    		numVotesLeft += 1;
    	else if ( msg == "right" )
    		numVotesRight += 1;
    	else
    		console.log("Vote signal had invalid message: "+msg);
      
      ss.sockets.emit('updateVotes', [numVotesLeft, numVotesRight]);
      
    })
    
  });
}