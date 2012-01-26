var model = require('../lib/model')
  , util = require('util')
;

// testboard
// returns a page containing useful REST links for developers


exports.testboard = function(req, res){

  res.render('admin/testboard', { title: 'Developer Test Board' })

};
