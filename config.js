
// dev configuration

var development = {
  appAddress : 'raproulette.fm',
  cookie_secret: '4u26cu8e743u8c21n',
  mongodb: {
    db: 'rap'
  },
  /* mysql config */
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
  cookie_secret: 'hg2548ewsfcfyslce',
  mongodb: {
    db: 'rap'
  },
  /* mysql config */
  db: {
    database: 'rap',
	  user: 'rapuser',
	  password: 'rappass',
	  port: 3306,
  },
  
  env : global.process.env.NODE_ENV || 'development'
};

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;

