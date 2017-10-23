var express = require('express');
var router = express.Router();

// Require Item model in our routes module
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find(function (err, itms){
    if(err){
      console.log(err);
    }
    else {
      res.json(itms.map((x, index) => { return { index: index, id:x._id, name:x.name, email:x.email }}));
    }
  });
});

module.exports = router;