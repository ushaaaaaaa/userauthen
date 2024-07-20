const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

// MongoDB connection URI 
const mongoURI = 'mongodb+srv://ushasri:Ushadhanya@cluster0.9qbypb2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
const client = new MongoClient(mongoURI);

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: '910373901914-vis3k9v9u8iuop7bficq0sdfbh44nmq4.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback'
},
function(accessToken, refreshToken, profile, done) {
  return done(null, profile);
}));

passport.use(new FacebookStrategy({
  clientID: '506871881782530',
  clientSecret: 'dda8c84c4ef2ae3280ad99e87a1cd5df',
  callbackURL: 'http://localhost:3000/auth/facebook/callback',
},
function(accessToken, refreshToken, profile, done) {
  // Here, you can create or find the user in your database
  // and associate the Google profile with the user
  // For simplicity, we'll just return the profile
  return done(null, profile);
}
));
// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || '414e640554f7d9e44871073b34b331958a911f99ecf4fe366c6189518c0197d2675c6f6598fdd3f41994e519df9ddd47fcda87e22e1c278a6a8dec78b551e83e',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Google authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/create_trip.html');
  });

app.get('/auth/facebook',
    passport.authenticate('facebook'));
  
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    function(req, res) {
      res.redirect('/create_trip.html');
    });

// Serve static files from the "public" directory
app.use(express.static(__dirname));

//default route
app.get("/", (req, res) => res.send("Express working"));

// Serve index_.html on the root route
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index_.html'));
});

// Login route
app.post('/index', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    await client.connect();
    const database = client.db('data');
    const collection = database.collection('users and passwords');
    const query = { username, password, role };
    const user = await collection.findOne(query);

    if (user) {
      const token = jwt.sign({ username, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid username, password, or role' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.close();
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  return next();
};

// Protected route (example)
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Route to check the stored token
app.get('/check-token', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    res.json({ token });
  } else {
    res.status(404).json({ error: 'Token not found' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('token');
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/index_.html');
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
