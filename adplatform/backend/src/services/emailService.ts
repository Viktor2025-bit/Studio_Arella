import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Studio Arella · Bems Screens" <${process.env.SMTP_USER}>`;

// ── Base email template ───────────────────────────────────────────────────────
const wrap = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F9F7F5;font-family:'Quicksand',Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden">
    <!-- Header -->
    <div style="background:#0A0A0A;padding:24px 32px;display:flex;align-items:center;gap:12px">
      <div style="width:36px;height:36px;background:#F97316;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#fff">B</div>
      <div style="display:inline-block;margin-left:10px;vertical-align:middle">
        <span style="font-size:15px;font-weight:800;color:#fff">Bems Screens</span>
        <span style="display:block;font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.08em;text-transform:uppercase">Studio Arella</span>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:32px">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#FAFAFA;border-top:1px solid #F3F4F6;padding:20px 32px;text-align:center">
      <p style="font-size:12px;color:#9CA3AF;margin:0 0 4px">Studio Arella · Bems Junction, Finbars, Bende Road, Umuahia, Abia State</p>
      <p style="font-size:12px;color:#9CA3AF;margin:0">Managed by Diekolayomi Samuel Babatunde · 08164523926</p>
    </div>
  </div>
</body>
</html>`;

const btn = (text: string, url: string, color = '#F97316') =>
  `<a href="${url}" style="display:inline-block;background:${color};color:#fff;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;margin-top:20px">${text}</a>`;

const h1 = (text: string) =>
  `<h1 style="font-size:22px;font-weight:900;color:#0A0A0A;margin:0 0 8px;letter-spacing:-0.4px">${text}</h1>`;

const p = (text: string, muted = false) =>
  `<p style="font-size:14px;color:${muted ? '#9CA3AF' : '#374151'};line-height:1.7;margin:0 0 12px">${text}</p>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:10px 14px;font-size:13px;color:#9CA3AF;border-bottom:1px solid #F3F4F6;white-space:nowrap">${label}</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#0A0A0A;border-bottom:1px solid #F3F4F6">${value}</td></tr>`;

const table = (rows: string) =>
  `<table style="width:100%;border:1px solid #E5E7EB;border-radius:12px;border-collapse:collapse;margin:16px 0;overflow:hidden">${rows}</table>`;

// ── 1. Email verification ─────────────────────────────────────────────────────
export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${process.env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Verify your email — Bems Screens',
    html: wrap(`
      ${h1('Verify your email address')}
      ${p(`Hi ${name}, welcome to Bems Screens! Please verify your email address to activate your account and start booking ad slots on Studio Arella.`)}
      ${btn('Verify my email', url)}
      ${p('This link expires in 24 hours. If you didn\'t create an account, you can safely ignore this email.', true)}
    `),
  });
}

// ── 2. Welcome email (after verification) ────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `Welcome to Bems Screens, ${name}!`,
    html: wrap(`
      ${h1(`Welcome aboard, ${name}!`)}
      ${p('Your account is now active. You can book ad slots on the <strong>Studio Arella</strong> LED screen at Bems Junction, Umuahia — starting from just ₦1,000 per minute.')}
      ${table(
        row('Screen', 'Studio Arella — Bems Junction') +
        row('Location', 'Finbars, Bende Road, Umuahia, Abia State') +
        row('Starting from', '₦1,000 per minute')
      )}
      ${btn('Book your first ad slot', `${process.env.FRONTEND_URL}/book`)}
    `),
  });
}

// ── 3. Password reset ─────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Reset your password — Bems Screens',
    html: wrap(`
      ${h1('Reset your password')}
      ${p(`Hi ${name}, we received a request to reset your Bems Screens password.`)}
      ${btn('Reset my password', url)}
      ${p('This link expires in <strong>15 minutes</strong>. If you didn\'t request a password reset, please ignore this email — your account is safe.', true)}
    `),
  });
}

// ── 4. Booking confirmation ───────────────────────────────────────────────────
export async function sendBookingConfirmationEmail(to: string, name: string, booking: {
  booking_number: string;
  screen_name: string;
  start_time: string;
  duration_minutes: number;
  total_cost: number;
  creative_title?: string;
  payment_reference: string;
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `Booking confirmed: ${booking.booking_number} — Bems Screens`,
    html: wrap(`
      ${h1('Your booking is confirmed!')}
      ${p(`Hi ${name}, your ad slot on Studio Arella has been secured. Here are your booking details:`)}
      ${table(
        row('Booking Reference', booking.booking_number) +
        row('Screen', booking.screen_name) +
        row('Scheduled Date & Time', new Date(booking.start_time).toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' })) +
        row('Duration', `${booking.duration_minutes} minute${booking.duration_minutes > 1 ? 's' : ''}`) +
        row('Creative', booking.creative_title || 'Not specified') +
        row('Amount Paid', `₦${Number(booking.total_cost).toLocaleString()}`) +
        row('Payment Reference', booking.payment_reference)
      )}
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;margin-top:16px">
        <p style="font-size:13px;color:#15803D;font-weight:700;margin:0">Your ad will play as scheduled. You can track it live from your dashboard.</p>
      </div>
      ${btn('View my booking', `${process.env.FRONTEND_URL}/bookings`)}
    `),
  });
}

