// client model (interacts with the server-side model using XHR)

// constructor
function Player() {

  // get myself
  this.get_myself = function (err, cb) {
  
    // http://api.jquery.com/jQuery.ajax/
    $.ajax({
      url: "/player/myself",
      context: document.body,
      success: function(player){
        cb(err, player);     
      }
    });

  }

  // get mysid
  this.get_mysid = function (err, cb) {
  
    // http://api.jquery.com/jQuery.ajax/
    $.ajax({
      url: "/player/mysid",
      context: document.body,
      dataType: 'json',
      success: function(sid){
        cb(err, sid);     
      }
    });

  }


}

