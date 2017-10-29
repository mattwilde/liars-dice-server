// app.js
require('dotenv').config();
var express = require('express');
var path = require('path');
var app = module.exports = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var port = 4200;
var cors = require('cors');
const passport = require('passport');
const http = require("http");
const socketIo = require("socket.io");

// view engine setup
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'jade');

// connect to the database and load models
require('./src/models').connect(`mongodb://${process.env.LIARS_DICE_DB_AUTH}@clusterliarsdice-shard-00-00-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-01-8n69i.mongodb.net:27017,clusterliarsdice-shard-00-02-8n69i.mongodb.net:27017/${process.env.LIARS_DICE_DB_NAME}?ssl=true&replicaSet=ClusterLiarsDice-shard-0&authSource=admin`);

// pass the passport middleware
app.use(passport.initialize());

// load passport strategies
const localSignupStrategy = require('./src/passport/local-signup');
const localLoginStrategy = require('./src/passport/local-login');
passport.use('local-signup', localSignupStrategy);
passport.use('local-login', localLoginStrategy);

// Use middlewares to set view engine and post json data to the server
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// pass the authenticaion checker middleware
const authCheckMiddleware = require('./src/middleware/auth-check');
app.use('/api', authCheckMiddleware);

// routes
var index = require('./src/routes/index');
var users = require('./src/routes/users');
var auth = require('./src/routes/auth');
var api = require('./src/routes/api');
// var db = require('./src/routes/db');
var matchmakingQueuedUsers = require('./src/routes/db/matchmaking-queued-users');

app.use('/', index);
app.use('/users', users);
app.use('/auth', auth);
app.use('/api', api);
// app.use('/db', db);
app.use('/db/matchmaking_queued_users', matchmakingQueuedUsers);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Start the server
var server = app.listen(process.env.PORT || port, function(){
  console.log('Server is running on Port: ', process.env.PORT || port);
});

// socket.io for communicating with clients
// const server = http.createServer(app);
const io = socketIo(server);//.listen(server);

let interval;
io.on("connection", socket => {
  console.log("New client connected");
  app.set('socket', socket); // expose socket to be available in other modules through the app export.

  if (interval) {
    clearInterval(interval);
  }
  // interval = setInterval(() => getApiAndEmit(socket), 10000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const getApiAndEmit = async socket => {
  try {
    // const res = await axios.get(
    //   "https://api.darksky.net/forecast/PUT_YOUR_API_KEY_HERE/43.7695,11.2558"
    // ); // Getting the data from DarkSky
    socket.emit("found-match", 'hi'); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};