// ── 5. Creative approved ──────────────────────────────────────────────────────
export async function sendCreativeApprovedEmail(to: string, name: string, creativeName: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `Creative approved: "${creativeName}" — Bems Screens`,
    html: wrap(`
      ${h1('Your creative has been approved!')}
      ${p(`Hi ${name}, great news — your ad creative <strong>"${creativeName}"</strong> has been reviewed and approved by our team.`)}
      ${p('It is now ready to attach to a booking. Head to your dashboard to book your slot on Studio Arella.')}
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;margin:16px 0">
        <p style="font-size:13px;color:#15803D;font-weight:700;margin:0">Status: APPROVED — Ready for booking</p>
      </div>
      ${btn('Book a slot now', `${process.env.FRONTEND_URL}/book`)}
    `),
  });
}

// ── 6. Creative rejected ──────────────────────────────────────────────────────
export async function sendCreativeRejectedEmail(to: string, name: string, creativeName: string, reason: string) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `Creative not approved: "${creativeName}" — Bems Screens`,
    html: wrap(`
      ${h1('Creative not approved')}
      ${p(`Hi ${name}, unfortunately your ad creative <strong>"${creativeName}"</strong> could not be approved.`)}
      <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px 18px;margin:16px 0">
        <p style="font-size:12px;color:#9CA3AF;margin:0 0 4px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em">Reason for rejection</p>
        <p style="font-size:14px;color:#B91C1C;margin:0;font-weight:600">${reason}</p>
      </div>
      ${p('Please review the feedback, make the necessary changes to your creative, and re-upload. If you need help, contact us on 08164523926.')}
      ${btn('Upload a new creative', `${process.env.FRONTEND_URL}/ads`)}
    `),
  });
}

// ── 7. Booking reminder (24h before) ─────────────────────────────────────────
export async function sendBookingReminderEmail(to: string, name: string, booking: {
  booking_number: string;
  screen_name: string;
  start_time: string;
  duration_minutes: number;
}) {
  await transporter.sendMail({
    from: FROM, to,
    subject: `Reminder: Your ad goes live tomorrow — ${booking.booking_number}`,
    html: wrap(`
      ${h1('Your ad plays tomorrow!')}
      ${p(`Hi ${name}, this is a reminder that your ad slot on Studio Arella is scheduled for tomorrow.`)}
      ${table(
        row('Booking Reference', booking.booking_number) +
        row('Screen', booking.screen_name) +
        row('Scheduled Time', new Date(booking.start_time).toLocaleString('en-NG', { dateStyle: 'full', timeStyle: 'short' })) +
        row('Duration', `${booking.duration_minutes} minute${booking.duration_minutes > 1 ? 's' : ''}`)
      )}
      ${p('No action needed — your ad is all set. You can track proof-of-play from your dashboard after it runs.', true)}
      ${btn('View my booking', `${process.env.FRONTEND_URL}/bookings`)}
    `),
  });
}

// ── 8. Cancellation confirmation ──────────────────────────────────────────────
export async function sendCancellationEmail(to: string, name: string, booking: {
  booking_number: string;
  refund_amount: number;
  refund_reference?: string;
}) {
  const hasRefund = booking.refund_amount > 0;
  await transporter.sendMail({
    from: FROM, to,
    subject: `Booking cancelled: ${booking.booking_number} — Bems Screens`,
    html: wrap(`
      ${h1('Booking cancelled')}
      ${p(`Hi ${name}, your booking <strong>${booking.booking_number}</strong> has been cancelled.`)}
      ${hasRefund
        ? `${table(row('Refund Amount', `₦${Number(booking.refund_amount).toLocaleString()}`) + row('Refund Reference', booking.refund_reference || 'Processing'))}
           <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;margin:16px 0">
             <p style="font-size:13px;color:#15803D;font-weight:700;margin:0">A refund of ₦${Number(booking.refund_amount).toLocaleString()} has been initiated to your original payment method. Allow 3–5 business days.</p>
           </div>`
        : `<div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:14px 18px;margin:16px 0">
             <p style="font-size:13px;color:#C2410C;font-weight:700;margin:0">This cancellation was within 48 hours of the scheduled slot. No refund is applicable per our cancellation policy.</p>
           </div>`}
      ${btn('View my bookings', `${process.env.FRONTEND_URL}/bookings`)}
    `),
  });
}
