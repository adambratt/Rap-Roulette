var voteValue = 0;
var numVotes = 0;


module.exports.startGame = function(ss) {
  
  ss.emit('playSound', { id : 'lemonade' });
  
  ss.sockets.on('connection', function(socket) {
    
    socket.on('sendSound', function(msg) {
      
      ss.sockets.emit('playSound', msg);
      
    });
    
    socket.on('vote', function(msg) {
      
      numVotes++;
      voteValue = (parseInt(msg) + voteValue) / numVotes;
      
      ss.sockets.emit('syncVote', voteValue.toString());
      
    })
    
  });
}