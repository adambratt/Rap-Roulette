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
		
function player1_vote(){
	p1votes+=1;
	updateGraph();
}

function player2_vote(){
	p2votes+=1;
	updateGraph();
}

function updateGraph() {
    var constant = 2.4; //arbitrary scaling constant, change for pleasure
	var p1=(p1votes*constant); 
	var p2=(p2votes*constant);
	$(".bar.left").animate({width: p1+"%"}, 100);
	$(".bar.right").animate({width: p2+"%"}, 100);
	if ( p1 >= 40 && !p1awesome) {
		$(".speaker.left").hide("explode", 1000);
		p1awesome = true;
		crowdGoesWild(true);
	}
	if ( p2 >= 40 && !p2awesome ) {
		$(".speaker.right").hide("explode", 1000);
		p2awesome = true;
		crowdGoesWild(true);
	}
}
		
function switch_vote(p1) {
	//p1 is a bool
	//true means user switched their vote from p2->p1,
	//false means user switched their vote from p1->p2
	
	if(p1){
		p2votes-=1;
		player1_vote();
	}
	else{
		p1_votes-=1;
		player2_vote();
	}
	
}
//spire moving functions
function decrement() {
	var angle=$("#spire").rotate(); //returns current angle in some bullshit form
	var angleString=(""+angle).replace("deg",""); //send the bullshit to a string, get rid of 'deg'
	var angleNum=parseFloat(angleString); //send string to int for comparison purposes
			
	if(angleNum<-80) { //if we're at -80 or below, just go to -90
		$(".meter").animate({rotate: '-90deg'}, 500);	
		return;
	}
	$(".meter").animate({rotate: '-=10deg'}, 500);	//if we're below 80, rotate 10 degrees counterclockwise
			
}

function increment() {
	var angle=$(".meter").rotate(); //returns current angle in some bullshit form
	var angleString=(""+angle).replace("deg",""); //send the bullshit to a string, get rid of 'deg'
	var angleNum=parseFloat(angleString); //send string to int for comparison purposes
			
	if(angleNum>80) { //if we're at 80 or above, just go to 90
		$(".meter").animate({rotate: '90deg'}, 500);	
		return;
	}
	$(".meter").animate({rotate: '+=10deg'}, 500);	 //if we're below 80, rotate 10 degrees clockwise
			
}
		
function setMeter(ratio) {
	//REQUIRES: 0<=ratio<=1
			
	//ratio of 1 means all the way to the right,
	//ratio of 0 means all the way to the left
			
	if((ratio-prevAverage)>0)
		player2_vote();
	else player1_vote();
			
	prevAverage=ratio;
			
	var angle=Math.asin(2*ratio-1); //will return a radian angle between -PI/2 to PI/2
			
	//convert to degrees
	angle=(angle*180)/Math.PI; 

	//animate
	$(".meter").animate({rotate: angle+"deg"}, 500);	
			
}

function resetMeter() {
	//set meter to center
	setMeter(0.5);
}

////////////////////////////////
// Popup stuff
////////////////////////////////

function showDialog() {
$( "#enqueue-popup" ).modal(
	{opacity:0}
);


}


////////////////////////////////
// Sounds
////////////////////////////////

function playSound(soundfile) {

	gSock.emit('sendSound', soundfile);
}
function stopSound() {
	gSock.emit('stopSound');

}
	
function playBeat(soundfile) {
	document.getElementById("beatplayer").innerHTML=
	"<embed src=\""+soundfile+"\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
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
	stopCountdown();
	countdownInterval = setInterval("decrementTimer()", 1000);
}

function stopCountdown() {
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

function incrementTimer( limit ) {
	time += 1;
	setTimerValue( time );
	if ( time >= limit ) {
		setTimerValue( limit );
		clearInterval( setTimerInterval );
	}
}

function decrementTimer() {
	time -= 1;
	
	if ( time <= 0 ) {
		setTimer( 0 );
		clearInterval( countdownInterval );
	}
	setTimerValue( time );
}

////////////////////////////////
// UI State Transitions
////////////////////////////////

flashingID = 0;
var numBling = 0;
		


function moveSpotlight(left) {
	// Flip and flash spotlight
	for (var i=0; i<3; i++) {
		$(".spotlight").fadeTo(100,0);
		$(".spotlight").fadeTo(100,1);
	}
	$(".spotlight").fadeTo(100,0);
	if (left) {
		$(".spotlight").rotate3Di(0, 1000);
	} else {
		$(".spotlight").rotate3Di(180, 1000);
	}
			
	for (var i=0; i<3; i++) {
		$(".spotlight").fadeTo(100,0);
		$(".spotlight").fadeTo(100,1);
	}
}

function turnSpotlightOff() {
	$(".spotlight").fadeTo(100,0);
}

function playSound(id, position) {
	var sound = soundManager.getSoundById(id);
	sound.setPosition(position);
	sound.play();

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
	var margin = 95;
	if (!left) margin = 550;
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




////////////////////////////////
// Do this on page load
//
// NOTE: moved to index.js
////////////////////////////////
