/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------

// -------------- Socket Logic -------------------

var videoKey0;
var videoKey1;
var tokSession;


// setup socket root
var socketLibRoot = document.location.host;

// general socket
var gSock = io.connect(socketLibRoot);

gSock.on("updateVotes", function(data) {
	// Handle voting updates from the server
	var numVotesLeft = data[0];
	var numVotesRight = data[1];
	setVoteBars(numVotesLeft, numVotesRight);
});

gSock.on('setQueue', function(data) {
  
  /*
  var example_data = {
    success: { message: ... }
    player { id: ... name: ...}
  };
  */
  if (data.success !== 'undefined') {
    
    // ridiculousness
    //playSound("sounds/explosion.wav");
 
    alert(data.success.message + ' (NOTE: queue UI still requires implementation)');
    //alert(data.player.name);
    
    // setQueue accepts a list of player names
	  //setQueue([ data.player.name ]);
    // TODO: this is temporary and will be replaced by a call to the data model

  } else {
    alert(data);
  }
	
});

gSock.on('playSound', function(data) {
  // data
  // .id
  
  var sound = soundManager.getSoundById(data);
  sound.play();
  
  
});

gSock.on('playKey', function(data) {
  // data
  // .id
  switch(parseInt(data)){
    case 65: //a
      moveSpotlight(true); break;
    case 83: //s
      moveSpotlight(false);break;
    
    case 68: //d
      dropBling(true);break;
    case 70: //f
      dropBling(false);break;
    case 82: //r
      removeBling();break;
      
    case 88: //x
      flash(); break;
  }
  
});


// ------------------   Preloads and Triggers ---------------
var hornSound;
var endSound;

$(function(){
  soundManager.debugMode = false;
  soundManager.url = '/scripts/';
  soundManager.onready( function(){
    hornExplode= soundManager.createSound({ id: 'hornExplode', url: '/audio/effects/airhorn+explosion1.wav', autoLoad: true });
    endSound = soundManager.createSound({id: 'winExplode', url: '/audio/effects/luger+explosion.wav', autoLoad: true });
    lemonade = soundManager.createSound({id: 'lemonade', url: '/audio/effects/lemonade.mp3', autoLoad: true, volume: 50 });
	hornSound = soundManager.createSound({ id: 'airhorn', url: '/audio/effects/airorn.wav', autoLoad: true });
	hornSound2 = soundManager.createSound({ id: 'hyphyairhorn2', url: '/audio/effects/hyphyairhorn2.wav', autoLoad: true });
	
  });
  
  // Tell the server I've entered the room so I can sync the game state
  gSock.emit("room.enter", "main_stage" );
  
  $("body").keypress(function(event) {
    if ( event.which == 106) {
      // j
       gSock.emit('sendSound', 'hornExplode');
     } else if (event.which == 107) {
      // k
      gSock.emit('sendSound', 'winExplode');
     } else if (event.which == 108) {
      // l
      gSock.emit('sendSound', 'lemonade');
     } else {
      gSock.emit('sendKey', event.which.toString());
     }
  });
  
  $('.madprops.left').click(function(){
    gSock.emit("vote", "left" );
    return false;
  });
  
  $('.madprops.right').click(function(){
    gSock.emit("vote", "right" );
    return false;
  });


  $('.getinline').click(function() {

    // NOTE: this does not work because httpOnly is set for this cookie
    //var sid = $.cookie('connect.sid');      
    
    // player logged in
    model.Player.loggedin(null, function(err, player_loggedin) {
      
      // enter the queue
      if (typeof player_loggedin !== 'undefined' && player_loggedin) {
        
        // get the sid.... required to link express session to socket.io
        model.Player.get_mysid(null, function(err, player_sid) {
          gSock.emit('room.enterQueue', {room_id: 'main_stage', sid: player_sid} );
        });

      // login using facebook
      } else {
        alert('http://' + document.location.host + '/auth/facebook');
        window.location.href = '/auth/facebook';
      }

    });
    
    return false;
    
  });


});
