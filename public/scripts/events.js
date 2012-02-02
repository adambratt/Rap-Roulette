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

/////////////////////
// State Changes
/////////////////////
gSock.on("stateNewRapper", function(data) {
	// Put stuff here
});

gSock.on("stateCountdown", function(data) {
	alert("stateCountdown");
	setTimer(5);
	startCountdown();
});

gSock.on("statePlayer1Rap", function(data) {
	alert("statePlayer1Rap");
	setTimer(30);
	startCountdown();
});

gSock.on("stateBetweenRounds", function(data) {
	// Put stuff here
});

gSock.on("statePlayer2Rap", function(data) {
	// Put stuff here
});

gSock.on("stateFinalVoting", function(data) {
	// Put stuff here
});

gSock.on("stateShowWinner", function(data) {
	// Put stuff here
});

gSock.on("updateVotes", function(data) {
	// Handle voting updates from the server
	var numVotesLeft = data[0];
	var numVotesRight = data[1];
	setVoteBars(numVotesLeft, numVotesRight);
});

gSock.on('stopSound', function(data) {
	//stop all sounds playing
	soundManager.stopAll();

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
	
    model.Room.get_queue(null, room_id, function (err, queue) {
           setQueue(queue);
        });

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

gSock.on('stopSound', function(data) {
	//stop all sounds playing
	soundManager.stopAll();

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
    lemonade = soundManager.createSound({id: 'lemonade', url: '/audio/beats/lemonade.mp3', autoLoad: true, volume: 50 });
	hornSound = soundManager.createSound({ id: 'airhorn', url: '/audio/effects/airorn.wav', autoLoad: true });
	hornSound2 = soundManager.createSound({ id: 'hyphyairhorn2', url: '/audio/effects/hyphyairhorn2.wav', autoLoad: true });
	
	beat1 = soundManager.createSound({id: 'beat1', url: '/audio/beats/6_foot_7_foot.mp3', autoLoad: true, volume: 50 });
	beat2 = soundManager.createSound({id: 'beat2', url: '/audio/beats/black_and_yellow.mp3', autoLoad: true, volume: 50 });
	beat3 = soundManager.createSound({id: 'beat3', url: '/audio/beats/bonfire.mp3', autoLoad: true, volume: 50 });
	beat4 = soundManager.createSound({id: 'beat4', url: '/audio/beats/drop_it_like_its_hot.mp3', autoLoad: true, volume: 50 });
	beat5 = soundManager.createSound({id: 'beat5', url: '/audio/beats/im_a_boss.mp3', autoLoad: true, volume: 50 });
	beat6 = soundManager.createSound({id: 'beat6', url: '/audio/beats/lemonade.mp3', autoLoad: true, volume: 50 });
	beat1 = soundManager.createSound({id: 'beat7', url: '/audio/beats/rack_city.mp3', autoLoad: true, volume: 50 });
	beat2 = soundManager.createSound({id: 'beat8', url: '/audio/beats/swate.mp3', autoLoad: true, volume: 50 });
	
	
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
        //alert('http://' + document.location.host + '/auth/facebook');
        window.location.href = '/auth/facebook';
      }

    });
    
    return false;
    
  });


});
