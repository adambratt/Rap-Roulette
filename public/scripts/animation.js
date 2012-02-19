

// initAnimation
// sets up the UI on page (called before the events are initialized)

function initAnimation (animationData, cb) {
  
  // hide the player setup
  $('#floatPlayerSetup').hide();
  
  // queue button
	$('.getinline').show();
	$('.leavequeue').hide();
	$('.leavebattle').hide();

  cb(null);
}



////////////////////////////////
// Avatars
////////////////////////////////

numAvatars = 0;
animations = new Array(); //stores interval # 
original_positions = new Array(); //stores original position of avatar




function startEnjoying(index) {
	// Choose a random animation and start it
	original_positions[index] = $("#avatar"+index).offset();
	startJumping(index);
	/* This code was for multiple animations, which we got rid of for the demo
	var i = Math.floor(Math.random()*2);
	switch(i) {
		case(0):
			startDancing(index);
			break;
		case(1):
			startJumping(index);
			break;
		default:
			alert("NNOPE");
		}*/
}
		
function stopEnjoying(index) {
	// Stop the animation for the given avatar
	clearInterval(animations[index]); //clear interval
	$("#avatar"+index).stop(true); //stop current animation
	$("#avatar"+index).animate({rotate: '0deg'}, 0); //return to upright position
	$("#avatar"+index).offset(original_positions[index]); //return to ground
}
			
function startDancing(index) {
	// Make the avatar with the given id start dancing
	dance(index); //"dance" means rotate
	animations[index] = setInterval(function() {dance(index);}, Math.floor(Math.random()*400)+800); //start interval for repeating the animation
}
		
function dance(index) {
	// Make the avatar move back and forth once
	var theta = Math.floor(Math.random()*10)+5;
	$("#avatar"+index).animate({rotate: '-'+theta+'deg'}, 500); 
	$("#avatar"+index).animate({rotate: theta+'deg'}, 500);
}
		
function startJumping(index, height) {
	if (arguments.length == 1) height = 30;
	// Start the avatar jumping
	animations[index]=setInterval(function(){jump(index, height);}, Math.floor(Math.random()*400)+100);  //start interval for repeating the animation
}

function jump(index, height) {
	// Make the avatar jump up and down once
	var range = height;
	var height = Math.floor(Math.random()*range-range/2)+height; //jumps to a random height each time
	$("#avatar"+index).animate({"top": "-="+height+"px"}, 250);
	$("#avatar"+index).animate({"top": "+="+height+"px"}, 250);
}

function changeAnimation(index) {
	stopEnjoying(index);
	startEnjoying(index);
	setTimeout("changeAnimation("+index+")",Math.floor(Math.random()*30000)+5000);
}

function populateRoom() {
	for (var i=0; i<20; i++) {
		var model = Math.floor(Math.random()*9)+1;
		var x = i*35;
		if (i>=10) x += 210;
		var y = Math.floor(Math.random()*250)-25;
		$(".crowd").append('<img id="avatar'+i+'"src="images/avatar'+model+'.png" style="z-index:'+(y+100)+';"></div>');
		document.getElementById("avatar"+i).style.margin = y+"px 0 0 "+x+"px";
		//startEnjoying(i);
		numAvatars += 1;
	}
	
	if (Math.random()<0.5) {
		var i = Math.floor(Math.random()*10)+1;
		$("#avatar"+i).attr("src", "images/avatarHomer.png");
	}
}

////////////////////////////////
// Voting
////////////////////////////////

var p1votes=0;
var p2votes=0;
var p1awesome = false;
var p2awesome = false;
var prevAverage=0.5;

function setVoteBars(numVotesLeft, numVotesRight) {
	// Update the UI to show the current vote total
	var constant = 2.4; //arbitrary scaling constant, change for pleasure
	var p1 = (numVotesLeft*constant); 
	var p2 = (numVotesRight*constant);
	$(".bar.left").animate({width: p1+"%"}, 100);
	$(".bar.right").animate({width: p2+"%"}, 100);
}

////////////////////////////////
// Sounds
////////////////////////////////

