/* assumes client library already loaded */

var OPENTOK = {
  apiKey : '11324312',
  sessionId : '1_MX4wfn4yMDEyLTAxLTIyIDE3OjA0OjAxLjU5ODY2NCswMDowMH4wLjAzMjIwNDA3MTY5Mzd-',
  token : 'devtoken',
  divs : [ 'pub0', 'pub1' ],
  nextStream : 0
};

OPENTOK.connectToSession = function(room) {
  // ignore room for now, just one session hardcoded
  
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
	OPENTOK.session.subscribe(stream, div);
	OPENTOK.nextStream++;
}

OPENTOK.sessionConnectedHandler = function(event) {
  // Subscribe to all streams currently in the Session
	for (var i = 0; i < event.streams.length; i++) {
		addStream(event.streams[i], OPENTOK.divs[OPENTOK.nextStream]);
	}
	
	$('body').keypress(function(event) {
    if (!publisher && event.which == 43) {
    	publisher = OPENTOK.session.publish(OPENTOK.divs[OPENTOK.nextStream], { height: 240, width: 320 });
    	OPENTOK.nextStream++;
    }
  });
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

var publisher;

TB.setLogLevel(TB.DEBUG);
OPENTOK.connectToSession();
