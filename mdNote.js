/**
 * Module dependencies.
 */

var express = require('express'),
  expressValidator = require('express-validator'),
  routes = require('./routes'),
  config = require('./config.json'),
  http = require('http'),
  path = require('path'),

  passport = require('passport'),
  EvernoteStrategy = require('passport-evernote').Strategy;

var EVERNOTE_CONSUMER_KEY = config.consumerKey,
  EVERNOTE_CONSUMER_SECRET = config.consumerSecret,
  app = express();

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// all environments
app.set('port', process.env.PORT || 5000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(expressValidator);
app.use(express.session({
  secret: 'keyboard cat'
}));
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
  callbackURL: "/auth/evernote/callback"
}, function(token, tokenSecret, profile, done) {

  process.nextTick(function() {
    profile.token = token;
    return done(null, profile);
  });

}));

app.get('/auth/evernote', passport.authenticate('evernote'));
app.get('/auth/evernote/callback', passport.authenticate('evernote', {
  failureRedirect: '/login'
}), function(req, res) {
  res.redirect('/');
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});
app.post('/saveNote', routes.validateSave, routes.save);
app.get('/', routes.index);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});