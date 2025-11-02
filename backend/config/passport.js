import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User.js';

// Configure Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { googleId: profile.id },
        { email: profile.emails[0].value }
      ]
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    // Create new user
    user = new User({
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      phone: '', // Will need to be filled later
      role: 'user',
      isVerified: true, // Email is verified by Google
      avatar: profile.photos[0]?.value
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// Configure Facebook OAuth
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_CLIENT_ID || 'REPLACE_WITH_YOUR_FACEBOOK_APP_ID',
  clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'REPLACE_WITH_YOUR_FACEBOOK_APP_SECRET',
  callbackURL: "/api/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'email', 'photos']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      $or: [
        { facebookId: profile.id },
        { email: profile.emails?.[0]?.value }
      ]
    });

    if (user) {
      if (!user.facebookId) {
        user.facebookId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    user = new User({
      facebookId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      phone: '',
      role: 'user',
      isVerified: true,
      avatar: profile.photos?.[0]?.value
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// Configure LinkedIn OAuth
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID || 'REPLACE_WITH_YOUR_LINKEDIN_CLIENT_ID',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'REPLACE_WITH_YOUR_LINKEDIN_CLIENT_SECRET',
  callbackURL: "/api/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ 
      $or: [
        { linkedinId: profile.id },
        { email: profile.emails?.[0]?.value }
      ]
    });

    if (user) {
      if (!user.linkedinId) {
        user.linkedinId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    user = new User({
      linkedinId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      phone: '',
      role: 'user',
      isVerified: true,
      avatar: profile.photos?.[0]?.value
    });

    await user.save();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
}));

// Serialize/deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;