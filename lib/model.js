
var cfg = require('../config').Config
  , mysql = require('mysql')
  , client = mysql.createClient({
        database: cfg.db.database,
        user: cfg.db.user,
        password: cfg.db.password,
    port: cfg.db.port
  })
  , ea = require('../node_modules/everyauth/index')
  , util = require('util');


// catch uncaught exceptions that occur when mysql cannot be connected to

process.on('uncaughtException', function (err) {
  if (err.code == 'ECONNREFUSED') {
    console.log('Probably the database cannot be connected to in model.js');
  }
  console.log(err);
}); 


// Battles
// ============================================================================

/*
var example_battle = {
  id: 1,
  name: 'January 2012 Final Match',
  song_id: 1,
  players: [1, 2],
  player: {
    1: { votes: 7, disses: 2 },
    2: { votes: 3, disses: 5 }
  },
  rounds: [1, 2, 3],
  round: {
    1: { winning_player: 1 },
    2: { winning_player: 2 },
    3: { winning_player: 1 },
  }
};
*/

// persistent battles
var Battles = {};

// constructor
var Battle = exports.Battle = function () {

}

// create battle

exports.Battle.create = battle_create = function (err, obj, cb) {
  
  // generate an id
  obj.id = get_next_id(Battles);
  
  // make sure that only one battle happens in a room
  if (typeof obj.room_id !== 'undefined') {
    // TODO

  } else {
    // TODO
  }

  Battles[obj.id] = obj;
  return Battles[obj.id];
}

// drop battle

exports.Battle.drop = battle_drop = function (err, id, cb) {
  delete Battles[id];
}

// get battle

exports.Battle.get = battle_get = function (err, id, cb) {
  return Battles[id];
}

// list battles

exports.Battle.list = battle_list = function (err, query, cb) {
  return Battles;
}



// Players
// ============================================================================

/*
var example_player = {
  id: 1,  // same id as in the mysql db
  service: 'facebook',
  name: 'First Last',
  current_room_id: 1,
  current_battle_id: 1,
};
*/

// persistent players
var Players = {};

// constructor
var Player = exports.Player = function () {

}


// create player

exports.Player.create = player_create = function (err, obj, cb) {

  // no need to generate an id (this comes from the database)
  
  Players[obj.id] = obj;
  return Players[obj.id];

}


// drop player
// deletes a player from the model (as in "logs out", not deleted from the database)

exports.Player.drop = player_drop = function (err, id, cb) {
  delete Players[id];
}


// get player
// some players have to get got

exports.Player.get = player_get = function (err, id, cb) {
  return Players[id];
}


// get my player
// requires a request object
// TODO: handle user that is not logged in

exports.Player.get_myself = player_get_myself = function (err, req, cb) {
  console.log(util.inspect(req.session));
  if (typeof req.session !== 'undefined' && typeof req.session.user_id !== 'undefined') {
    user_get_from_db({ service: req.session.service, screen_id: req.session.screen_id }, function (err, dbUser) {
      player = player_get(err, dbUser.id, function () {});
      cb(err, player);
    });
  } else {
      cb(err, undefined);
  }

}

// list players

exports.Player.list = player_list = function (err, query, cb) {
  return Players;
}


// Rooms
// ============================================================================

/*
var example_room = {
  id: 1,
  name: 'Main Stage',
  battle_id: 1,
  player_queue: [3,4,5],
  players: [1,2,3,4,5,6,7,8,9],
  // NOTE: there are spectators but these are not logged in and therefore not tracked here //
};
*/

// persistent rooms (hard-coded for now)
var Rooms = {  
  1: { id: 1, name: 'Main Stage', battle_id: null, player_queue: [] }
};

// constructor
var Room = exports.Room = function () {

}

// create room

exports.Room.create = room_create = function (err, obj, cb) {
  
  // generate an id
  obj.id = get_next_id(Rooms); 
  
  Rooms[obj.id] = obj;
  return Rooms[obj.id];
}

// drop room

exports.Room.drop = room_drop = function (err, id, cb) {
  delete Rooms[id];
}


// get room

exports.Room.get = room_get = function (err, id, cb) {
  room = Rooms[id];
  cb(err, room);
}


// get my room
// requires a request obj and that the player be logged in

exports.Room.get_myroom = player_get_myroom = function (err, req, cb) {
  
  player_get_myself(err, req, function (err, player) {
    room = room_get(err, player.room_id, function (err, room) {
      cb(err, room);
    });
  });

}

// list rooms

exports.Room.list = player_list = function (err, query, cb) {
  rooms = Rooms;
  cb(err, rooms);
}


// Songs
// ============================================================================

/*
var example_song = {
  id: 1,
  name: 'Lemonade',
  artist: 'Gucci Mane',
  file_url: 'audio/lemonade.mp3',
};
*/


// persistent songs (hard-coded for now)
var Songs = {
  1: {id: 1, name: 'Lemonade', artist: 'Gucci Mane', file_url: 'audio/lemonade.mp3' }
};

// constructor
var Song = exports.Song = function () {

}

// create song

exports.Song.create = song_create = function (err, obj, cb) {
  
  // generate an id
  obj.id = get_next_id(Songs);
  
  Songs[obj.id] = obj;
  return Songs[obj.id];
}


// Users
// ============================================================================


// persistent users
var Users = {};

var User = exports.User = function () {

}

// create user in the database
// callsback with the created user from the app

exports.User.create_in_db = user_create_in_db = function (err, obj, cb) {
  
  client.query(
    "INSERT INTO users (service, screen_name, screen_id) VALUES (?, ?, ?)",  
    [obj.service, obj.screen_name, obj.screen_id],
    function (err, results, fields) { 
      if (err) { 
        throw err; 
      } 

      user_get_from_db({ service: obj.service, screen_id: obj.screen_id }, function (err, user) {
      
        //console.log(util.inspect(results[0]));
        console.log('created user in the database and in the app');
            
        // callback
        cb(err, user);
      
      });

  });

}


// get user from datastore

exports.User.get_from_db = user_get_from_db = function (obj, cb)  {
  
  client.query(
    'SELECT * FROM users WHERE service = ? AND screen_id = ? LIMIT 1',
    [obj.service, obj.screen_id],
    function selectCb(err, results, fields) {
      
      if (err) {
        throw err;
      }
      
      //console.log(util.inspect(results[0]));
      
      // callback
      cb(err, results[0]);
        
    }
  );

}


// UTILITY METHODS
// ============================================================================


// get the next id in a hash with numbered keys

exports.get_next_id = get_next_id = function (hash) {
  if (hash[1] ==undefined) {
    return 1;
  } 
  
  var arr = Object.keys(hash);
  max_value = Math.max.apply( Math, arr );
  return max_value + 1;

}

