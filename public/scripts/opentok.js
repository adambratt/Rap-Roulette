/* assumes client library already loaded */

var OPENTOK = {
  apiKey : '11324312',
  sessionId : '1_MX4wfn4yMDEyLTAxLTIyIDE3OjA0OjAxLjU5ODY2NCswMDowMH4wLjAzMjIwNDA3MTY5Mzd-',
  token : 'devtoken',
  divs : [ '0', '1' ],
  nextStream : 0,
  publisher: null  // http://www.tokbox.com/opentok/api/tools/js/documentation/api/Publisher.html
};




function initOPENTOK () {
  
  if (typeof game_debug !== 'undefined' && game_debug > 1) {
    
    // http://www.tokbox.com/opentok/api/tools/js/documentation/api/TB.html
    TB.setLogLevel(TB.DEBUG);

  }

  OPENTOK.connectToSession();

}


OPENTOK.connectToSession = function(room) {
  // ignore room for now, just one session hardcoded
  
  // http://www.tokbox.com/opentok/api/tools/js/documentation/api/TB.html#initSession
  OPENTOK.session = TB.initSession(OPENTOK.sessionId);
  
  OPENTOK.session.addEventListener('sessionConnected', OPENTOK.sessionConnectedHandler);
  OPENTOK.session.addEventListener('sessionDisconnected', OPENTOK.sessionDisconnectedHandler);
  OPENTOK.session.addEventListener('connectionCreated', OPENTOK.connectionCreatedHandler);
  OPENTOK.session.addEventListener('connectionDestroyed', OPENTOK.connectionDestroyedHandler);
  OPENTOK.session.addEventListener('streamCreated', OPENTOK.streamCreatedHandler);
  OPENTOK.session.addEventListener('streamDestroyed', OPENTOK.streamDestroyedHandler);
  OPENTOK.session.addEventListener('signalReceived', OPENTOK.signalReceivedHandler);

  
  OPENTOK.session.connect(OPENTOK.apiKey, OPENTOK.token);
}

function getStreamId() {

  if (typeof OPENTOK.session.connection !== 'undefined') {
	  return OPENTOK.session.connection.connectionId;
  } else {
    console.error('getStreamId(): there is no connectionId in the OPENTOK.session.connection.');
    return undefined;
  }
}


// add stream

function addStream(stream, div) {
	
  // Check if this is the stream that I am publishing, and if so do not publish.
	if (stream.connection.connectionId == OPENTOK.session.connection.connectionId) {
		return;
	}
		
	console.log('publish to video_'+div);
	
	var element="pub"+div;
	var outer = document.getElementById("video_"+div);
	var newDiv=document.createElement("div");
	newDiv.setAttribute("id", element);
	outer.appendChild(newDiv);
		
	OPENTOK.session.subscribe(stream, "pub"+div,  { height: 240, width: 320 });
	OPENTOK.nextStream++;
	
	if(OPENTOK.nextStream > 1) 
		OPENTOK.nextStream=0;
}


OPENTOK.sessionConnectedHandler = function(event) {
  // Subscribe to all streams currently in the Session
 console.log('sessionCreatedHandler');
  
	if(	typeof model.battle!=="undefined" ) {
	  console.log('model.battle: ' + model.battle);

      if ( typeof model.battle.left!=="undefined" && typeof model.battle.left.stream_id!=="undefined" ) {
	      console.log('model.battle.left' + model.battle.left);
        console.log('sessionConnectedHandler: left stream_id ' + model.battle.left.stream_id);
      }
			
		  if ( typeof model.battle.right!=="undefined" && typeof model.battle.right.stream_id!=="undefined" ) {
	      console.log('model.battle.right' + model.battle.right);
        console.log('sessionConnectedHandler: right stream_id ' + model.battle.right.stream_id);
      }
	
  } else {
    console.log('there is no battle going on in this room');
    return;
  }
 

  // deal with the publishing of streams
  if (model.battle.left.player_id == model.player.id) {
    console.log('This is the publishing player (left)');
    startPublishing(0);
  }
  
  if (model.battle.right.player_id == model.player.id) {
    console.log('This is the publishing player (right)');
    startPublishing(1);
  }
  
  
  // deal with the consumption of streams

  console.log(event.streams.length + ' connections found:');

	for (var i = 0; i < event.streams.length; i++) {
		console.log(event.streams[i].connection.connectionId);
		
    if(	typeof model.battle.left!=="undefined"
			&& typeof model.battle.left.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==model.battle.left.stream_id)
		{
			console.log('adding stream to 0 for player_id ' + model.battle.left.player_id);
		  if (model.battle.left.player_id != model.player.id) {	
        addStream(event.streams[i], 0);
      } else {
        console.log('This is the publishing player... do not add stream!');
      }
		}
		
    if(	typeof model.battle.right!=="undefined"
			&& typeof model.battle.right.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==model.battle.right.stream_id)
		{
			console.log('adding stream to 1 for player_id ' + model.battle.right.player_id);
		  if (model.battle.right.player_id != model.player.id) {	
			  addStream(event.streams[i], 1);
      } else {
        console.log('This is the publishing player... do not add stream!');
      }
		}
		
	}
	
	console.log('end sessionConnectedHandler');

 /* $('body').keypress(function(event) {
    if (!OPENTOK.publisher && event.which == 43) { // the + key
    	startPublishing(0);
    	OPENTOK.nextStream++;
    }
  });*/
}

