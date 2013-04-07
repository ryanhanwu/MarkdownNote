/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path');
var passport = require('passport'),
    EvernoteStrategy = require('passport-evernote').Strategy;

var EVERNOTE_CONSUMER_KEY = "flyworld-2852";
var EVERNOTE_CONSUMER_SECRET = "41ef7f788cbfe866";
var app = express();

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.session({ secret: 'keyboard cat' }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if('development' == app.get('env')) {
    app.use(express.errorHandler());
}
passport.use(new EvernoteStrategy({
    requestTokenURL: 'https://sandbox.evernote.com/oauth',
    accessTokenURL: 'https://sandbox.evernote.com/oauth',
    userAuthorizationURL: 'https://sandbox.evernote.com/OAuth.action',
    consumerKey: EVERNOTE_CONSUMER_KEY,
    consumerSecret: EVERNOTE_CONSUMER_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/evernote/callback"
  },
  function(token, tokenSecret, profile, done) {
    console.dir(arguments);
    process.nextTick(function () {
      
      // To keep the example simple, the user's Evernote profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Evernote account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
     
  }
));

// GET /auth/evernote
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Evernote authentication will involve redirecting
//   the user to evernote.com.  After authorization, Evernote will redirect the user
//   back to this application at /auth/evernote/callback
app.get('/auth/evernote',
  passport.authenticate('evernote'),
  function(req, res){
   
  });

app.get('/auth/evernote/callback', 
  passport.authenticate('evernote', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
app.get('/', routes.index);
app.get('/users', user.list);
// everyauth.helpExpress(app);
http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});