/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------
function initializeRoomUI(room) {
	
  initializeQueueUI(room.queue);
 
  // TODO insert queue into dom (currentRoom.queue)
  
  // TODO download sound into manager (currentRoom.battle.song.manager)
  initializeBattleUI(room.battle);
}

function initializeBattleUI(battle) {
  
  for (x in battle.players) {
    var ele = $('#player'+x);
    if (ele) {
      ele.find('.name').text(battle.players[x].name);
      // setup open tok videos for player, mute all
    }
  }
  
  
  // Handle song initialization
  battle.song.manager = soundManager.createSound({ id: data.id, url: data.file, autoLoad: true });
  
   // Create timer
  currentRoom.battle.round.startTime('#timer', time);
  
  // Set votes
  setMeter(currentBattle.vote)
  
  initializeRoundUI(battle.round);
}

function initializeRoundUI(round) {
  
  // open tok needs to unmute current player
  
  // Get the current player initialized
  var player = currentRoom.battle.players[round.currentPlayer];
  initializePlayerUI(player);
  
	// Set the round time
  round.startTime('#timer', round.time);
  
  // Setup spotlight
  if (round.currentPlayer) {
    // Move to right side if player index > 0
    moveSpotlight(true);
  } else {
    // Move it to the left side
    moveSpotlight();
  }
  
}

function initializePlayerUI(player) {
  
  // Go through elements and make it work
  var playerElement = $('#player'+player);
  playerElement.find('.name').addClass('active');
  playerElement.find('.video').addClass('active');
  
}

function initializeQueueUI(queue) {
  // Get queue element and clear it out
  var queueElement = $('.queue ul');
  queueElement.html('');
  $('#queueCount').text(queue.length);

  if (!queue.length)
    return;

  // Loop through and add each person in the queue
  for (x in queue){
    ele.append('<li rel="'+queue[x].id+'"><img src="'+queue[x].img+'"><span>'+queue[x].name+'</span></li>"');
  }
  
}

function endBattleUI(battle, winner) {
  
  var winningPlayer = currentRoom.battle.players[winner];
  
  if (winner) {
    // drop bling on right
    dropbling()
  } else {
    // drop bling on left
    dropBling(true);
  }
  
  setTimeout('cleanupBattleUI()', 10000);
}

function cleanupBattleUI() {
  $('.player').find('.name, .video').html('');
  $('.player').find('.active').removeClass('active');
}

function cleanupRoundUI() {
  // open tok needs to mute all players at end of round
  $('.player').find('.active').removeClass('active');
}


// ------------------ Model Objects ---------------

var currentRoom;

// song
// { url : 'http://...', manager: null }
function Song() {
  this.url = null;
  this.manager = null;
}
// queue is an array of player objects

// player
// { id: 99, name: 'FunkMaster Flex', img: 'http://...', element: (ref to parent of opentok div), subscriber: (ref to opentok subscriber), publisher: (ref to opentok publisher) }
function Player(id, name, img) {
  this.id = id;
  this.name = name;
  this.img = img;
  
  this.element = null;
  this.subscriber = null;
  this.publisher = null;
}

function Round(time, currentPlayer) {
  this.time = time;
  this.clock = null;
  this.currentPlayer = currentPlayer; 
}

function Battle(song, round, vote, players) {
  this.song = song;
  this.round = round;
  this.vote = vote;
  this.players = players;
}

function Room(battle, queue) {
  this.battle = battle;
  this.queue = queue;
  this.otSession = null;
}

Room.prototype.removePlayerFromQueue = function(id) {
  for (x in this.queue) {
    if (this.queue[x].id == id) {
      this.queue[x].pop();
      $('li[rel='+id+']').remove();
      break;
    }
  }
}

Room.prototype.addPlayerToQueue = function(player) {
  this.queue.push(player);
  $('.queue ul').append('<li rel="'+player.id+'"><img src="'+player.img+'"><span>'+player.name+'</span></li>"');
}