function startPublishing(num){
  console.log('opentok.startPublishing ' + num);
	
	var element="pub"+num;
	var outer = document.getElementById("video_"+num);
	var newDiv=document.createElement("div");
	newDiv.setAttribute("id", element);
	outer.appendChild(newDiv);

  try {
	  OPENTOK.publisher = OPENTOK.session.publish(element, { height: 240, width: 320 });
  } catch (err) {
    console.error('startPublishing(' + num + ') failed: ' + err);
  }
  
  // ...this unfinished work (below) probably should be removed...
	var id;
  if (typeof OPENTOK.session.connection !== 'undefined') {
    id = OPENTOK.session.connection.connectionId;	
  }

}


function startSubscribing(num, id) {



}

function stopPublishing(){

	OPENTOK.session.unpublish(OPENTOK.publisher);
	
	

}

function mute(){
	//mute yourself
  if (typeof OPENTOK.publisher !== 'undefined' && OPENTOK.publisher) {
	  OPENTOK.publisher.publishAudio(false);
  } else {
    console.error('mute(): no publisher is available to mute.');
  }
}
function unmute(){
	//unmute yourself
	
  if (typeof OPENTOK.publisher !== 'undefined' && OPENTOK.publisher) {
    OPENTOK.publisher.publishAudio(true);
  } else {
    console.error('unmute(): no publisher is available to unmute.');
  }
}

OPENTOK.sessionDisconnectedHandler = function(event) {
  
}

OPENTOK.connectionCreatedHandler = function(event) {
  
}

OPENTOK.connectionDestroyedHandler = function(event) {
  
}

OPENTOK.signalReceivedHandler = function(event){
/*
	console.log('signalReceivedHandler');
	if(	typeof model.battle.left!=="undefined"
			&&typeof model.battle.left.stream_id!=="undefined"
			
			&&typeof model.battle.right!=="undefined"
			&& typeof model.battle.right.stream_id!=="undefined")
			
			{
	
	console.log('model' + model);
	console.log('model.battle' + model.battle);
	console.log('model.battle.left' + model.battle.left);
	console.log('model.battle.right' + model.battle.right);
	}
	else console.log('something undefined');
	console.log('got signal from:');

		console.log(event.fromConnection.connectionId);
		if(	typeof model.battle.left!=="undefined"
			&&typeof model.battle.left.stream_id!=="undefined"
			&& event.fromConnection.connectionId==model.battle.left.stream_id)
			{
				console.log('adding stream to 0');
				addStream(event.streams[i], 0);
				}
				
		if(	typeof model.battle.right!=="undefined"
			&& typeof model.battle.right.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==model.battle.right.stream_id)
			{
				console.log('adding stream to 1');
				addStream(event.streams[i], 1);
				
				}
		
}
	
	console.log('end handler');
*/

}



OPENTOK.streamCreatedHandler = function(event) {
//loops through all the active connections in the session, tries to find which connnection_id 
//matches the stream_id we have stored in curLeft and curRight (our client-side record of who is rapping and where)
//and subscribes to the proper stream

	console.log('left stream id: ' + curLeft.stream_id);
	console.log('right stream id: ' + curRight.stream_id);

	

console.log('StreamCreatedHandler');

	if(	typeof model.battle.left!=="undefined"
			&&typeof model.battle.left.stream_id!=="undefined"
			
			&&typeof model.battle.right!=="undefined"
			&& typeof model.battle.right.stream_id!=="undefined")
			
			{
	
	console.log('model' + model);
	console.log('model.battle' + model.battle);
	console.log('model.battle.left' + model.battle.left);
	console.log('model.battle.right' + model.battle.right);
	}
	else console.log('something undefined');
	console.log('connections found:');

	for (var i = 0; i < event.streams.length; i++) {
		console.log(event.streams[i].connection.connectionId);
		if(	typeof curLeft!=="undefined"
			&&typeof curLeft.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==curLeft.stream_id)
			{
			console.log('adding stream to 0');
				addStream(event.streams[i], 0);
				}
		if(	typeof curRight!=="undefined"
			&& typeof curRight.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==curRight.stream_id)
			{
				console.log('adding stream to 1');
				addStream(event.streams[i], 1);
				}
		
	}
	
	console.log('end handler');

}



OPENTOK.streamDestroyedHandler = function(event) {
//when a stream is destroyed, unsubscribe everyone from it
	for (var i = 0; i < event.streams.length; i++) {
		subscribers = OPENTOK.session.getSubscribersForStream(event.streams[i]);
		for(var i =0; i < subscribers.length; i++) {
			OPENTOK.session.unsubscribe(subscribers[i]);
		}
	}

}
