/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------
var maxBeats=9;


// --------------- Game Logic --------------------

var serverTime;
function setServerClock(startAtTime) { serverTime = new Date(startAtTime); }

function initServerClock(initTime) {
  setServerClock(initTime);
  setInterval("serverClockTick()", 1000);
}

function serverClockTick()  {
  serverTime.setSeconds(serverTime.getSeconds()+1); 
  
  // print the time to the console every 5 sec
  if (game_debug && serverTime.getSeconds() % 10 === 0 ) {
    window.console.log( "local serverClock Tick: " + prettyPrintServerTime() );
  }

}

function prettyPrintServerTime() {
  var min = serverTime.getMinutes();
  if (min<10) { min="0"+min; }
  var sec = serverTime.getSeconds();
  if (sec<10) { sec="0"+sec; }
  return serverTime.getHours() + ":" + min + ":" + sec;
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

gSock.on("stateNewBattle", function(battleState) {
	//TODO: pop guy off queue
	//		publish new stream
  
  crowdAction('stop');
  
  model.battle = new model.Battle(battleState, function (battle) {
    //console.log("stateNewBattle battle_id " + battle.id);
    
    //alert(battle.players[0]); 
    $('div.video-wrapper0').find('span').replaceWith('<span>' + battle.players[0] + '</span>'); 
    $('div.video-wrapper1').find('span').replaceWith('<span>' + battle.players[1] + '</span>'); 
     
  });


});

var beatIndex;
gSock.on("statePreRap", function(data) {
  window.console.log('statePreRap');
	
  crowdAction('stop');
  
  soundManager.stopAll();
	//playSound('beat' + data.beatIndex); // no need to broadcast this to everyone
  var sound = soundManager.getSoundById(model.battle.song_id);
  sound.play();
	
  setTimer(30);
	moveSpotlight(true);
  
  crowdAction('calm');
	
	//TODO: notify player 1 that he is about to rap
	//		tell both rappers some pre-rap stuff?
});

gSock.on("statePlayer1Rap", function(data) {
  window.console.log('statePlayer1Rap');

	startCountdown();
	//TODO: mute player 2
  crowdAction('dance');
});

gSock.on("stateBeforePlayer2", function(data) {
  window.console.log('stateBeforePlayer2');

	setTimer(30);
	moveSpotlight(false);
	//TODO: mute player 1
	//play airhorn
	//notify player 2 that he is about to rap
  crowdAction('calm');
	
});

gSock.on("statePlayer2Rap", function(data) {
  window.console.log('statePlayer2Rap');

//TODO: unmute player 2
	startCountdown();
  crowdAction('dance');
});

gSock.on("stateBeforePlayer1", function(data) {
  window.console.log('stateBeforePlayer1');

	//TODO: notify player 1 that he is about to rap
		//play airhorn
	setTimer(30);
	moveSpotlight(true);
  crowdAction('calm');

});

gSock.on("stateFinalVoting", function(data) {
  window.console.log('stateFinalVoting');

	turnSpotlightOff();
	//TODO: play hyphy airhorn
  crowdAction('stop');

});

gSock.on("statePostRap", function(data) {
  window.console.log('statePostRap');

	resetVotes();
	//stopSound('beat'+beatIndex); // no need to broadcast this
	soundManager.stopAll();
  crowdAction('stop');

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
	//data
	//.id
	
	

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
    //case 103: //g
    //  startGame(); break;

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
	$('.madprops.left').bind('click', function(){
	
		gSock.emit("vote", "left" );
		alert('hey ok');
		$('.madprops.left').unbind('click');
		$('.madprops.right').unbind('click');

    return false;
	
	
	});
	$('.madprops.right').bind('click', function(){
	
		gSock.emit("vote", "right" );
		alert('hey ok');
		$('.madprops.left').unbind('click');
		$('.madprops.right').unbind('click');

    return false;
		});
}

// ------------------   Preloads and Triggers ---------------
var hornSound;
var endSound;

// initialize sound

var sound_beat_volume;
var sound_effects_volume;

function initSound (config, callback) {

  // configure the sound for the player
  config = config || {};
  sound_beat_volume = (typeof config.beat_volume !== 'undefined') ? config.beat_volume : 40;
  sound_effects_volume = (typeof config.effects_volume !== 'undefined') ? config.effects_volume : 40;
  
  // initialization of sounds
  soundManager.debugMode = false;
  soundManager.url = '/scripts/';
  soundManager.onready( 
    function () {
      soundManager.createSound({ id: 'hornExplode', url: '/audio/effects/airhorn+explosion1.wav', autoLoad: true, volume: sound_effects_volume });
      soundManager.createSound({id: 'winExplode', url: '/audio/effects/luger+explosion.wav', autoLoad: true, volume: sound_effects_volume });
      soundManager.createSound({ id: 'airhorn', url: '/audio/effects/airorn.wav', autoLoad: true, volume: sound_effects_volume });
      soundManager.createSound({ id: 'hyphyairhorn2', url: '/audio/effects/hyphyairhorn2.wav', autoLoad: true });
      
      soundManager.createSound({id: 'beat1', url: '/audio/beats/6_foot_7_foot.mp3', autoLoad: true, volume: sound_beat_volume });
      soundManager.createSound({id: 'beat2', url: '/audio/beats/black_and_yellow.mp3', autoLoad: true, volume: sound_beat_volume });
      soundManager.createSound({id: 'beat3', url: '/audio/beats/bonfire.mp3', autoLoad: true, volume: sound_beat_volume });
      soundManager.createSound({id: 'beat4', url: '/audio/beats/drop_it_like_its_hot.mp3', autoLoad: true, volume: sound_beat_volume });
      
      //soundManager.createSound({id: 'beat5', url: '/audio/beats/im_a_boss.mp3', autoLoad: true, volume: sound_beat_volume }); //lol this one is not instrumental
      soundManager.createSound({id: 'beat6', url: '/audio/beats/lemonade.mp3', autoLoad: true, volume: sound_beat_volume });
      // temporarily using lemonade
      
      soundManager.createSound({id: 'beat6', url: '/audio/beats/lemonade.mp3', autoLoad: true, volume: sound_beat_volume });
      soundManager.createSound({id: 'beat7', url: '/audio/beats/rack_city.mp3', autoLoad: true, volume: sound_beat_volume });
      
      //beat8 = soundManager.createSound({id: 'beat8', url: '/audio/beats/swate.mp3', autoLoad: true, volume: sound_beat_volume }); //this one neither
      soundManager.createSound({id: 'beat9', url: '/audio/beats/gucci_gucci.mp3', autoLoad: true, volume: sound_beat_volume });
      // temporarily using lemonade
      
      // this makes sure that the soundManager is live before calling sounds
      callback(soundManager);

  });

} 

// initialize click events

function initEvents () {

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
  
  resetVotes();
  
  


  $('.getinline').click(function() {

    // NOTE: accessing the cookie does not work because httpOnly is set
    //var sid = $.cookie('connect.sid');      
    
    // player logged in
    model.player.loggedin(null, function(err, player_loggedin) {
      
      // enter the queue
      if (typeof player_loggedin !== 'undefined' && player_loggedin) {
        
        // get the sid.... required to link express session to socket.io
        model.player.get_mysid(null, function(err, player_sid) {
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
  

} // end click events initialization


