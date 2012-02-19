
// battleScripts in the client should match the scripts on the server

var battleScripts = {

/* example battle script

   'someBattleThing' : {
      scripts: [
        { descr: 'state0', script: function (data) { ... change the UI ... }, time: 5000 },
        { descr: 'state1', script: function (data) { ... change the UI ... }, time: 15000 },
        { descr: 'state2', script: function (data) { ... change the UI ... }, time: 5000 },
      ]
      names_scripts: {
        some_weird_state: function (data) { ... change the UI ... },
      },
    }

*/

// 2 player battle script

'2PlayerBattle':  {

scripts: [

// new battle
{ descr:  'stateNewBattle',
  script:   function (data) {
     
    model.battle = new model.Battle(data.battleState, function (battle) {
      //console.log("stateNewBattle battle_id " + battle.id);
      
      setQueue(data.queue);
      
      //alert(battle.players[0]); 
      if (typeof battle.player[battle.players[0] !== 'undefined') {
        $('div.video-wrapper0').find('span').replaceWith('<span>' + battle.player[battle.players[0]].name + '</span>'); 
      }

      //uiLoadInfo0('Player info');
      if (typeof battle.player[battle.players[1] !== 'undefined') {
        $('div.video-wrapper1').find('span').replaceWith('<span>' + battle.player[battle.players[1]].name + '</span>'); 
      }

      if (typeof battle.left !== "undefined" && typeof battle.left.stream_id !== "undefined")
        addStream(battle.left.stream_id, 0);

      if(typeof battle.right !== "undefined" && typeof battle.right.stream_id !== "undefined")
        addStream(battle.right.stream_id, 1);
       
    });

      
  },
  time: 5000,
},


// pre rap
{ descr:  'statePreRap',
  script:    function (data) {

    resetVotes();	
    //crowdAction('stop');
    
    soundManager.stopAll();
    //playSound('beat' + data.beatIndex); // no need to broadcast this to everyone
      //var sound = soundManager.getSoundById(model.battle.song_id);
      //sound.play();
    playSound(model.battle.song_id, 0, true); // play song from beginning
    
    setTimer(30);
    setTimerColor("red");
    moveSpotlight(true);
    
    //crowdAction('calm');
    
    //TODO: notify player 1 that he is about to rap
    //		tell both rappers some pre-rap stuff?
    
    uiLoadInfo0('<p style="text-align:center;">Get<br/>Ready</p>');  
    uiLoadInfo1('<p style="text-align:center;">To<br/>Rap!</p>');  

  },
  time: 5000,
},


// round 1

/*
// state before player 1
{ descr:  'stateBeforePlayer1Round0',
  script: function () {
    setTimer(30);
	  setTimerColor("red");
	  moveSpotlight(true);
   //crowdAction('calm');
  
    if (typeof model.battle.player[model.battle.players[0]] !== 'undefined') {
      uiLoadInfo0('Get ready for rap, ' + model.battle.player[model.battle.players[0]].name + '!');  
    }
    uiLoadInfo1('');
  },
  time: 5000,
},
*/

// player 1 rap
{ descr:  'statePlayer1RapRound0',
  script:    function (data) {
	  setTimerColor("white");
	  startCountdown();
    //crowdAction('dance');
  
    uiLoadInfo0('You are on!');  
    uiLoadInfo1('');    
  },
  time: 30000,
},


// before player 2 rap
{ descr:  'stateBeforePlayer2Round0',
  script:    function (data) {
    setTimer(30);
    setTimerColor("red");
    moveSpotlight(false);
    //play airhorn
    //notify player 2 that he is about to rap
    //crowdAction('calm');
    uiLoadInfo0('');  
    if (typeof model.battle.player[model.battle.players[1]] !== 'undefined') {
      uiLoadInfo1('Get ready, ' + model.battle.player[model.battle.players[1]].name + ', you are up next!');
    }
      
  },
  time: 5000,
},


// player 2 rap 
{ descr:  'statePlayer2RapRound0',
  script:    function (data) {
    //TODO: unmute player 2
	  setTimerColor("white");
	  startCountdown();
    //crowdAction('dance');
  
    uiLoadInfo0('');  
    uiLoadInfo1('You are on!');

  },
  time: 30000,
},

// round 2

// state before player 1
{ descr:  'stateBeforePlayer1Round1',
  script: function () {
    setTimer(30);
	  setTimerColor("red");
	  moveSpotlight(true);
   //crowdAction('calm');
  
    if (typeof model.battle.player[model.battle.players[0]] !== 'undefined') {
      uiLoadInfo0('Get ready for rap, ' + model.battle.player[model.battle.players[0]].name + '!');  
    }
    uiLoadInfo1('');
  },
  time: 5000,
},


// player 1 rap
{ descr:  'statePlayer1RapRound1',
  script:    function (data) {
	  setTimerColor("white");
	  startCountdown();
    //crowdAction('dance');
  
    uiLoadInfo0('You are on!');  
    uiLoadInfo1('');    
  },
  time: 30000,
},


// before player 2 rap
{ descr:  'stateBeforePlayer2Round1',
  script:    function (data) {
    setTimer(30);
    setTimerColor("red");
    moveSpotlight(false);
    //play airhorn
    //notify player 2 that he is about to rap
    //crowdAction('calm');
    uiLoadInfo0('');  
    if (typeof model.battle.player[model.battle.players[1]] !== 'undefined') {
      uiLoadInfo1('Get ready, ' + model.battle.player[model.battle.players[1]].name + ', you are up next!');
    }
      
  },
  time: 5000,
},


// player 2 rap 
{ descr:  'statePlayer2RapRound1',
  script:    function (data) {
    //TODO: unmute player 2
	  setTimerColor("white");
	  startCountdown();
    //crowdAction('dance');
  
    uiLoadInfo0('');  
    uiLoadInfo1('You are on!');

  },
  time: 30000,
},


// final voting
{ descr:  'stateFinalVoting',
  script:    function (data) {
    console.log('game-logic stateFinalVoting');

	  turnSpotlightOff();
	  //TODO: play hyphy airhorn
    crowdAction('stop');
  
    uiLoadInfo0('Last chance to give props!');  
    uiLoadInfo1('Last chance to give props!');  
  },
  time: 5000,
},


// post-rap
{ descr:  'statePostRap',
  script: function (data) {
    console.log('game-logic statePostRap');

    //alert(data.winning_player_id);
    if (typeof model.battle.player[data.winning_player_id] !== 'undefined') {
      var winning_side = model.battle.player[data.winning_player_id].side;
      if (winning_side == 'left') { 
        uiLoadInfo0(model.battle.player[data.winning_player_id].name + ' won the battle!'); 
      } else {
        uiLoadInfo1(model.battle.player[data.winning_player_id].name + ' won the battle!');
      }
    }

    //alert(data.dropped_player_id);
    if (typeof data.dropped_player_id !== 'undefined' && typeof model.battle.player[data.dropped_player_id] !== 'undefined') {
      var dropped_side = model.battle.player[data.dropped_player_id].side;
      if (dropped_side == 'left') { 
        uiLoadInfo0(model.battle.player[data.dropped_player_id].name + ' dropped the mike!'); 
      } else {
        uiLoadInfo1(model.battle.player[data.dropped_player_id].name + ' dropped the mike!');
      }
    }
    
    //stopSound('beat'+beatIndex); // no need to broadcast this
    soundManager.stopAll();
    crowdAction('stop');

    uiLoadInfo0('');  
    uiLoadInfo1('');  

  },
  time: 10000,
},




],  // end 2PlayerBattle scripts


named_scripts: { // for things that repeat, and for special scripts
  
  waitingForPlayers: function (data) {
    console.log('client game-logic 2PlayerBattle: waitingForPlayers()'); 
    uiLoadInfo0('<p style="text-align:center;">Waiting for someone to step up.</p>');  
    uiLoadInfo1('<p style="text-align:center;">Get in line!</p>');  
  }, 
  
}

} // end 2PlayerBattle script


};  // end battleScripts