Song.prototype.syncSong = function(position) {
  if (this.manager) {
    var diff = abs(this.manager.position - position);
    if (diff > 250) {
      this.manager.setPosition(position+25)
    }
  }
}

Round.prototype.startTime = function(id, time) {
  this.time = time;
  if (time) {
    // TODO set time
    $(id).val(time);
  }
  this.clock = setTimer(function () {
    var oldTime = parseInt($(id).html());
    if (oldTime > 0) {
      $(id).html(oldTime-1)
    }
  }, 1000);
}
// -------------- Socket Logic -------------------

// setup socket root
var socketLibRoot = 'http://raproulette.fm';

// general socket
var gSock = io.connect(socketLibRoot);

var roomSock;

gSock.on('joinRoom', function(data) {
  // data
  //  .song
  //  .queue
  //  .time
  //  .currentPlayer
  //  .vote
  //  .players
  
  var currentRound = new Round(data.time, data.currentPlayer);
  var currentBattle = new Battle(data.song, data.currentRound, data.vote, data.players)
  currentRoom = new Room(data.currentBattle, data.queue);
  
  initializeRoomUI(currentRoom);
  
  roomSock = io.connect(socketLibRoot + '/room');
  
  var battleSock;
  
  roomSock.on('startBattle', function(data) {
    // data
    //  .battleId
    //  .song
    //  .currentRound
    //  .vote
    //  .players
    
    currentBattle = new Battle(data.song, data.currentRound, data.vote, data.players);
    currentRoom.battle = currentBattle;
    
    
    // open-tok video setup?
    
    initializeBattleUI(currentBattle);
    currentBattle.song.manager.play();
    
    // TODO subscribe to round events
    
    battleSock = io.connect(socketLibRoot + '/room' + '/battle:'+ data.battleId );
    var roundSock;
    
    battleSock.on('startRound', function(data) {
      // data
      //  .roundId
      
      currentRound = new Round(data.time, data.currentPlayer);
      currentBattle.currentRound = currentRound;
      
      initializeRoundUI(currentRound);
      
      roundSock = io.connect(socketLibRoot + '/room' + '/battle:'+ data.battleId + '/round:' + data.roundId );
      
      roundSock.on('nextPlayer', function(data) {
        // data
        // .currentPlayer
        
        // open tok needs to mute current player before changing its value
        
        currentRound.currentPlayer = data.currentPlayer;
        cleanupRoundUI();
        initializeRoundUI();
        
      });
      
    });
    
    
    battleSock.on('endRound', function() {
      
      cleanupRoundUI(currentRound);
      roundSock.leave();
    
    })
    
    
    battleSock.on('syncSong', function(data) {
      // data
      //  .songPosition
      
      currentBattle.song.syncSong(data.songPosition);
      
    });
    
  });
  
  roomSock.on('endBattle', function(data) {
    // data
    //  .winner - winning player index
    
    endBattleUI(currentRoom.currentBattle, winner);
    currentRoom.currentBattle = null;
    
    battleSock.leave();
    
  });
  
  roomSock.on('queueAdd', function(data){
    // data
    //  .id
    //  .name
    //  .img
    
    var Player = new Player(data.id, data.name, data.img);
    currentRoom.addPlayerToQueue(Player);
    
  });
  
  roomSock.on('queueRemove', function(data){
    // data
    // .id
    
    currentRoom.removePlayerFromQueue(data.id);
    
  });
  
});

// ------------------   Preload Sounds ---------------
$(function(){
  soundManager.url = '/scripts/';
  soundManager.onready( function(){
    var hornSound = soundManager.createSound({ id: 'hornSound', url: '/audio/airorn+explosion1.wav', autoLoad: true });
    var endSound = soundManager.createSound({id: 'endSound', url: '/audio/luger+explosion.wav', autoLoad: true });
  });
});