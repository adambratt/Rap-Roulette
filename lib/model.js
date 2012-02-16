
var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , ea = require('../node_modules/everyauth/index')
  , async = require('async')
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
  room_id: main_stage,
  name: 'January 2012 Final Match',
  song_id: 1,
  players: [1, 2],
  player: {
    1: { votes: 7, disses: 2 },
    2: { votes: 3, disses: 5 }
  },
  current_player_id: 22,
  current_state_id: 3,
  current_round: 0,
  rounds: [1, 2, 3],

  // configurations
  create_rounds : true,
  number_of_rounds: 3,

};
*/


// constructor
var Battle = exports.Battle = function () {
  //this.node_states = {};
}

// battle mongo collection
exports.Battle.collection = battle_collection = mongo_client.collection('battles');

// node battle states
exports.Battle.states = battle_states = {};
// this is a temporary representation to reduce db interaction


// create battle
// NOTE: the callback returns both the battle and the round_data

exports.Battle.create = battle_create = function (err, obj, cb) {
  model_log({warn: {origin: 'Battle.create', message: 'called'}});

  // should rounds be created?
  var config_create_rounds = (typeof  obj.create_rounds !== 'undefined') ? obj.create_rounds : true;
  delete obj['create_rounds'];
  
  // how many rounds should be created?
  var config_number_of_rounds = (typeof obj.number_of_rounds !== 'undefined') ? obj.number_of_rounds : 3;
  delete obj['number_of_rounds'];
  
  obj.players = [];
  obj.player = {};

  var prev_battle;
  var previous_winner_position = null;
  var previous_loser_position = null;
  
  // perform the work of creating the battle
  // https://github.com/caolan/async#waterfall
  
  async.waterfall([
    
    // STEP: winning player selection
    function (nextcb) {
      model_log({warn: {origin: 'Battle.create', message: 'select the winning player'}});
      
      // there was a previous battle
      if (obj.previous_battle_id) {
        Battle.collection.findOne({ id: obj.previous_battle_id }, function(err, fetched_prev_battle) { 
          prev_battle=fetched_prev_battle;
          
          // winning!
          if (typeof prev_battle.winning_player_id !== 'undefined') {
              model_log({warn: {origin: 'Battle.create', message: 'previous winner: ' + prev_battle.winning_player_id}});
              //console.log(util.inspect(prev_battle.players));

              // determine the previous winning position
              if (prev_battle.players[0] == prev_battle.winning_player_id) {
                previous_winner_position = 0;
                previous_loser_position = 1;
                
              } else if (prev_battle.players[1] == prev_battle.winning_player_id) {
                previous_winner_position = 1;  
                previous_loser_position = 0;  
              
              }
              
              // previous player is null, perfer to pull from the queue
              if (prev_battle.winning_player_id == null) {
                model_log({warn: {origin: 'Battle.create', message: 'the winning player was null (push from top of queue)'}});

                Room.pop_top_queue(null, obj.room_id, function (err, player_id) {
                  obj.players.push(player_id);
                  nextcb(null, true);
                });

              // previous player is valid
              } else {
                model_log({warn: {origin: 'Battle.create', message: 'there is a winning player'}});
                obj.players.push(prev_battle.winning_player_id);
                nextcb(null, true);

              }
          
          // wtf, no winning!
          } else {  
            Room.pop_top_queue(null, obj.room_id, function (err, player_id) {
              model_log({warn: {origin: 'Battle.create', message: 'there is no winning player (push from top of queue)'}});
              obj.players.push(player_id);
              nextcb(null, true);
            });
          }

        
        });

      } else {
        Room.pop_top_queue(null, obj.room_id, function (err, player_id) {
          model_log({warn: {origin: 'Battle.create', message: 'there is no previous battle (push from top of queue)'}}); 
          obj.players.push(player_id);
          nextcb(null, true);
        
        });
      }
      
    },


    // STEP winning player configuration
    function (isGreatSuccess, nextcb) {
        console.log(' winning player config for: ' + obj.players[0]);

        player_get(null, obj.players[0], function (err, playerData) {
          
          //console.log(util.inspect(playerData));
          
          if (typeof playerData !== 'undefined') {

            obj.player[obj.players[0]] = { 
              total_mad_props: 0, 
              name: playerData.name, 
              service_username: playerData.service_username, 
              service_link: playerData.service_link
            }; 

          } else {
            console.log('player n/a');
            obj.player[obj.players[0]] = { name: "N/A", total_mad_props: 0 };
          }
          
          nextcb(null, true);

      });


    },


    // STEP: competing player selection
    function (isGreatSuccess, nextcb) {
    
      Room.pop_top_queue(null, obj.room_id, function (err, player_id) {
        model_log({warn: {origin: 'Battle.create', message: 'challenger (pop from top of queue'}});
          
          // player at top of queue is null, just use the loser here
          model_log({warn: {origin: 'Battle.create', message: 'challenging player_id is ' + player_id}});

          if (typeof player_id === 'undefined' || player_id == null) {
            if (typeof prev_battle !== 'undefined') {
              model_log({warn: {origin: 'Battle.create', message: 'as there are no players in the queue, will try to get loser to challenge'}});
              player_id = prev_battle.players[previous_loser_position];
            }
          }
          
          if (previous_winner_position != null) {
            
            // the previous winner is in position 0: push challenger to end
            if (previous_winner_position == 0) {
              obj.players.push(player_id);
              model_log({warn: {origin: 'Battle.create', message: 'prev winner at 0; push competitor to end of players'}});
              
            // the previous winner is in position 1: unshift challenger to top
            } else if (previous_winner_position == 1) {
              obj.players.unshift(player_id);
              model_log({warn: {origin: 'Battle.create', message: 'prev winner at 1; unshift competitor to top of players'}});
              
            }
          } else {
            obj.players.push(player_id);
            model_log({warn: {origin: 'Battle.create', message: 'no prev winner; push competitor to end of players'}});

          }
       
        player_get(null, player_id, function (err, playerData) {
                
          //console.log(util.inspect(playerData));
          
          if (typeof playerData !== 'undefined') {
          
            obj.player[player_id] = { 
              total_mad_props: 0, 
              name: playerData.name, 
              service_username: playerData.service_username, 
              service_link: playerData.service_link
            }; 

          } else {
            model_log({warn: {origin: 'Battle.create', message: 'the competitor is N/A'}});
            obj.player[player_id] = { name: "N/A", total_mad_props: 0 };
          }
          
          nextcb(null, true);


        });

      
      });

    },


    // STEP: complete player configuration
    function (isGreatSuccess, nextcb) {
      model_log({warn: {origin: 'Battle.create', message: 'complete the player configuration'}});
      
      // set up the battle object's player data
      if (config_create_rounds) { 
        
        
      }
      
      nextcb(null, true);
    },
   

    // STEP: set up the battle
    function (isGreatSuccess, nexcb) {
      model_log({warn: {origin: 'Battle.create', message: 'set up battle with ' + util.inspect(obj.players)}});
      
      // set up the battle object's rounds
      if (config_create_rounds) { 
        obj.rounds = [];
      }

      // create a unique id
      create_random_id(err, 8, function (err, id) {
      //create_unique_id(err, obj, function (err, id) {
        obj.id = id;
        
        if (err) { 
          model_log({error: {origin: 'Battle.create create_random_id', message: err.code}});
          cb(err); 
          return; 
        }

        // create the object in the collection
        Battle.collection.insert(obj, function (err) {
          
          //console.log('Battle.collection.insert');
          //console.log(util.inspect(obj));
          if (err) { 
            model_log({error: {origin: 'Battle.create Battle.collection.insert', message: err.code}});
            cb(err); 
            return; 
          }          
          
          // update the room with the battle id
          Room.collection.findAndModify( {
            query: {id: obj.room_id},
            update : { "$set": { battle_id: obj.id } },
            'new': false
            }, function (err, room) {      
            
            // find the created object in the collection
            Battle.collection.findOne({ id: obj.id }, function(err, battle) {  
              if (err) { console.error('Battle.create error: ' . err.code); cb(err); return; }
              if (typeof battle === 'undefined') {
                model_log({error: {origin: 'Battle.create Battle.collection.findOne', message:'battle was not created'}});
                return;
              }
              //console.log(util.inspect(battle));
              
              // create rounds for this battle
              if (config_create_rounds) {
                
                // will be returned in the callback
                var round_data = {};
                
                // from the configuration: loop over the number of rounds in the battle
                for (var i=0; i < config_number_of_rounds; i++) {
                  //console.log('Battle.create creating round ' + i.toString()); 
                  
                  // data in a round
                  var newRound = {
                    battle_id: battle.id,
                    current_player_id: null,
                    player: {}, // hash containing player scores, with player_id as the key
                    winning_player_id: null
                  }; 
                  
                  // add in the players
                  if (typeof battle.players === 'undefined') {
                    model_log({error: {origin: 'Battle.create', message: 'battle.players is undefined'}});
                  }
                  for (var p=0; p < battle.players.length; p++) {
                    newRound.player[battle.players[p]] = { mad_props: 0 }; // the various feedback scores for a player in this round
                  }
                  
                  // create the round
                  round_create(null, newRound, function (err, round) {
                    //console.log(util.inspect);
                    if (err) { 
                      model_log({warn: {origin: 'Battle.create', message: err.code}});
                      cb(err); 
                      return; 
                    }
                    //console.log('created round ' + round.id);
                    
                    // push to the battle for callback (otherwise this will have to refetch
                    battle.rounds.push(round.id);
                    
                    round_data[round.id] = round;
                      
                      // make the callback once the rounds have all been created
                      if (battle.rounds.length == config_number_of_rounds) {
                        // battle callback
                        //console.log('The callback in model Battle.create is problematic.');
                        //console.log('There are multiple creates so it needs to be called using the async module.');
                        // http://stackoverflow.com/questions/5172244/idiomatic-way-to-wait-for-multiple-callbacks-in-node-js
                        cb(err, battle, round_data);
                      }

                  });
                }
              }
              
            });
                 
          });

        });
      
      });

    }

  ]);  

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


// update battle

exports.Battle.update = battle_update = function (err, obj, cb) {
  console.log('Battle.update');

  // should rounds be updates?
  var config_update_rounds = (typeof  obj.update_rounds !== 'undefined') ? obj.update_rounds : true;
  delete obj['update_rounds'];
  
  // move round data out of battle (they will be updated separately)
  if (config_update_rounds == true) {
    round_data = obj.round;
  }
  delete obj['round_data'];
 
  // delete other parts not needing to be stored
  delete obj['script'];
  delete obj['current_state_id'];

  //console.log(util.inspect(obj));
  //console.log(util.inspect(rounds));

  // update the battle
  Battle.collection.findAndModify( {
      query: {id: obj.id},
      update : { "$set": obj },
        'new': false
    },
    // callback
    function (err, battle) {
      
      //console.log(util.inspect(battle));
      
      // update rounds
      if (config_update_rounds == true) {
        var rounds_updated = 0;
        var round_id;

        // loop over the number of rounds in the battle
        for (var i=0; i < obj.rounds.length; i++) { 
          round_id = obj.rounds[i];
          
          // update the round
          round_update(null, round_data[round_id], function (err, isGreatSuccess) { 
            
            // only call the callback on the final update
            rounds_updated++;
            if (rounds_updated == obj.rounds.length) {
              cb(err, true);
            }
              
          });
        }    
        
      // no need to update rounds
      } else {
        cb(err, true); 
      }

    }
  );
}




// Rounds
// ============================================================================

/*
var example_round = {
  id: 1,
  battle_id: 1,
  current_player_id: 22,
  player: {
    1: {mad_props: 12},
    2: {mad_props: 27}
  },
  winning_player: 2
};
*/

// constructor
var Round = exports.Round = function () {
}

// round mongo collection
exports.Round.collection = battle_collection = mongo_client.collection('rounds');


// create round

exports.Round.create = round_create = function (err, obj, cb) {

  // create a unique id
  create_random_id(err, 8, function (err, id) {
  //create_unique_id(err, obj, function (err, id) {
    obj.id = id;
    //console.log('round id: ' + obj.id);

    // create the object in the collection
    Round.collection.insert(obj, function (err) {
      
      // update the battle with the round id
      Battle.collection.findAndModify( {
        query: {id: obj.battle_id},
        update : { "$push": { rounds: obj.id } },
        'new': false
        }, function (err, round) {      
        
        // find the created object in the collection
        Round.collection.findOne({ id: obj.id }, function(err, round) {  
          cb(err, round);
        });
        
      });
  

    });
  
  });

}


// update round

exports.Round.update = round_update = function (err, obj, cb) {
  console.log('Round.update');

  //console.log(util.inspect(obj));

  // update the battle
  Round.collection.findAndModify( {
      query: {id: obj.id},
      update : { "$set": obj },
        'new': false
    },
    // callback
    function (err, round) {
      //console.log('updated round_id ' + round.id); 
      cb(err, true);
    
    }
  );

}


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

// temporary player passcodes
exports.Player.passcodes = player_passcodes = {
  'rr': 'Temporary guessable password.'
};


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
// requires a player_id
// TODO: handle user that is not logged in

exports.Player.get_myself = player_get_myself = function (err, id, cb) {

  if (typeof id !== 'undefined') {
    
    Player.get(err, id, function(err, player) {
      cb(err, player);
    });

  } else {
      cb(err, undefined);
  }

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

// constructor
var Room = exports.Room = function () {

}

// room mongo collection
exports.Room.collection = room_collection = mongo_client.collection('rooms');

// node room data
exports.Room.battle_clocks = room_battle_clocks = {};
exports.Room.battle_states = room_battle_states = {};
// use the room_id to fetch the current battle clock or state for that room


// create room

exports.Room.create = room_create = function (err, obj, cb) {
  
  //console.log(util.inspect(obj));
   
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
// requires a room and a player id

exports.Room.enter = room_enter = function (err, room, player_id, cb) {
 
  // store what room the player is in
  Player.collection.findAndModify( {
        query: {id: player_id},
        update : { "$set": { room_id: room.id } },
        'new': false
      },
      // callback
      function (err) {
        
        room.players.push(player_id);
        
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
              cb(err, room, player_id);
            }
             
          );

        });
    }
      
  );

}


