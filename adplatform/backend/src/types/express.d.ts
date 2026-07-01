// Augment Express.User to match what our authenticate middleware
// sets on req.user — { id, email, role }.
// The Passport Google strategy passes its payload via req.user too,
// but we handle that separately in the googleCallback controller
// by casting req.user as any.
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}

export {};
