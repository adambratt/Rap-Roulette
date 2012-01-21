
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , ejs = require('ejs')
  , ea = require('everyauth');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.cookieParser()); 
  app.use(express.session({ secret: 'htuayreve'}));
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

var port = process.env.NODE_PORT || 3000;
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
