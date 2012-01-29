
var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
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
  current_player: 22,
  current_round: 0,
  rounds: [1, 2, 3],
};
*/

// persistent battles
var Battles = {};

// constructor
var Battle = exports.Battle = function () {

}

// battle mongo collection
exports.Battle.collection = battle_collection = mongo_client.collection('battles');



// create battle

// TODO: this is not properly implemented as it allows battles to be creating
//        that have the same room_id

exports.Battle.create = battle_create = function (err, obj, cb) {


  // create a unique id
  create_unique_id(err, obj, function (err, id) {
    obj.id = id;
    
    // create the object in the collection
    Battle.collection.insert(obj, function (err) {
      
      // find the created object in the collection
      Battle.collection.findOne({ id: obj.id }, function(err, battle) {  
        cb(err, battle);
      });

    });
  
  });

}

// drop battle

exports.Battle.drop = battle_drop = function (err, id, cb) {

  //remove the object from the collection
  Battle.collection.remove({id: id}, function (err) {
    cb(err);    
  });

}


// get battle

exports.Battle.get = battle_get = function (err, id, cb) {
 
  // find the object in the collection
  Battle.collection.findOne({id: id}, function (err, battle) {
   cb(err, battle); 
  });

}


// list battles

exports.Battle.list = battle_list = function (err, query, cb) {
 
  Battle.collection.find(query).sort({ name: 1 }).toArray(function (err, battles) {
    cb(err, battles);    
  });

}



// Rounds
// ============================================================================

/*
var example_round = {
  id: 1,
  battle_id: 1,
  current_player: 22,
  player: {
    1: {mad_props: 12},
    2: {mad_props: 27}
  },
  winning_player: 2
};
*/




// Players
// ============================================================================

/*
var example_player = {
  id: 109328473478932045,  // mongodb id
  
  service: 'facebook',
  screen_nama: 'facebook name',
  screen_id: 'facebook unique identifier
  
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

// player mongo collection
exports.Player.collection = player_collection = mongo_client.collection('players');



// create player

exports.Player.create = player_create = function (err, obj, cb) {


  // create a unique id
  create_unique_id(err, obj, function (err, id) {
    obj.id = id;
    
    // create the object in the collection
    Player.collection.insert(obj, function (err) {
      
      // find the created object in the collection
      Player.collection.findOne({ id: obj.id }, function(err, player) {  
        cb(err, player);
      });

    });
  
  });
  
}


// drop player
// deletes a player from the model (as in "logs out", not deleted from the database)

exports.Player.drop = player_drop = function (err, id, cb) {

  //remove the object from the collection
  Player.collection.remove({id: id}, function (err) {
    cb(err);    
  });

}


// get player
// some players have to get got

exports.Player.get = player_get = function (err, id, cb) {
  
  // find the object in the collection
  Player.collection.findOne({id: id}, function (err, player) {
   cb(err, player); 
  });
 

}


// get my player
// requires a request object
// TODO: handle user that is not logged in

exports.Player.get_myself = player_get_myself = function (err, req, cb) {

  // session is active
  if (typeof req.session !== 'undefined' && typeof req.session.player_id !== 'undefined') {
    
    Player.get(err, req.session.player_id, function(err, player) {
      cb(err, player);
    });

  } else {
      cb(err, undefined);
  }

  
  /*
  //console.log(util.inspect(req.session));
  if (typeof req.session !== 'undefined' && typeof req.session.user_id !== 'undefined') {
    // get the user from the database
    user_get_from_db({ service: req.session.service, screen_id: req.session.screen_id }, function (err, dbUser) {
      // get the player
      //player_get(err, dbUser.id, function (err, player) {
      Player.collection.findOne({ service: req.session.service, screen_id: req.session.screen_id  }, function(err, player) {
        cb(err, player);
      });
    });
  } else {
      cb(err, undefined);
  }
  */

}

// list players

exports.Player.list = player_list = function (err, query, cb) {

  Player.collection.find(query).sort({ name: 1 }).toArray(function (err, players) {
    cb(err, players);
  });

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
  //1: { id: 1, name: 'Main Stage', battle_id: null, player_queue: [] }
};

// constructor
var Room = exports.Room = function () {

}

// room mongo collection
exports.Room.collection = room_collection = mongo_client.collection('rooms');



// create room

exports.Room.create = room_create = function (err, obj, cb) {
  
  // create a unique id
  create_unique_id(err, obj, function (err, id) {
    obj.id = id;
    
    // create the object in the collection
    Room.collection.insert(obj, function (err) {
      
      // find the created object in the collection
      Room.collection.findOne({ id: obj.id }, function(err, room) {  
        cb(err, room);
      });

    });
  
  });
  
}


// drop room

exports.Room.drop = room_drop = function (err, id, cb) {
  
  //remove the object from the collection
  Room.collection.remove({id: id}, function (err) {
    cb(err);    
  });

}


// enter room
// requires a request obj and that the player be logged in

exports.Room.enter = room_enter = function (err, room, req, cb) {
 
  // store what room the player is in
  Player.collection.findAndModify( {
        query: {id: req.session.player_id},
        update : { "$set": { room_id: room.id } },
        'new': false
      },
      // callback
      function (err) {
        
        room.players.push(req.session.player_id);
        
        // make sure the players in this list are unique
        get_unique_array(err, room.players, function (err, unique_players) {
         
          // update the room
          Room.collection.findAndModify( {
            query: {id: room.id},
            update : { "$set": { players: unique_players } },
              'new': false
            },
            // callback
            function (err) {
              cb(err, room, req);
            }
             
          );

        });
    }
      
  );

}