function playSound( id, position, isBeat ) {
	// Play the sound starting a certain number of milliseconds in
	position = (typeof position == "undefined") ? 0 : position;
	isBeat = (typeof isBeat == "undefined") ? false : isBeat;
	
	if ( isBeat ) {
		var beatIndex=id[4];
		var song = songInfo[beatIndex];
		setSongInfo(song.name, song.artist, song.url);
	}
	
	var sound = soundManager.getSoundById(id);
	sound.setPosition(position);
	sound.play();
}

function stopSound() {
	// Stop all sounds from playing
	soundManager.stopAll();
}


////////////////////////////////
// Stage
////////////////////////////////




////////////////////////////////
// Countdown Clock
////////////////////////////////

var time = 30;
var countdownInterval;
var setTimerInterval;

function setTimer( value, time ) {
	// animate the clock to the given value in time milliseconds
	stopCountdown();
	time = typeof(time) != 'undefined' ? time : 1000; // default time 1 second
	setTimerValue( 0 );
	setTimerInterval = setInterval("incrementTimer("+value+")", time/value);
}

function startCountdown() {
	// Begin counting down to zero
	stopCountdown();
	countdownInterval = setInterval("decrementTimer()", 1000);
}

function stopCountdown() {
	// Freeze the clock
	clearInterval(countdownInterval);
}

function setTimerValue( seconds ) {
	// Set the timer to seconds
	time = Math.floor(seconds);
    if (time < 10) {
        time = "0" + time + '';
    }
    $('#timer').text(":"+time);
}

function setTimerColor(value) {

	$('#timer').css("color", value);
}

function incrementTimer( limit ) {
	// Increase the clock by a second
	time += 1;
	setTimerValue( time );
	if ( time >= limit ) {
		setTimerValue( limit );
		clearInterval( setTimerInterval );
	}
}

function decrementTimer() {
	// Decrease the clock by a second
	time -= 1;
	
	if ( time <= 0 ) {
		setTimer( 0 );
		clearInterval( countdownInterval );
	}
	setTimerValue( time );
}


////////////////////////////////
// State Transitions
////////////////////////////////

flashingID = 0;
var numBling = 0;
		


function setSongInfo(name, artist, url) {
	//beatIndex should be number from 1 to maxBeats
	//should correspond to the index of the beat in soundManager
	
	
	$('.songinfo').html(name+'<br>'+artist+'<br><a href=\"'+url+'\"> Buy on iTunes </a>');


}

function moveSpotlight(left) {
	// Change who the spotlight is on
	turnSpotlightOff();
	if ( left ) {
		$(".video0").css("box-shadow", "0px 0px 40px #fff");
	} else {
		$(".video1").css("box-shadow", "0px 0px 40px #fff");
	}
}

function turnSpotlightOff() {
	$(".video").css("box-shadow", "none");
}

//Setting queue from server
function clearQueue()
{
	$(".queue").empty();
	
}
function setQueue(data) {
// data should contain list of player names in order of queue
	clearQueue();
	var list=document.getElementById("queue");
	
	
	//the word "lineup"
	var lineup = document.createElement("h4");
	lineup.setAttribute("id", "queue_lineup");
	lineup.innerHTML="Lineup";
	
	list.insertBefore(lineup);
	
	for(var i=0; i<data.length; i++){
		var bullet=document.createElement("li");
		bullet.innerHTML=data[i];
		list.insertBefore(bullet);
	}
	


}
function dropBling(left) {
	numBling += 1;
	var margin = 70;
	if (!left) margin = 570;
	$(".stage").prepend('<img class="bling" id="bling'+numBling+'" style="left: '+margin+'px" src="images/bling.png">');
	$("#bling"+numBling).animate({"top": "+=650px"}, 1000);
}

function flash(numFlashes) {
	for (var i=0; i<numFlashes; i++) {
		$(".popover").fadeTo(100,1);
		$(".popover").fadeTo(100,0);
	}
}

function clearBling() {
	$(".bling").remove();
}



