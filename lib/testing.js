var cfg = require('../config').Config
  , mongolian = require("mongolian")
  , mongo_client = (new mongolian).db(cfg.mongodb.db)
  , model = require('../lib/model')
  , Player = model.Player
  , Room = model.Room
  , faker = require('../node_modules/Faker')
  , util = require('util');


// testing framework and fixtures


// constructor
var Fixture = exports.Fixture = function () {

}

// load fixture

exports.Fixture.load = function (err, name, cb) {
  
  console.log('testing.Fixture.load ' + name);
  var fixture = fixtures[name];

  fixture.load(err, function (err, isGreatSuccess) {
    cb(isGreatSuccess);  
  });
  
}

// unload fixture

exports.Fixture.unload = function (err, name, cb) {
  
  console.log('testing.Fixture.unload ' + name);
  var fixture = fixtures[name];

  fixture.unload(err, function (err, isGreatSuccess) {
    cb(isGreatSuccess);  
  });

}

// fixtures
// definitions of fixtures with load and unload methods

exports.Fixture.player_collection = fixture_player_collection = mongo_client.collection('fixture_players');

exports.Fixture.fixtures = fixtures = {
  
  // many players and 10 in queue fixture

  many_players_and_queue: {
    descr: "100 players and 10 in queue",
    
    load: function (err, cb) {
      // start with many players
      fixtures['many_players'].load(err, function (err, isGreatSuccess) {
        
        // enter queue
        playerCount=0;
        fixture_player_collection.find().forEach(function (player) {
          playerCount++;
          if (playerCount > 9) { return; }
          //console.log('enter queue ' + player.id);
          
          Room.enter_queue(err, player.id, function (err) { 
            if (playerCount == 9) {
              cb(err);
            }
          });
        });

      });
    },
    
    unload: function (err, cb) {

      playerCount=0;

      // count players in queue
      Player.collection.find({ is_in_queue: true }).count(function (err, totalPlayers) {
        //console.log('leaving queue: ' + totalPlayers);
        
        // select players in queue
        Player.collection.find({ is_in_queue: true }).forEach(function (player) {
          playerCount++;

          // leave the queue
          Room.leave_queue(err, player.id, function (err) { 
            if (playerCount == totalPlayers) {

              // end with deleting many players
              fixtures['many_players'].unload(err, function (err, isGreatSuccess) {
                cb(err);
        
              });

            }
          });
        });

      });



    }
  },

  // many players fixture

  many_players: {
    
    descr: "100 players",

    load: function (err, cb) {
      var playerCount = 0;
      for (var i=0; i<100; i++) {
        
        var playerName = faker.Name.findName();
        var player = {
          name: playerName,
          screen_name: playerName,
          screen_id: faker.Helpers.randomNumber(),
          service: 'facebook',
          room_id: 'main_stage'
        };
        
        Player.create(null, player, function (err, player) {   
          fixture_player_collection.insert({id: player.id}, function (err) { 
            playerCount++;
            
            if (playerCount == 100) {
              cb(err, true);
            }

          });
        
        });
      }
    },

    unload: function (err, cb) {
      var playerCount = 0;
     
      fixture_player_collection.find().forEach(function (player) {
        Player.collection.remove({id: player.id}, function (err) {
          fixture_player_collection.remove({id: player.id}, function (err) {
            playerCount++;
              //if (playerCount == 100) {
              //  cb(err, true);
              //}
          });
        });
      }, function(err) {
        cb(err, true); 
      });

    },

  },
  
};
