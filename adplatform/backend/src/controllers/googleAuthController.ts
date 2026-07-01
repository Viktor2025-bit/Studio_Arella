import { Request, Response } from 'express';

// This is called after Passport successfully authenticates with Google.
// At this point req.user contains { user, token, isNew } set by the strategy.
export const googleCallback = (req: Request, res: Response): void => {
  const { user, token } = req.user as any;
  const isNew = user.isNew ?? false;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Redirect to frontend callback page with token + flags in query params.
  // The frontend page reads these, stores them, and redirects to the right page.
  const redirectUrl = new URL('/auth/callback', frontendUrl);
  redirectUrl.searchParams.set('token', token);
  redirectUrl.searchParams.set('name', user.name || '');
  redirectUrl.searchParams.set('email', user.email || '');
  redirectUrl.searchParams.set('role', user.role || 'advertiser');
  redirectUrl.searchParams.set('credits', String(user.credits || 0));
  redirectUrl.searchParams.set('avatar', user.avatar || '');
  redirectUrl.searchParams.set('id', user.id);
  redirectUrl.searchParams.set('new', isNew ? '1' : '0');

  res.redirect(redirectUrl.toString());
};
