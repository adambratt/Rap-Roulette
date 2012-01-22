
var mysql = require('mysql')
	, client = mysql.createClient({
        database: 'rap',
        user: 'rapuser',
        password: 'rappass',
		})
	, ea = require('../node_modules/everyauth/index')
	, util = require('util');



// Battles
// ============================================================================

// persistent battles
var Battles = {};

// constructor
var Battle = exports.Battle = function () {

}

// create battle

exports.Battle.create = battle_create = function (err, obj, cb) {
	
	// generate an id
	obj.id = get_next_id(Battles);
	
	Battles[obj.id] = obj;
	return Battles[obj.id];
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

// persistent players
var Players = {};

// constructor
var Player = exports.Player = function () {

}

// create player

exports.Player.create = player_create = function (err, obj, cb) {

	// generate an id
	obj.id = get_next_id(Players);
	
	Players[obj.id] = obj;
	return Players[obj.id];

}

// get player
// some players have to get got

exports.Player.get = player_get = function (err, id, cb) {
	return Players[id];
}

// list players

exports.Player.list = player_list = function (err, query, cb) {
	return Players;
}



// Rooms
// ============================================================================

// persistent rooms
var Rooms = {};

// constructor
var Room = exports.Room = function () {

}

// create room

exports.Room.create = room_create = function (err, obj, cb) {
	Roomss[obj.id] = obj;
	return Roomss[obj.id];
}



// Songs
// ============================================================================

// persistent songs
var Songs = {};

// constructor
var Song = exports.Song = function () {

}

// create song

exports.Song.create = song_create = function (err, obj, cb) {
	Songs[obj.id] = obj;
	return Songs[obj.id];
}


// Users
// ============================================================================


// persistent users
var Users = {};

var User = exports.User = function () {

}

// create
// creates a user in the db and in the app
// callsback with the created user from the app

exports.User.create_in_db = user_create_in_db = function (err, obj, cb) {
	
		client.query("INSERT INTO users (service, screen_name, screen_id) VALUES (?, ?, ?)",  
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


// get from datastore

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

exports.get_next_id = get_next_id = function (hash) {
	if (hash[1] ==undefined) {
		return 1;
	}	
	
	var arr = Object.keys(hash);
	max_value = Math.max.apply( Math, arr );
	return max_value + 1;
}

