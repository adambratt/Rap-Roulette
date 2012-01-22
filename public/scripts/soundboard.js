


$(window).keydown(function(e) {
	
	switch(e.keyCode){
		//1-6
	case 49:
		playSound("sounds/luger+explosion.wav"); break;
	case 50:
		playSound("sounds/airhorn.wav");break;
	case 51:
		playSound("sounds/hyphyairhorn1.wav");break;
	case 52:
		playSound("sounds/hyphyairhorn2.wav");break;
	case 53:
		playSound("sounds/hyphyairhorn3.wav");break;
	case 54:
		playSound("sounds/explosion.wav");break;
		
	case 81: //q
		playBeat("sounds/lemonade.mp3");break;
		
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
	case 67: //c
		player1_vote();break;
	case 86: //v
		player2_vote();break;
		
	
		
	
		
	
	
	}
	
	
});
	
	
