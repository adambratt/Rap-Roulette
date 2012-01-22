
// dev configuration

var development = {
  appAddress : 'raproulette.fm',
  db: {
    database: 'rap',
	user: 'rapuser',
	password: 'rappass',
	port: 8889,
  },
  env : global.process.env.NODE_ENV || 'development'
};


// production configuration

var production = {
  appAddress : 'raproulette.fm',
  db: {
    database: 'rap',
	user: 'rapuser',
	password: 'rappass',
	port: 3306,
  },
  env : global.process.env.NODE_ENV || 'development'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;

