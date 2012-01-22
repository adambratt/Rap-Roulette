/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------

// -------------- Socket Logic -------------------

var videoKey0;
var videoKey1;
var tokSession;


// setup socket root
var socketLibRoot = 'http://raproulette.fm';

// general socket
var gSock = io.connect(socketLibRoot);

gSock.on('syncVote', function(data) {
  // data
  // .vote
  setMeter(parseInt(data));
});

gSock.on('playSound', function(data) {
  // data
  // .id
  
  var sound = soundManager.getSoundById(data);
  sound.play();
  
  
});


// ------------------   Preloads and Triggers ---------------
var hornSound;
var endSound;

$(function(){
  soundManager.debugMode = false;
  soundManager.url = '/scripts/';
  soundManager.onready( function(){
    hornSound = soundManager.createSound({ id: 'hornExplode', url: '/audio/airorn+explosion1.wav', autoLoad: true });
    endSound = soundManager.createSound({id: 'winExplode', url: '/audio/luger+explosion.wav', autoLoad: true });
    lemonade = soundManager.createSound({id: 'lemonade', url: '/audio/lemonade.mp3', autoLoad: true });
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
     }
  });
  
  $('.madprops').click(function(){
    var vote = $(this).attr('rel');
    gSock.emit('vote', vote.toString() );
    return false;
  });
  
});