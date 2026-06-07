import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { prisma } from './database';

/**
 * Configure Google OAuth 2.0 strategy for Passport.js.
 *
 * Flow:
 * 1. User clicks "Login with Google" → redirected to Google's consent screen
 * 2. User approves → Google redirects back to our callback URL
 * 3. Google sends us the user's profile (name, email, avatar, googleId)
 * 4. We find or create the user in our database
 * 5. We pass the user to Passport's done() callback
 *
 * Note: We're using JWT for session management (not Passport sessions),
 * so serialize/deserialize are minimal — we just pass the user ID through.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done
    ) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value ?? null;

        if (!email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Upsert: Find existing user by googleId, or create a new one
        const user = await prisma.user.upsert({
          where: { googleId },
          update: {
            name,
            avatar,
            // Don't update email — it shouldn't change, and if it does,
            // we'd need a verification flow
          },
          create: {
            googleId,
            email,
            name,
            avatar,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize: What gets stored in the session (just the user ID)
// We use JWT so these are minimal, but Passport requires them
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id);
});

// Deserialize: Look up full user from the stored ID
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
