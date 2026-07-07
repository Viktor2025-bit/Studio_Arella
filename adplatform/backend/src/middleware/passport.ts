import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db/pool';
import jwt from 'jsonwebtoken';

// Our Google strategy passes { user, token } through Passport's done().
// We cast to `any` here because Passport's generic User type is set to
// { id, email, role } (matching the authenticate middleware), but the
// Google callback intentionally carries a richer payload that is read
// immediately in googleCallback and never touches req.user generically.
type GooglePayload = { user: any; token: string };

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;

        if (!email) {
          return done(new Error('No email returned from Google'), false);
        }

        // Check if user already exists by email
        const existing = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );

        let user: any;

        if (existing.rows.length > 0) {
          const result = await pool.query(
            `UPDATE users
             SET avatar = COALESCE(avatar, $1),
                 google_id = COALESCE(google_id, $2)
             WHERE email = $3
             RETURNING id, name, email, role, credits, avatar`,
            [avatar, googleId, email]
          );
          user = result.rows[0];
        } else {
          const result = await pool.query(
            `INSERT INTO users (name, email, avatar, google_id, role, password)
             VALUES ($1, $2, $3, $4, 'advertiser', '')
             RETURNING id, name, email, role, credits, avatar`,
            [name, email, avatar, googleId]
          );
          user = result.rows[0];
          user.isNew = true;
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          process.env.JWT_SECRET as string,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        const payload: GooglePayload = { user, token };

        // Cast to any to satisfy Passport's strict Express.User typing.
        // googleCallback reads this payload directly from req.user.
        return done(null, payload as any);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);

export default passport;
