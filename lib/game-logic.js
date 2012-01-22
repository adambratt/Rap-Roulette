var socketServer;

module.exports.startGame = function(ss) {
  socketServer = ss;
  
  ss.sockets.on('sendSound', function(data) {
    var newData = {
      id : data.sound
    }
    
    ss.sockets.emit('playSound', newData)
    
  })
}