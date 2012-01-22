module.exports.startGame = function(ss) {
  
  ss.emit('playSound', { id : 'lemonade' });
  
  ss.sockets.on('connection', function(socket) {
    
    socket.on('sendSound', function(msg) {
      
      ss.sockets.emit('playSound', msg);
      
    });
    
  });
}