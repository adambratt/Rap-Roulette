/* requires opentok library, socket.io client library, and jquery, soundManager already loaded on page */

/* requires socketLibRoot */

// ------------------   UI Helpers  ---------------
function initializeRoomUI(time) {
  // create timer
  currentRoom.battle.round.startTime('#timer', time);
  // TODO insert queue into dom (currentRoom.queue)
  
  // TODO download sound into manager (currentRoom.battle.song.manager)
  
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

function Round(clock, currentPlayer) {
  this.clock = clock;
  this.currentPlayer = currentPlayer;
}

Round.prototype.startTime(id, time) {
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

Room.prototype.removePlayerFromQueue(id) {
  // TODO: remove dom elements after searching for player with id
}

Room.prototype.addPlayerToQueue(id) {
  // TODO: create DOM elements for new player
  // only do this in response to this specific event from server, not when I personally choose to join
}

// -------------- Socket Logic -------------------

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
  
  currentRound = new Round(null, currentPlayer);
  currentBattle = new Battle(song, currentRound, vote, players)
  currentRoom = new Room(currentBattle, queue);
  
  roomSock = io.connect(socketLibRoot + '/room');
  
  var battleSock;
  
  roomSock.on('startBattle', function(data) {
    // data
    //  .battleId
    
    // TODO subscribe to round events
    
    battleSock = io.connect(socketLibRoot + '/room' + '/battle:'+ data.battleId );
    var roundSock;
    
    battleSock.on('startRound', function(data) {
      // data
      //  .roundId
      
      // TODO
      
      roundSock = io.connect(socketLibRoot + '/room' + '/battle:'+ data.battleId + '/round:' + data.roundId );
      
      roundSock.on('startPlayer', function(data) {
        // TODO
        
      });
      
      roundSock.on('endPlayer', function() {
        // TODO
        
      });
      
    });
    
    
    battleSock.on('endRound', function() {
      // TODO
      
      roundSock.leave();
    })
    
  });
  
  roomSock.on('endBattle', function() {
    // TODO 
    
    battleSock.leave();
    
  });
  
});

// if i'm in a room...
if (currentRoom) {
  initializeRoomUI(data.time);
}

// if i'm in a battle...
initializeBattleUI()

// if i'm in a round...
initializeRoundUI();


function room_init(){
    battle_start();	
}

function song_start(){
    var data = {"id": 3, "file": ""};
    room.song = data;
    room.song.manager = soundManager.createSound({ id: data.id, url: data.file});
    room.song.manager.play()
}

function song_sync(){
    var data = {"position": 15000};
    var diff = abs(room.song.manager.position-data.position);
    if (diff > 250){
        room.song.manager.stop();
        room.song.manager.setPosition(data.position+25);
        room.song.manager.play();
    }
}

function song_end(){
    room.song.manager.stop();
    room.song = null;
}

function queue_list(){
    var data = {"list": [{"id": 4, "name": "Bob"}, {"id": 6, "name": "Stephen"}, {"id": 9, "name": "Freddie"}]};
    
    // Get the queue and clean it out
    var ele = $('.queue ul');
    ele.html('');
    
    // Fill the queue
    for (x in data.list){
        ele = data.list[x].append("<li>"+data.name+"</li>");
    }
}

function queue_add(){
    
}

function battle_start(){
    // Todo: Cleanup previous battle if needed
    var data = {"id": "300", "players": [ {"id": 3, "name": "Adam Bratt", "img": "https://twimg0-a.akamaihd.net/profile_images/1708962739/K4OCl_normal.png"}, {"id": 4, "name": "Bill Nye", "img": "https://twimg0-a.akamaihd.net/profile_images/1708962739/K4OCl_normal.png"}]};
    for( x in data.players ){
        // Get player element and update ID
        p_ele = $('#player'+x);
        p_ele.attr('rel',data.players[x].id);
        // Update player name
        p_ele.find('.player-name').text(data.players[x].name);
        // Update player image
        p_ele.find('.player-img').attr('src',data.players[x].img);
    }
    room.battle = data;
    round_start();
}

function battle_end(){
    var data = {"winner": 3}
    room.battle = {};
    
    // Winner/Loser display logic
    winner_ele = $('.player[rel='+data.winner+']');
    winner_ele.find('.player-win').show();
    loser_ele = $('.player[rel!='+data.winner+']');
    loser_ele.find('.player-lose').show();
    
    // Cleanup the battle after 9 seconds
    setTimeout(function(){ battle_cleanup(data.winner); data = null; }, 9000);
}

function round_start(){
    var data = {"count": 2};
    $(".round-count").text(data.count);
    room.battle.current_round = data;
    player_start();
}

function round_end(){
    var data = {};
    room.battle.current_round = null;
}

function player_start(){
    var data = {"id": 3, "warmup_time": 5, "perform_time": 30};
    room.battle.current_round.current_player = data;
    var ele = $('.player[rel='+data.id+']');
    ele.find('.timer').addClass('warmup');
    setTimeout(function(){ player_timer(data.id, data.warmup_time, true); data=null; });
    
}

function player_timer(id, time_left, warmup){
    // Base state
    warmup = warmup || false;
    
    // Update timer
    time_left-=1;
    var timer_ele = $('.player[rel='+data.id+']').find('.timer');
    timer_ele.text(time_left);
    
    // If not in a round set timer to wait
    if (!room.battle.current_round || room.battle.current_round == undefined){
        timer_ele.text('WAIT');
        return;
    }
    
    if (time_left > 0){
        // Call timer again
        setTimeout(function(){ player_timer(id, time_left, warmup)}, 1000);
    } else if(warmup) {
        // Switch from warmup timer to normal timer
        if (room.battle.current_round.current_player.perform_time){
            timer_ele.removeClass('warmup');
            setTimeout(function(){ player_timer(id, room.battle.current_round.current_player.perform_time)}, 1000);
        }
    } else {
        // remove this later
        player_end();
    }
}

function player_end(){
    var data = {"id": 3};
    var ele = $('.player[rel='+data.id+']');
    // Change timer text to WAIT
    ele.find('.timer').text('WAIT');
}