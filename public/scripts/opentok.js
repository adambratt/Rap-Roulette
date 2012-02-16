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

  // http://www.tokbox.com/opentok/api/tools/js/documentation/api/TB.html
  TB.setLogLevel(TB.DEBUG);

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

	if(	typeof model.battle!=="undefined" &&
		typeof model.battle.left!=="undefined"
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
		if(	typeof model.battle.left!=="undefined"
			&&typeof model.battle.left.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==model.battle.left.stream_id)
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

 /* $('body').keypress(function(event) {
    if (!OPENTOK.publisher && event.which == 43) { // the + key
    	startPublishing(0);
    	OPENTOK.nextStream++;
    }
  });*/
}

function startPublishing(num){

	
	var element="pub"+num;
	var outer = document.getElementById("video_"+num);
	var newDiv=document.createElement("div");
	newDiv.setAttribute("id", element);
	outer.appendChild(newDiv);
	OPENTOK.publisher = OPENTOK.session.publish(element, { height: 240, width: 320 });
	
	var id = OPENTOK.session.connection.connectionId;

	emitPublished(num, id);
	
	
	
}


function startSubscribing(num, id) {



}

function stopPublishing(){

	OPENTOK.session.unpublish(OPENTOK.publisher);
	
	

}

function mute(){

	
	OPENTOK.publisher.publishAudio(false);

}
function unmute(){
	
	OPENTOK.publisher.publishAudio(true);
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


	OPENTOK.session.signal();

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
		if(	typeof model.battle.left!=="undefined"
			&&typeof model.battle.left.stream_id!=="undefined"
			&& event.streams[i].connection.connectionId==model.battle.left.stream_id)
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

}



OPENTOK.streamDestroyedHandler = function(event) {
	for (var i = 0; i < event.streams.length; i++) {
		subscribers = OPENTOK.session.getSubscribersForStream(event.streams[i]);
		for(var i =0; i < subscribers.length; i++) {
			OPENTOK.session.unsubscribe(subscribers[i]);
		}
	}

}