// enter_queue
// requires a request obj, that the player be logged in, and that the player be in a room

exports.Room.enter_queue = room_enter_queue = function (err, req, cb) {
 
  // store what room the player is in
  Player.collection.findAndModify( {
        query: {id: req.session.player_id},
        update : { "$set": { is_in_queue: true } },
        'new': false
      },
      function (err) {
        cb(err, room, req);
      }
  );

}


// get room

exports.Room.get = room_get = function (err, id, cb) {
  
  // find the object in the collection
  Room.collection.findOne({id: id}, function (err, room) {
   cb(err, room); 
  });
  
}


// get my room
// requires a request obj and that the player be logged in

exports.Room.get_myroom = room_get_myroom = function (err, req, cb) {
  
  player_get_myself(err, req, function (err, player) {
    room_get(err, player.room_id, function (err, room) {
      cb(err, room);
    });
  });

}


// leave room
// requires a request obj and that the player be logged in

exports.Room.leave = room_enter = function (err, room, req, cb) {
 
  // store this in the player
  Player.collection.findAndModify( {
        query: {id: req.session.player_id},
        update : { "$set": { room_id: null } },
        'new': false
      },
      // callback
      function (err) {
        
        room.players.splice(room.players.indexOf(req.session.player_id), 1);

        // update the room
        Room.collection.findAndModify( {
          query: {id: room.id},
          update : { "$set": { players: room.players } },
            'new': false
          },
          // callback
          function (err) {
            cb(err, room, req);
          }
           
        );
    }
      
  );



}


// list rooms

exports.Room.list = player_list = function (err, query, cb) {
  
  Room.collection.find(query).sort({ name: 1 }).toArray(function (err, rooms) {
    cb(err, rooms);    
  });

}




// Songs
// ============================================================================

// for now this is hard-coded (does not use mongodb for storage)

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

// song mongo collection
exports.Song.collection = song_collection = mongo_client.collection('songs');


// create song

exports.Song.create = song_create = function (err, obj, cb) {
  
  // generate an id
  obj.id = get_next_id(Songs);
  
  // persist
  Songs[obj.id] = obj;
  
  cb(err, Songs[obj.id]);
  
}


// drop song

exports.Song.drop = song_drop = function (err, id, cb) {

  //remove the object from the collection
  Song.collection.remove({id: id}, function (err) {
    cb(err);    
  });

}


// get song

exports.Song.get = song_get = function (err, id, cb) {
 
  // find the object in the collection
  Song.collection.findOne({id: id}, function (err, song) {
   cb(err, song); 
  });

}


// list songs

exports.Song.list = song_list = function (err, query, cb) {
  
  // this is where implementation of the query would occur 
  get_sorted_array_from_hash(err, Songs, function (err, songs) {
    cb(err, songs);
  }); 
  
}


// UTILITY METHODS
// ============================================================================


// create a random id for URIs

exports.create_random_id = create_random_id = function (err, id_length, cb) {
  
  // default length is 8 characters
  if (typeof length == 'undefined') {
    length = 8;
  }
  
  var id = "";
  var possibles = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (var i=0; i < id_length; i++ ) {
    id += possibles.charAt(Math.floor(Math.random() * possibles.length));
  }

  cb(err, id);

}


// create a unique id for URIs
// uses the name, but reverts to random id if it won't work

exports.create_unique_id = create_unique_id = function (err, obj, cb) {
  
  // name not even defined
  if (typeof obj.name === 'undefined') {
    create_random_id(err, 8, function (err, id) { cb(err, id); });

  } else {
    
    // too short
    if (obj.name.length <= 4) {
      create_random_id(err, 8, function (err, id) { cb(err, id); });
    
    // urlize the name
    } else {
      id = obj.name.replace(/[\W]/g,'_').toLowerCase();
      cb(err, id);
      
    }
  
  }

}


// get the next id in a hash with numbered keys

exports.get_next_id = get_next_id = function (hash) {
  if (hash[1] == undefined) {
    return 1;
  } 
  
  var arr = Object.keys(hash);
  max_value = Math.max.apply( Math, arr );
  return max_value + 1;

}


// convert a hash to a sorted array

exports.get_sorted_array_from_hash = get_sorted_array_from_hash = function (err, hash, cb) {
  var arr = [];
  
  // sort function
  function sort_numbers(a,b) {
    return a - b;
  }
  
  keys = Object.keys(hash).sort(sort_numbers);
  
  for (var i = 0; i < keys.length; i++) {
    arr.push(hash[keys[i]]);
  }
  
  cb(err, arr);

}

// convert an array to an array having unique elements

exports.get_unique_array = get_unique_array = function (err, arr, cb) {
  
  if (arr.length > 1) {
    
    unique_arr = [];
    var sorted_arr = arr.sort();
    for (var i = 0; i < arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        unique_arr.push(sorted_arr[i]);
      }
    }

    cb(err, unique_arr);
  
  } else { 
    cb(err, arr);

  }

}



