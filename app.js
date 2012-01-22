
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , battle = require('./routes/battle')
  , player = require('./routes/player')
  , auth = require('./lib/auth')
  , ejs = require('ejs')
  , ea = require('everyauth')
  , MemoryStore = require('./node_modules/express/node_modules/connect/lib/middleware/session/memory');
  //, MySQLSessionStore = require('connect-mysql-session')(express);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser()); 
  //app.use(express.session({ secret: 'htuayreve'})); 
  app.use(
	express.session({
	  store: new MemoryStore({ reapInterval: 60000 * 10  }),
	  secret: "asfasdfsad"
	})
  );
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


// Routes
app.get('/', routes.index);
app.get('/user', user.index);
app.get('/user/session', user.session);
app.get('/user/logout', user.logout);

// battles
app.get('/battles', battle.index);
app.get('/battles/list', battle.list);
app.get('/battles/create', battle.create);
app.get('/battle/:id', battle.view);

// players
app.get('/players', player.index);
app.get('/players/list', player.list);
app.get('/players/create', player.create);
app.get('/players/myself', player.myself);
app.get('/player/:id', player.view);


var port = process.env.NODE_PORT || 3000;
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
