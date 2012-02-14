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

  
  OPENTOK.session.connect(OPENTOK.apiKey, OPENTOK.token);
}

function addStream(stream, div) {
	// Check if this is the stream that I am publishing, and if so do not publish.
	if (stream.connection.connectionId == OPENTOK.session.connection.connectionId) {
		return;
	}
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
  
  
	
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i], OPENTOK.divs[OPENTOK.nextStream]);
	}
	
	
	

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
	
	var id = OPENTOK.publisher.id;
	emitPublished(num, id);
	
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



OPENTOK.streamCreatedHandler = function(event) {
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i], OPENTOK.divs[OPENTOK.nextStream]);
	}
}



OPENTOK.streamDestroyedHandler = function(event) {

}
