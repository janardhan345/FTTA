import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from '../lib/prisma.js';
import { env } from './env.js';

passport.use(
  new GoogleStrategy(
    {
      clientID:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL:  env.GOOGLE_CALLBACK_URL,
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const emailLocal = email.split('@')[0]; 
        const [nameFromEmail, deptCode] = emailLocal.split('.'); 

        if (email === env.ADMIN_EMAIL) {
          const admin = await prisma.admin.upsert({
            where:  { email },
            update: { id: googleId, name: nameFromEmail },
            create: { id: googleId, email, name: nameFromEmail },
          });

          return done(null, {
            id:    admin.id,
            email: admin.email,
            name:  admin.name,
            role:  'admin',
          });
        }

        const emailDomain = email.split('@')[1];

        if (emailDomain !== env.FACULTY_DOMAIN) {
          return done(null, false, {
            message: `Email domain "${emailDomain}" is not authorized`,
          });
        }

        const faculty = await prisma.faculty.upsert({
          where:  { email },
          update: { id: googleId, name: nameFromEmail },
          create: {
            id:   googleId,
            email,
            name: nameFromEmail,
            dept: deptCode.toUpperCase(), // Auto-assign from email
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
        return done(err);
      }
    }
  )
);

export default passport;
