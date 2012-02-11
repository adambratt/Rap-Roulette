var model = require('../lib/model')
  , Player = model.Player
  , Room = model.Room
  , Session = model.Session
  , util = require('util')
;


// index

exports.index = function(req, res){
  //res.render('index')
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write("Players");
  res.end();
};

// create
// TODO: post-only this
// TODO: enable this for admins only

exports.create = function(req, res){

  obj = {
    name: req.query.name,
    service: req.query.service,
  };

  Player.create(null, obj, function (err, player) {
    delete player['_id'];
    res.json(player);

  });
};




// myself

exports.myself = function(req, res){
 
  //console.log(util.inspect(req.sessionID));

  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
    player = Player.get_myself(null, req.session.player_id, function (err, player) {
      if (typeof player === 'undefined') { res.json({ error: { message: 'Player not found.' }}); return; }

      delete player['_id'];
      res.json(player);
    });
  } else {
      res.json({ error: { message: 'Player not in session.' }});
  }
  
};



// mysession

exports.mysession = function (req, res) {
  var sid = req.sessionID;
 
  Session.get(null, sid, function (err, session) { 
      
      if (typeof session !== 'undefined') {
        res.json(session);
      }

  });

}




// mysid
// this returns the session id and is necessary because the sid cannot be acquired in the client
// from the connect.sid cookie due to protection via node specifying httpOnly for this cookie

exports.mysid = function(req, res){
    
    //console.log(util.inspect(req.sessionID));
    res.json(req.sessionID);

};




// view

exports.view = function(req, res){
    
  id = req.params.id;
  
  Player.get(null, id, function (err, player) {
    res.json({
      id: player.id, 
      name: player.name, 
      is_logged_in: player.is_logged_in, 
      room_id: player.room_id, 
      is_in_queue: player.is_in_queue
    });
  });

};


// list

exports.list = function(req, res){
  
  Player.list(null, {}, function (err, players) {
    
    // remove the mongo _id
    for (var i=0; i < players.length; i++) {
      delete players[i]['_id'];
    }
    
    res.json(players);
  
  });

};

// loggedin

exports.loggedin = function(req, res){
 
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
      res.json(true);
  } else {
      res.json(false);
  }
  
};


// login

exports.login = function (req, res) {
  res.redirect('/auth/facebook');
}


// login and enter queue

exports.login_and_enter_queue = function (req, res) {
  var sid = req.sessionID;
 
  req.session.trigger_enter_queue_after_login = true;
  
  //Session.get(null, sid, function (err, session) { 
  
  Session.collection.findAndModify( {
    query: {_id: sid}, 
    update : { "$set": { trigger_enter_queue_after_login: true} }, 
      'new': false
    },
    function (err, session_record) {
      
      //session = JSON.parse(session_record.session);
      //if (typeof session !== 'undefined') {
        // session not found
      //}
    
    res.redirect('/auth/facebook');
  
  });

}


// login_redirected
// where the user is redirected after logging into the remote service

exports.login_redirected = function(req, res){
  
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
    
    Room.get_myroom(null, req.session.player_id, function (err, room) {
      
      if (room.id == 'main_stage') {
        res.redirect('/');
      } else {
        res.redirect('/rooms/' + room.id);
      }
      
    });

  } else {  
    res.redirect('/');
  }

};


// logout

exports.logout = function (req, res) {

  //if (typeof req.session !== 'undefined') {
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') { 

    // store that the player is logged out
    Player.collection.findAndModify( {
        query: {id: req.session.player_id}, 
        update : { "$set": { is_logged_in: 0} }, 
        'new': false
      },
      function (err) {
        
        // clear the session
        req.session.auth = null;
        res.clearCookie('auth');  
        req.session.destroy(function() {});
        delete req.sessionID;
        res.json({ success: { nessage: 'Player was logged out' } });

        }
      )

    /*
    Player.collection.(null, req.session.user_id, function (err) {
     
      // clear the session
      req.session.auth = null;
      res.clearCookie('auth');  
      req.session.destroy(function() {});
    
      res.writeHead(200, {"Content-Type": "application/json"});
      res.write(util.inspect({ success: { nessage: 'Player was logged out' } }));
      res.end();    
  
    });
    */

  } else {
    
    res.json({ success: { message: 'Player was not logged in.'} });
 
  }

  //res.partial('user/logout', {});
};


// update

exports.update = function (req, res) {

  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
  
  console.log(util.inspect(req.body));
      
  Player.collection.findAndModify( {
    query: {id: req.session.player_id}, 
    update : { "$set": { name: req.body.name} }, 
      'new': false
    },
    function (err, player) {
      res.json({ success: {message: 'Your profile was updated.'}});
  });

  } else {
  
      display_404( req, res); 
      return;
  }

}


function display_404(req, res) {
  res.writeHead(404, {'Content-Type': 'text/html'});
  res.write("<h1>404 Not Found</h1>");
  res.end("That page cannot be found");
}





