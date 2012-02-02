/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------
var maxBeats=8;


// --------------- Game Logic --------------------

var serverClock;
function setServerClock() { serverClock = new Date(pageServedAt); }

function initServerClock() {
  setServerClock();
  setInterval("serverClockTick()", 1000);
}

function serverClockTick()  {
  serverClock.setSeconds(serverClock.getSeconds()+1); 
  
  // print the time to the console every 5 sec
  if (game_debug && serverClock.getSeconds() % 5 === 0 ) {
    window.console.log("server time: " + prettyPrintServerTime());
  }

}

function prettyPrintServerTime() {
  var min = serverClock.getMinutes();
  if (min<10) { min="0"+min; }
  var sec = serverClock.getSeconds();
  if (sec<10) { sec="0"+sec; }
  return serverClock.getHours() + ":" + min + ":" + sec;
}


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
	//TODO: pop guy off queue
	//		publish new stream
});

var beatIndex;
gSock.on("statePreRap", function(data) {

	//these shouldnt be here
	//server should be choosing/socketing the song
  soundManager.stopAll();
	beatIndex=Math.floor(Math.random()*maxBeats+1);
	playSound('beat'+beatIndex);
	
	
	setTimer(30);
	moveSpotlight(true);
	
	//TODO: notify player 1 that he is about to rap
	//		tell both rappers some pre-rap stuff?
});

gSock.on("statePlayer1Rap", function(data) {
	startCountdown();
	//TODO: mute player 2
});

gSock.on("stateBeforePlayer2", function(data) {
	setTimer(30);
	moveSpotlight(false);
	//TODO: mute player 1
	//play airhorn
	//notify player 2 that he is about to rap
	
});

gSock.on("statePlayer2Rap", function(data) {
//TODO: unmute player 2
	startCountdown();
	
});

gSock.on("stateBeforePlayer1", function(data) {
	//TODO: notify player 1 that he is about to rap
		//play airhorn
	setTimer(30);
	moveSpotlight(true);
});

gSock.on("stateFinalVoting", function(data) {
	turnSpotlightOff();
	//TODO: play hyphy airhorn
});

gSock.on("statePostRap", function(data) {
	resetVotes();
	stopSound('beat'+beatIndex);
	//TODO: calculate/announce winner
	//		boot off loser
	//		
});

///////////////////
// Sync state
///////////////////

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

function resetVotes(){
	setVoteBars(0,0);
	gSock.emit('resetVotes', [0,0]);

}

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
	beat5 = soundManager.createSound({id: 'beat5', url: '/audio/beats/im_a_boss.mp3', autoLoad: true, volume: 50 }); //lol this one is not instrumental
	beat6 = soundManager.createSound({id: 'beat6', url: '/audio/beats/lemonade.mp3', autoLoad: true, volume: 50 });
	beat7 = soundManager.createSound({id: 'beat7', url: '/audio/beats/rack_city.mp3', autoLoad: true, volume: 50 });
	beat8 = soundManager.createSound({id: 'beat8', url: '/audio/beats/swate.mp3', autoLoad: true, volume: 50 }); //this one neither
	
	
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
