var model = require('../lib/model')
  , util = require('util')
;

// testboard
// returns a page containing useful REST links for developers


exports.testboard = function(req, res){

  console.log(util.inspect(req.session.user_id));

  if (typeof player === 'undefined') {
    console.log('1'); 
  } else {
    console.log('2'); 
  }
  res.render('admin/testboard', { title: 'Developer Test Board' })

};