function transition(left) {
	playSound('airhorn'); 
	moveSpotlight(left);
}

function winner(left) {
	dropBling(left);
	playSound('hyphyairhorn2');
	flash(3);
}

function crowdGoesWild(go) {
	// If go is true, start the "Crowd Goes Wild" state
	// If false, go back to normal
	if (go) {
		flashingID = setInterval(function(){flash(1);}, 1000);  //start interval for repeating the animation
		playSound('hornExplode'); //make this serverside
		for (var i=0; i<numAvatars; i++) {
			startEnjoying(i);
		}
	} else {
		clearInterval(flashingID);
		for (var i=0; i<numAvatars; i++) {
			stopEnjoying(i);
		}
	}
}

function crowdAction (action) {
  
  // temporarily disable this
  //console.log('crowdAction ' + action + ' (disabled for now)');
  //return;
	// the crowd has been taking up too much cpu
  
  if (action == 'wild') {
		flashingID = setInterval(function(){flash(1);}, 1000);  //start interval for repeating the animation
		playSound('hornExplode'); //make this serverside
		for (var i=0; i<numAvatars; i++) {
			startEnjoying(i);
		}
  } else if (action == 'dance') {
		for (var i=0; i<numAvatars; i++) {
			startEnjoying(i);
		}
  } else if (action == 'calm') {
		for (var i=0; i<numAvatars; i++) {
      if (i % 2 === 0) {
			  startEnjoying(i);
      } else {
			  stopEnjoying(i);
      }
    }
  } else if (action == 'stop') {
		for (var i=0; i<numAvatars; i++) {
			stopEnjoying(i);
		}
	} else {
		for (var i=0; i<numAvatars; i++) {
			startEnjoying(i);
		}
	}
  
}

function tellPlayerToGo() {
	//alert("GO!!");
}



////////////////////////////////
// Info UI
////////////////////////////////

// left info panel

function uiLoadInfo0(content) {
 $('#info0').html(content);
}


// right info panel

function uiLoadInfo1(content) {
 $('#info1').html(content); 
}




////////////////////////////////
// Player UI
////////////////////////////////


// display a welcome message for new users

function uiShowDialog() {
	$( "#enqueue-popup" ).modal({opacity:0});
  $( "#facebookbtn" ).bind('click', function(){
    window.location.href = '/player/login';
  });
}


function uiLoadPlayerNav(player) {
  var nav = '';
  if (player.is_logged_in) {
    nav += '<div id="playerText"><div id="playerName" onclick="uiPlayerSetup();"><span>' + player.name + '</span></div>';
    nav += '<a href="/player/logout">Log Out</a></div>';
    nav += '<img id="profImage" src="' + player.facebook_image_url + '" width="50" height="50" />';
    $('#playerNav').html(nav);

  } else {
    nav += '<div id="login"><a href="/player/login">Log In</a></div>';
    $('#playerNav').html(nav);


  }
}


function uiPlayerSetup () {
  var divName = "#floatPlayerSetup";
  menuyloc = parseint($(divname).css("top").substring(0,$(divname).css("top").indexof("px")))

  $(divname).show();

  $(window).scroll(function () {
    offset = menuyloc+$(document).scrolltop()+"px";
    $(divname).animate({top:offset},{duration:350,queue:false});
  });
  
  $(divName).html('<form id="playerSetup">Set your stage name: <br><input type="text" name="name" id="name"/><br/><button id="submitButton">Save</button></form>');
  
  // what to do when the player clicks on the button
	$('#playerSetup #submitButton').bind('click', function(){
    
    //alert($('#playerSetup #name').val() ); 
     
    $.ajax('/player/update', {
      type: "POST",
      data: "name=" + $('#playerSetup #name').val(),
      success: function () {
        
		model.player.name = $('#playerSetup #name').val();
		uiLoadPlayerNav(model.player);
		
		
        $(divName).fadeOut('slow', function() {
        
        });
      },
      fail: function (jqXHR, textStatus) {
        alert(textStatus);  
      },
      //dataType: dataType
    }); 
	
    return false;
	
	});

}

