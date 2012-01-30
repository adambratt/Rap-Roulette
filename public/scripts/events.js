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

gSock.on('syncVote', function(data) {
  // data
  // .vote
  setMeter(parseInt(data));
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
  
  $('.madprops').click(function(){
    var vote = $(this).attr('rel');
    gSock.emit('vote', vote.toString() );
    return false;
  });


  $('.getinline').click(function() {

    // NOTE: this does not work because httpOnly is set for this cookie
    //var sid = $.cookie('connect.sid');      
     
    // get the player
    var player = new Player;
    player.get_mysid(null, function(err, player_sid) {
      
      // enter the queue
      if (player_sid !== 'undefined') {
        gSock.emit('enterRoomQueue', {room_id: 'main_stage', sid: player_sid} );
         
      // login using facebook
      } else {
        window.location('/auth/facebook');
      }

    });
    
    return false;
    
  });


});
