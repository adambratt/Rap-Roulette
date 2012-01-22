// Avatar info
animations = new Array(); //stores interval # 
original_positions = new Array(); //stores original position of avatar
		
var p1votes=0;
var p2votes=0;
var prevAverage=0.5;
		
		function player1_vote(){
			p1votes+=1;
			updateGraph();
		
		}
		function player2_vote(){
			p2votes+=1;
			updateGraph();
		
		}
		function updateGraph(){
			var p1=(p1votes*3);
			var p2=(p2votes*3);
			
			
			$(".bar.left").animate({width: p1+"%"}, "fast");
			
			$(".bar.right").animate({width: p2+"%"}, "fast");
		
		}
function startEnjoying(index) {
	// Choose a random animation and start it
	original_positions[index] = $("#avatar"+index).offset();
	startJumping(index);
	/*var i = Math.floor(Math.random()*2);
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
			// Stop the animation
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
			// Make the avatar rotate rhythmically
			var theta = Math.floor(Math.random()*10)+5;
			$("#avatar"+index).animate({rotate: '-'+theta+'deg'}, 500); 
			$("#avatar"+index).animate({rotate: theta+'deg'}, 500);
		}
		
		function startJumping(index) {
			// Start the avatar jumping
			animations[index]=setInterval(function(){jump(index);}, Math.floor(Math.random()*400)+100);  //start interval for repeating the animation
		}

		function jump(index) {
			// Make the avatar jump up and down
			var height = Math.floor(Math.random()*20)+20; //jumps to a random height each time
			$("#avatar"+index).animate({"top": "-="+height+"px"}, 250);
			$("#avatar"+index).animate({"top": "+="+height+"px"}, 250);
		}
		
		//spire moving functions
		function decrement()
		{
			var angle=$("#spire").rotate(); //returns current angle in some bullshit form
			var angleString=(""+angle).replace("deg",""); //send the bullshit to a string, get rid of 'deg'
			var angleNum=parseFloat(angleString); //send string to int for comparison purposes
			
			if(angleNum<-80) //if we're at -80 or below, just go to -90
			{
				$(".meter").animate({rotate: '-90deg'}, 500);	
				return;
			}
			$(".meter").animate({rotate: '-=10deg'}, 500);	//if we're below 80, rotate 10 degrees counterclockwise
			
		}
		function increment()
		{
			var angle=$(".meter").rotate(); //returns current angle in some bullshit form
			var angleString=(""+angle).replace("deg",""); //send the bullshit to a string, get rid of 'deg'
			var angleNum=parseFloat(angleString); //send string to int for comparison purposes
			
			if(angleNum>80) //if we're at 80 or above, just go to 90
			{
				$(".meter").animate({rotate: '90deg'}, 500);	
				return;
			}
			$(".meter").animate({rotate: '+=10deg'}, 500);	 //if we're below 80, rotate 10 degrees clockwise
			
		}
		
		function setMeter(ratio)
		{
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
		function resetMeter() //set meter to center
		{
			setMeter(0.5);
		}
		
		function hideQueue() {

		$(".getinline").hide();
		$(".queue").hide();	
		
		}
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

	function playSound(soundfile) {
		document.getElementById("soundplayer").innerHTML=
		"<embed src=\""+soundfile+"\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
	}
	
	function playBeat(soundfile) {
		document.getElementById("beatplayer").innerHTML=
		"<embed src=\""+soundfile+"\" hidden=\"true\" autostart=\"true\" loop=\"false\" />";
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
		startEnjoying(i);
	}
	
	if (Math.random()<0.5) {
		var i = Math.floor(Math.random()*10)+1;
		$("#avatar"+i).attr("src", "images/avatarHomer.png");
	}
}

function dropBling(left) {
	$(".stage").prepend('<img id="bling" src="images/bling.png">');
	$("#bling").css("z-index", "100");
	$("#bling").css("position", "absolute");
	$("#bling").css("top", "-500px");
	if (left) $("#bling").css("left", "95px");
	else $("#bling").css("left", "550px");
	$("#bling").animate({"top": "+=650px"}, 1000);
}

function flash() {
	$(".popover").fadeTo(100,1);
	$(".popover").fadeTo(100,0);
}

function removeBling() {
	$("#bling").remove();
}

function loser(left) {
	$(".crowd").hide( "explode", {pieces: 16 }, 2000 );
}

// Do this on page load
$(document).ready(function(){
	populateRoom();
	updateGraph();
	hideQueue();
});