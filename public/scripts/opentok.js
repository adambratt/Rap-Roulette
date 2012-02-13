/* assumes client library already loaded */

var OPENTOK = {
  apiKey : '11324312',
  sessionId : '1_MX4wfn4yMDEyLTAxLTIyIDE3OjA0OjAxLjU5ODY2NCswMDowMH4wLjAzMjIwNDA3MTY5Mzd-',
  token : 'devtoken',
  divs : [ 'pub0', 'pub1' ],
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
  OPENTOK.session.addEventListener('signalReceived', OPENTOK.signalHandler);
  
  OPENTOK.session.connect(OPENTOK.apiKey, OPENTOK.token);
}

function addStream(stream, div) {
	// Check if this is the stream that I am publishing, and if so do not publish.
	if (stream.connection.connectionId == OPENTOK.session.connection.connectionId) {
		return;
	}
	OPENTOK.session.subscribe(stream, div,  { height: 240, width: 320 });
	OPENTOK.nextStream++;
}

OPENTOK.sessionConnectedHandler = function(event) {
  // Subscribe to all streams currently in the Session
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i], OPENTOK.divs[OPENTOK.nextStream]);
	}

  /*$('body').keypress(function(event) {
    if (!OPENTOK.publisher && event.which == 43) { // the + key
    	OPENTOK.publisher = OPENTOK.session.publish(OPENTOK.divs[OPENTOK.nextStream], { height: 240, width: 320 });
    	OPENTOK.nextStream++;
    }
  });*/
}

function startPublishing(element){

	OPENTOK.publisher = OPENTOK.session.publish(element, { height: 240, width: 320 });

}

function stopPublishing(){
	/*var elm = OPENTOK.publisher.replaceElementId();
	alert(elm);
	var num = 0;
	
	var outer = document.getElementById("video_"+num);
	
	var newDiv=document.createElement("div");
	newDiv.setAttribute("id", elm);
	
	*/
	OPENTOK.session.unpublish(OPENTOK.publisher);
	
	//outer.appendChild(newDiv);

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

/* this was not present in the demo version of this script
function forceUnpublishStream(streamId) {
    session.forceUnpublish(subscribers[streamId].stream);
}
*/

OPENTOK.streamCreatedHandler = function(event) {
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i], OPENTOK.divs[OPENTOK.nextStream]);
	}
}

OPENTOK.signalHandler = function(event) {
	event.streams[0].publishAudio(false);

}

OPENTOK.streamDestroyedHandler = function(event) {

}
