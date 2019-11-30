'use strict';

var express = require('express');
var router = express.Router();
const mysql = require('mysql');
var config = require('../config');

const db = mysql.createPool({
    "host": config.db.host,
    "user": config.db.username,
    "port": config.db.port,
    "password": config.db.password,
    "database": config.db.database
});


router.get('/users', function (req, res) {
  db.getConnection(function (err, connection) {
    db.query('SELECT * FROM  register', function (error, results, fields) {
      if (error) throw error;
      res.send(results)
    });
  });
});


router.post('/datas', function(req,res){
  db.getConnection(function (err, connection) {
    connection.query("insert into register (name, email, password, username) values (" +
      db.escape(req.body.name) + "," +
      db.escape(req.body.email) + "," +
      db.escape(req.body.password) + ","+
      db.escape(req.body.username)+ ")", 
    function (error, results, fields) {
      if (error) throw error;
      res.send(results)
    });
  });
});

router.post('/login', function(req,res){
  db.getConnection(function (err, connection) {
    connection.query("select * from register where username=" + db.escape(req.body.username) + 'and password='+db.escape(req.body.password),
    function (error, results, fields) {
      if (error) throw error;
      res.send(results)
    })
  });
})

module.exports = router;