// enter_queue
// requires a player_id, and that the player be in a room

exports.Room.enter_queue = room_enter_queue = function (err, player_id, cb) {
  console.log('Room.enter_queue ' + player_id); 
  
  // store that the player is in queue
  Player.collection.findAndModify( {
        query: {id: player_id},
        update : { "$set": { is_in_queue: true } },
        'new': false
      },
      function (err, player) {
        
        // get the room that the player is currently in 
        Room.get(err, player.room_id, function (err, my_room) {
          //console.log(' player will enter queue on ' + my_room.id); 
        
          my_room.player_queue.push(player_id);
          
          // make sure the player queues in this list are unique
          get_unique_array(err, my_room.player_queue, function (err, unique_players) {
            
            //console.log(util.inspect(unique_players));

            // update the room
            Room.collection.findAndModify( {
              query: {id: my_room.id},
              update : { "$set": { player_queue: unique_players } },
                'new': false
              },
              // callback
              function (err) {
                cb(err, my_room, player_id);
              }
               
            );

          });

        });

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
// requires a player_id

exports.Room.get_myroom = room_get_myroom = function (err, player_id, cb) {
  
  player_get_myself(err, player_id, function (err, player) {
    room_get(err, player.room_id, function (err, room) {
      cb(err, room);
    });
  });

}

// get queue names

exports.Room.get_queue_names = room_get_queue_names = function (err, room_id, cb) {

  Room.get(null, room_id, function (err, room) {
    //console.log(util.inspect(room.player_queue)); 
   
    var query = { '$or': [] };
    var fields = { id: 1, name: 1 } ;

    // form the query
    for (var i=0; i<room.player_queue.length; i++) {
      query['$or'].push({ id: room.player_queue[i] });
    }
    
    Player.collection.find(query, fields).toArray(function (err, players) {
      
      var players_by_id = {};
      var player_names = [];
      
      // prepare the hash 
      for (var i=0; i < room.player_queue.length; i++) {
        players_by_id[players[i].id] = players[i].name;
      }
      
      // order the names in the queue order
      for (var i=0; i < room.player_queue.length; i++) {
        //player_names.push(room.player_queue[i]);
        player_names.push(players[i].name);
      } 
      
      // it is about now when I plea for a relational database
      
      cb(err, player_names);

    });
     
  });

}


// leave room
// requires a room and a player id

exports.Room.leave = room_leave = function (err, room, player_id, cb) {
 
  // store this in the player
  Player.collection.findAndModify( {
        query: {id: player_id},
        update : { "$set": { room_id: null, is_in_queue: false } },
        'new': false
      },
      // callback
      function (err) {
        
        room.players.splice(room.players.indexOf(player_id), 1);

        // update the room
        Room.collection.findAndModify( {
          query: {id: room.id},
          update : { "$set": { players: room.players } },
            'new': false
          },
          // callback
          function (err) {
            cb(err, room, player_id);
          }
           
        );
    }
      
  );

}


// leave_queue
// requires a player_id, and that the player be in a room

exports.Room.leave_queue = room_leave_queue = function (err, player_id, cb) {
   
  // store what room the player is in
  Player.collection.findAndModify( {
        query: {id: player_id},
        update : { "$set": { is_in_queue: false } },
        'new': false
      },
      function (err, player) {
        
        // get the room that the player is currently in 
        Room.get(err, player.room_id, function (err, my_room) {
          
          my_room.player_queue.splice(my_room.player_queue.indexOf(player_id), 1);
          
          // update the room
          Room.collection.findAndModify( {
            query: {id: my_room.id},
            update : { "$set": { player_queue: my_room.player_queue } },
              'new': false
            },
            // callback
            function (err) {
              cb(err, my_room, player_id);
            }
             
          );

        });

      }
  );

}


// list rooms

exports.Room.list = player_list = function (err, query, cb) {
  
  Room.collection.find(query).sort({ name: 1 }).toArray(function (err, rooms) {
    cb(err, rooms);    
  });

}


// pop_top_queue
// Remove the top player from the queue

exports.Room.pop_top_queue = room_pop_top_queue = function (err, room_id, cb) {

  // find the object in the collection
  room_get(null, room_id, function (err, room) {
    if (room.player_queue.length > 0) {
      var player_id = room.player_queue.shift(); // shift is javascript's pop
      
      Room.collection.findAndModify( {
        query: {id: room.id},
        update : { "$set": { player_queue: room.player_queue } },
          'new': false
        },
        // callback
        function (err) {
          cb(err, player_id);
        }
      );      
    
      
    } else {
      cb(err, null); 
    }
    
  });

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
//var Songs = {
//  1: {id: 1, name: 'Lemonade', artist: 'Gucci Mane', file_url: 'audio/lemonade.mp3' }
//};

// constructor
var Song = exports.Song = function () {

}

// song mongo collection
exports.Song.collection = song_collection = mongo_client.collection('songs');


// create song

exports.Song.create = song_create = function (err, obj, cb) {
  
  //console.log(util.inspect(obj));
   
  // create a unique id
  create_unique_id(err, obj, function (err, id) {
    obj.id = id;
    
    // create the object in the collection
    Song.collection.insert(obj, function (err) {
      
      // find the created object in the collection
      Song.collection.findOne({ id: obj.id }, function(err, song) {  
        cb(err, song);
      });

    });
  
  });
  
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
  
  Song.collection.find(query).sort({ name: 1 }).toArray(function (err, songs) {
    cb(err, songs);    
  });

}


// Sessions
// ============================================================================
// direct access to the mongo session store

/*
var example_session = {
  "lastAccess":1328913293447,
  "cookie":{
    "originalMaxAge":14399998,
    "expires":"2012-02-11T02:34:53.445Z",
    "httpOnly":true,
    "path":"/"
  },
  "room_id":"main_stage"
  "enter_queue_after_login":true
};
*/


// constructor
var Session = exports.Session = function () {

}

// song mongo collection
exports.Session.collection = session_collection = mongo_client.collection('sessions');

// get session
// this is from the session store

exports.Session.get = session_get = function (err, sid, cb) {
  
  Session.collection.findOne({ _id: sid }, function(err, session_record) {

    // session is stored as unthawed json in mongodb
    session = JSON.parse(session_record.session);
    //console.log(util.inspect(session));
    
    cb(err, session);
    
  });
}


// Sockets
// ============================================================================
// used to track sockets by session id


// constructor
var Socket = exports.Socket = function () {

}

// persistent sockets

exports.Socket.sessions = socket_sessions = {};
exports.Socket.players = socket_players = {};



// UTILITY METHODS
// ============================================================================


// create a random id for URIs

exports.create_random_id = create_random_id = function (err, id_length, cb) {
  
  // default length is 8 characters
  if (typeof id_length === 'undefined') {
    id_length = 8;
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
    //console.log('get_unique_array for ' + util.inspect(arr));
    
    /*
    unique_arr = [];
    var sorted_arr = arr.sort();
    for (var i = 0; i < arr.length; i++) {
      if (sorted_arr[i + 1] != sorted_arr[i]) {
        unique_arr.push(sorted_arr[i]);
      }
    }
    */
    
    //console.log('get_unique_array for ' + util.inspect(arr));
    
    var uniques = {};
    var unique_arr = [];
    for (var i=0; i < arr.length; i++) {
      if (!uniques[arr[i]]) {
        //console.log('add to array ' + arr[i]);
        unique_arr.push(arr[i]);
        uniques[arr[i]] = true;
      }
    }
    //console.log(' final: ' + util.inspect(unique_arr));
    
    cb(err, unique_arr);
  
  } else { 
    cb(err, arr);

  }

}

exports.log = model_log = function (message) {
  // message format (used for server XHR / AJAX as well): 
  // { warn:    { message: 'Any message',         origin: 'class, method, etc.'}
  // { success: { message: 'Successful message',  origin: 'class, method, etc.'}
  // { error:   { message: 'Error message',       origin: 'class, method, etc.'}

  //console.log(util.inspect(message));  
  
  var origin = 'model: ';
 
  // log error
  if (typeof message.error !== 'undefined') {
    origin += (typeof message.error.origin !== 'undefined') ? message.error.origin : '';
    console.log(origin + ' ERROR: ' + message.error.message);
  } 

  // log successe
  if (typeof message.success !== 'undefined') { 
    origin += (typeof message.success.origin !== 'undefined') ? message.success.origin : '';
    console.log(origin + ' SUCCESS: ' + message.success.message);
  }
  
  // log warn
  if (typeof message.warn !== 'undefined') {
    origin += (typeof message.warn.origin !== 'undefined') ? message.warn.origin : '';
    console.log(origin + ': ' + message.warn.message);
  }

}


