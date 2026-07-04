import { Router, Request, Response, NextFunction } from 'express';
import passport from '../middleware/passport';
import { upload } from '../middleware/upload';
import { authenticate } from '../middleware/auth';

// Auth
import { register, login, getMe, updateProfile, verifyEmail, resendVerification, forgotPassword, resetPassword } from '../controllers/authController';
import { googleCallback } from '../controllers/googleAuthController';

// Features
import { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign } from '../controllers/campaignController';
import {
  getBookings,
  getBookingSlots,
  createBooking,
  confirmBooking,
  cancelBooking,
  updateBookingStatus,
  reserveSlots
} from '../controllers/bookingController';
import { getAds, createAd, updateAd, deleteAd, getAdminReviewQueue, reviewAd } from '../controllers/adController';
import { getScreens, createScreen, updateScreen, deleteScreen } from '../controllers/screenController';
import { getBalance, getTransactions, addCredits, getTotalRevenue } from '../controllers/financeController';
import { getDashboardStats, getHourlyAnalytics, getAdvertiserProofOfPlay } from '../controllers/analyticsController';
import { getPlatformStats, getAllUsers, getAllBookings, getAllCampaigns, getAllScreens, updateUserRole, getAllTransactions } from '../controllers/adminController';
import { getPlans } from '../controllers/pricingController';
import { initializePayment, initializeCreditPayment, verifyPayment, monnifyWebhook, devBypassPayment, payFromWallet } from '../controllers/paymentController';
import { getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount } from '../controllers/notificationController';
import { submitCreativeRequest, getMyCreativeRequests, getAllCreativeRequests, updateCreativeRequestStatus } from '../controllers/creativeController';

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.put('/auth/profile', authenticate, updateProfile);
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/resend-verification', resendVerification);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', session: false }),
  googleCallback
);

// ── Dashboard & analytics ─────────────────────────────────────────────────────
router.get('/dashboard/stats', authenticate, getDashboardStats);
router.get('/analytics/hourly', authenticate, getHourlyAnalytics);
router.get('/analytics/proof-of-play', authenticate, getAdvertiserProofOfPlay);

// ── Campaigns ─────────────────────────────────────────────────────────────────
router.get('/campaigns', authenticate, getCampaigns);
router.get('/campaigns/:id', authenticate, getCampaign);
router.post('/campaigns', authenticate, createCampaign);
router.put('/campaigns/:id', authenticate, updateCampaign);
router.delete('/campaigns/:id', authenticate, deleteCampaign);

// ── Bookings ──────────────────────────────────────────────────────────────────
router.get('/bookings/slots', getBookingSlots);
router.post('/bookings/reserve', authenticate, reserveSlots);
router.get('/bookings', authenticate, getBookings);
router.post('/bookings', authenticate, createBooking);
router.post('/bookings/confirm', authenticate, confirmBooking);
router.put('/bookings/:id/cancel', authenticate, cancelBooking);
router.put('/bookings/:id/status', authenticate, updateBookingStatus);

// ── Ads / Creatives ───────────────────────────────────────────────────────────
router.get('/ads', authenticate, getAds);
router.post('/ads', authenticate, upload.single('file'), createAd);
router.put('/ads/:id', authenticate, updateAd);
router.delete('/ads/:id', authenticate, deleteAd);

// Admin creative review
router.get('/ads/review-queue', authenticate, getAdminReviewQueue);
router.put('/ads/:id/review', authenticate, reviewAd);

// ── Screens ───────────────────────────────────────────────────────────────────
router.get('/screens', authenticate, getScreens);
router.post('/screens', authenticate, createScreen);
router.put('/screens/:id', authenticate, updateScreen);
router.delete('/screens/:id', authenticate, deleteScreen);

// ── Finances ──────────────────────────────────────────────────────────────────
router.get('/finances/balance', authenticate, getBalance);
router.get('/finances/transactions', authenticate, getTransactions);
router.post('/finances/add-credits', authenticate, addCredits);
router.get('/finances/revenue', authenticate, getTotalRevenue);

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get('/plans', getPlans);

// ── Payments ──────────────────────────────────────────────────────────────────
router.post('/payments/initialize', authenticate, initializePayment);
router.post('/payments/dev-bypass', authenticate, devBypassPayment);
router.post('/payments/wallet', authenticate, payFromWallet);
router.post('/payments/initialize-credits', authenticate, initializeCreditPayment);
router.get('/payments/verify/:reference', authenticate, verifyPayment);
router.post('/payments/webhook/monnify', monnifyWebhook); // No auth — Monnify signs with HMAC

// ── Creative requests ─────────────────────────────────────────────────────────
router.post('/creative-requests', authenticate, submitCreativeRequest);
router.get('/creative-requests/mine', authenticate, getMyCreativeRequests);
router.get('/creative-requests/all', authenticate, getAllCreativeRequests);
router.put('/creative-requests/:id/status', authenticate, updateCreativeRequestStatus);

// ── Notifications ────────────────────────────────────────────────────────────
router.use('/notifications', authenticate, (req: Request, res: Response, next: NextFunction) => {
  const notificationRouter = Router();
  notificationRouter.get('/', getNotifications);
  notificationRouter.get('/unread', getUnreadCount);
  notificationRouter.put('/read-all', markAllRead);
  notificationRouter.put('/:id/read', markRead);
  notificationRouter.delete('/:id', deleteNotification);
  notificationRouter(req, res, next);
});

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/admin/stats', authenticate, getPlatformStats);
router.get('/admin/users', authenticate, getAllUsers);
router.put('/admin/users/:id/role', authenticate, updateUserRole);
router.get('/admin/bookings', authenticate, getAllBookings);
router.get('/admin/campaigns', authenticate, getAllCampaigns);
router.get('/admin/screens', authenticate, getAllScreens);
router.get('/admin/transactions', authenticate, getAllTransactions);

export default router;
