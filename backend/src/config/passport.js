import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../lib/prisma.js';
import { env } from './env.js';

// GoogleStrategy defines HOW to talk to Google's OAuth servers
// and what to do when Google sends back a user profile.
passport.use(
  new GoogleStrategy(
    {
      // These come from Google Cloud Console.
      // Google uses them to verify that requests are coming from YOUR application.
      clientID:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL:  env.GOOGLE_CALLBACK_URL,
    },

    // This is the "verify callback" — your code that runs after Google
    // successfully authenticates the user and sends back their profile.
    //
    // Parameters:
    //   accessToken  — Google's access token (we don't need this for our use case)
    //   refreshToken — for refreshing the access token (not needed)
    //   profile      — the user's Google profile data
    //   done         — a function you call to tell Passport what to do next
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Google provides an array of emails; take the first (primary) one
        const email = profile.emails[0].value;

        // Google's stable unique identifier for this account.
        // This never changes even if the user renames their account.
        // We use this as the primary key (id) in our Faculty and Admin tables.
        const googleId = profile.id;
        const name = profile.displayName;

        // ── Step 1: Check if this is the admin ───────────────────────────
        // We defined one specific email as admin in .env (ADMIN_EMAIL).
        // Only that email gets admin role.
        if (email === env.ADMIN_EMAIL) {
          // upsert = create if not exists, update if exists.
          // On first admin login: creates the admin row with the real Google ID,
          // replacing the "seed-placeholder" ID from seed.js.
          // On subsequent logins: just updates the name (in case they changed it).
          const admin = await prisma.admin.upsert({
            where:  { email },
            update: { id: googleId, name },
            create: { id: googleId, email, name },
          });

          // done(null, user) — null means no error, user is the payload
          // Passport puts this object into req.user
          return done(null, {
            id:    admin.id,
            email: admin.email,
            name:  admin.name,
            role:  'admin',
          });
        }

        // ── Step 2: Check if this is a valid faculty email ────────────────
        // Extract the domain part after @ (e.g. "college.edu" from "john@college.edu")
        const emailDomain = email.split('@')[1];

        if (emailDomain !== env.FACULTY_DOMAIN) {
          // This person's email is neither the admin email nor from the faculty domain.
          // Reject them — done(null, false) tells Passport authentication failed.
          // The message is passed to the failure redirect in the route.
          return done(null, false, {
            message: `Email domain "${emailDomain}" is not authorized`,
          });
        }

        // ── Step 3: Upsert the faculty record ────────────────────────────
        // First login: creates the faculty row. id is set to their Google sub ID.
        // Subsequent logins: updates the id (in case they were pre-created by admin
        // with a placeholder) and updates their name if they changed it.
        const faculty = await prisma.faculty.upsert({
          where:  { email },
          update: { id: googleId, name },
          create: {
            id:   googleId,
            email,
            name,
            dept: 'UNASSIGNED', // Admin will assign the correct dept later
          },
        });

        return done(null, {
          id:   faculty.id,
          email: faculty.email,
          name:  faculty.name,
          role:  'faculty',
          dept:  faculty.dept,
        });

      } catch (err) {
        // Unexpected error (e.g. database down) — forward to Express error handler
        return done(err);
      }
    }
  )
);

export default passport;
