
var mysql = require('mysql')
	, client = mysql.createClient({
        database: 'rap',
        user: 'rapuser',
        password: 'rappass',
        port: 8889
		})
	, util = require('util');


// Users
// ============================================================================


// persistent users
var Users = {};

var User = exports.User = function () {

}

//create

exports.User.create = create = function (err, obj, cb) {
    
	client.query("INSERT INTO users (service, screen_name, screen_id) VALUES (?, ?, ?)",  
		[obj.service, obj.screen_name, obj.screen_id],
        function (err, results, fields) { 
            if (err) { 
                throw err; 
            } 

		user_get_from_db({ service: obj.service, screen_id: obj.screen_id }, function (err, user) {
			
			Users[user.id] = user;
			
			//console.log(util.inspect(results[0]));
			
			// callback
			cb(err, Users[user.id]);
		});

		
        } 
    );
	
}

// get from app

exports.User.get = user_get = function (id) {
	return Users[id];
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
			
			console.log(util.inspect(results[0]));
			
			// callback
			cb(err, results[0]);
				
			//console.log(fields);
			//client.end();
		}
	);

}

