

/**
 * Module dependencies.
 */

var express = require('express')
  , ejs = require('ejs')
  , ea = require('everyauth')
  //, MemoryStore = require('./node_modules/express/node_modules/connect/lib/middleware/session/memory')
  , mongo_store = require('connect-mongo')

  // our libraries
  , cfg = require('./config').Config
  , auth = require('./lib/auth')
  , model = require('./lib/model')

  // our routes (mapped to URIs)
  , routes = require('./routes')
  , user = require('./routes/user')
  , room = require('./routes/room')
  , battle = require('./routes/battle')
  , player = require('./routes/player')
  , admin = require('./routes/admin')
  ;
;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser()); 
    app.use(express.session({
    secret: cfg.cookie_secret,
    store: new mongo_store(cfg.mongodb)
  }));
  // older ways implementing persistent sessions
  //app.use(express.session({ secret: 'htuayreve'})); 
  /*app.use(
	express.session({
	  store: new MemoryStore({ reapInterval: 60000 * 10  }),
	  secret: "asfasdfsad"
	  })
  })*/
  /*app.use(express.session({
	store: new MySQLSessionStore("rap", "rapuser", "rappass", { port: 8889  }),
	secret: "htuayreve"
  }))*/
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(ea.middleware());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


// routes
app.get('/', routes.index);

// rooms
app.get('/room', room.index);
app.get('/room/list', room.list);
app.get('/room/create', room.create);
app.get('/room/myroom', room.myroom);
app.get('/rooms/:id', room.view);
app.get('/rooms/:id/enter', room.enter);
app.get('/rooms/:id/leave', room.leave);
app.get('/rooms/:id/drop', room.drop);      // should not expose this except to admins

// battles
app.get('/battle', battle.index);
app.get('/battle/list', battle.list);
app.get('/battle/create', battle.create);
app.get('/battle/mybattle', player.mybattle);
app.get('/battles/:id', battle.view);
app.get('/battles/:id/drop', battle.drop);  // should not expose this except to admins 
app.get('/battles/:id/song', battle.song);

// players
app.get('/player', player.index);
app.get('/player/list', player.list);
app.get('/player/logout', player.logout);
app.get('/player/create', player.create);
app.get('/player/myself', player.myself);
app.get('/players/:id', player.view);

// users (some are for testing only)
app.get('/user', user.index);
app.get('/user/session', user.session);
app.get('/user/myself', player.myself);

// admin screens
app.get('/admin/testboard', admin.testboard);


var port = process.env.NODE_PORT || 3000;
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
