const formatDateTime = (value) => new Date(value).toLocaleString('en-IN', { hour12: true });
const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const detailRow = (label, value) => `
  <tr>
    <td style="padding:8px 0; color:#6b7280; font-size:13px; width:38%;">${label}</td>
    <td style="padding:8px 0; color:#0f172a; font-size:13px; font-weight:700;">${value}</td>
  </tr>
`;

const wrapTemplate = ({ title, subtitle, body }) => `
  <div style="margin:0; padding:24px 0; background:#eef3f9; font-family:'Segoe UI', Arial, sans-serif;">
    <div style="max-width:680px; margin:0 auto; border-radius:16px; overflow:hidden; border:1px solid #dbe4f1; background:#ffffff; box-shadow:0 8px 22px rgba(15,23,42,0.08);">
      <div style="padding:22px 24px; background:linear-gradient(135deg,#0f2747,#1f5fbf); color:#ffffff;">
        <p style="margin:0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#dbeafe; font-weight:700;">Eventora</p>
        <h2 style="margin:8px 0 0; font-size:24px; line-height:1.2;">${title}</h2>
        <p style="margin:8px 0 0; font-size:14px; color:#dbeafe;">${subtitle || 'Ganpat University Event Platform'}</p>
      </div>

      <div style="padding:22px 24px; color:#1e293b; line-height:1.65;">
        ${body}
      </div>

      <div style="padding:14px 24px; background:#f8fbff; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px;">
        Automated message from Eventora. Please do not reply directly to this email.
      </div>
    </div>
  </div>
`;

const signupTemplate = ({ name, email, password }) => ({
  subject: 'Your Eventora Account Has Been Created',
  html: wrapTemplate({
    title: 'Account Created Successfully',
    subtitle: 'Welcome to Eventora at Ganpat University',
    body: `
      <p style="margin:0 0 12px;">Hello <strong>${name}</strong>,</p>
      <p style="margin:0 0 18px; color:#475569;">Your Eventora account is ready. You can now discover events, reserve seats, and access QR tickets from one dashboard.</p>

      <div style="border:1px solid #dbe6f4; border-radius:12px; padding:14px 16px; background:#f8fbff;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${detailRow('Registered Email', email)}
          ${detailRow('Temporary Password', password)}
        </table>
      </div>

      <p style="margin:16px 0 0; color:#334155;">For security, update your password after first login.</p>
    `,
  }),
});

const loginTemplate = ({ name, loginAt }) => ({
  subject: 'Login Alert - Eventora',
  html: wrapTemplate({
    title: 'New Login Detected',
    subtitle: 'Security activity on your Eventora account',
    body: `
      <p style="margin:0 0 12px;">Hello <strong>${name}</strong>,</p>
      <p style="margin:0 0 18px; color:#475569;">A successful sign-in was recorded on your account.</p>

      <div style="border:1px solid #dbe6f4; border-radius:12px; padding:14px 16px; background:#f8fbff; margin-bottom:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${detailRow('Login Time', formatDateTime(loginAt))}
          ${detailRow('Platform', 'Eventora Web Portal')}
        </table>
      </div>

      <div style="border-left:4px solid #f59e0b; padding:10px 12px; background:#fff9eb; color:#92400e; font-size:13px; border-radius:8px;">
        If this was not you, reset your password immediately and contact support.
      </div>
    `,
  }),
});

const bookingTemplate = ({
  name,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  tickets,
  amount,
  paymentMethod,
  transactionId,
  seats,
  bookingReference,
  convenienceFee,
  gstAmount,
  discountAmount,
  paymentStatus,
}) => ({
  subject: 'Booking and Payment Confirmation - Eventora',
  html: `
    <div style="margin:0; padding:24px 0; background:#eef3f9; font-family:'Segoe UI', Arial, sans-serif;">
      <div style="max-width:720px; margin:0 auto; border-radius:16px; overflow:hidden; border:1px solid #dbe4f1; background:#ffffff; box-shadow:0 10px 24px rgba(15,23,42,0.08);">
        <div style="padding:22px 24px; background:linear-gradient(125deg,#0f2747,#1f5fbf); color:#ffffff;">
          <p style="margin:0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#dbeafe; font-weight:700;">Booking Confirmed</p>
          <h2 style="margin:8px 0 0; font-size:25px; line-height:1.2;">Eventora Ticket Confirmation</h2>
          <p style="margin:8px 0 0; color:#dbeafe; font-size:14px;">${eventTitle || 'Campus Event'} | ${formatDate(eventDate)} ${eventTime || ''}</p>
        </div>

        <div style="padding:18px 24px; border-bottom:1px solid #e2e8f0; background:#f9fbff;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:14px; color:#334155;">Hello <strong>${name}</strong>, your booking is now secured.</td>
              <td align="right" style="font-size:13px; color:#0f172a; font-weight:700;">Ref: ${bookingReference || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="width:66%; padding-right:14px;">
                <div style="border:1px solid #dbe6f4; border-radius:12px; padding:14px 16px; background:#f8fbff; margin-bottom:12px;">
                  <h3 style="margin:0 0 10px; color:#0f172a; font-size:16px;">Event & Attendee</h3>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    ${detailRow('Event', eventTitle || 'N/A')}
                    ${detailRow('Date', formatDate(eventDate))}
                    ${detailRow('Time', eventTime || 'N/A')}
                    ${detailRow('Venue', venue || 'N/A')}
                    ${detailRow('Seats', seats || 'Auto allocated')}
                    ${detailRow('Tickets', tickets || 0)}
                  </table>
                </div>

                <div style="border:1px solid #dbe6f4; border-radius:12px; padding:14px 16px; background:#ffffff;">
                  <h3 style="margin:0 0 10px; color:#0f172a; font-size:16px;">Payment Summary</h3>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    ${detailRow('Status', paymentStatus || 'pending')}
                    ${detailRow('Method', paymentMethod || 'N/A')}
                    ${detailRow('Transaction ID', transactionId || 'N/A')}
                    ${detailRow('Convenience Fee', formatCurrency(convenienceFee))}
                    ${detailRow('GST', formatCurrency(gstAmount))}
                    ${detailRow('Discount', formatCurrency(discountAmount))}
                    ${detailRow('Total Amount', formatCurrency(amount))}
                  </table>
                </div>
              </td>

              <td valign="top" style="width:34%;">
                <div style="border:1px solid #dbe6f4; border-radius:12px; padding:12px; text-align:center; background:#f8fbff;">
                  <p style="margin:2px 0 10px; color:#1d3557; font-size:13px; font-weight:700;">Entry QR Pass</p>
                  <img src="cid:ticketqr" alt="QR Ticket" style="width:150px; height:150px; border:1px solid #cbd5e1; border-radius:10px; padding:4px; background:#fff;" />
                  <p style="margin:10px 0 0; font-size:12px; color:#64748b; line-height:1.45;">Show this QR at the entry gate for verification.</p>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:14px 24px; background:#f8fbff; border-top:1px solid #e2e8f0; color:#64748b; font-size:12px;">
          Keep this email for entry verification. Carry your valid student identity card during check-in.
        </div>
      </div>
    </div>
  `,
});

const eventAnnouncementTemplate = ({ eventTitle, category, date, time, venue, organizer, price }) => ({
  subject: `New Event Added: ${eventTitle}`,
  html: wrapTemplate({
    title: 'New Event Announcement',
    subtitle: 'A fresh campus event is now open for registration',
    body: `
      <p style="margin:0 0 14px;">Hello,</p>
      <p style="margin:0 0 16px; color:#475569;">A new event has been published on Eventora. Explore the details below and reserve your seat early.</p>

      <div style="border:1px solid #dbe6f4; border-radius:12px; padding:14px 16px; background:#f8fbff; margin-bottom:14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${detailRow('Event', eventTitle || 'N/A')}
          ${detailRow('Category', category || 'N/A')}
          ${detailRow('Date', `${formatDate(date)} ${time ? `at ${time}` : ''}`)}
          ${detailRow('Venue', venue || 'N/A')}
          ${detailRow('Organizer', organizer || 'N/A')}
          ${detailRow('Price', price === 0 ? 'Free' : formatCurrency(price))}
        </table>
      </div>

      <div style="border-left:4px solid #1f5fbf; background:#eff6ff; padding:10px 12px; border-radius:8px; color:#1e3a8a; font-size:13px;">
        Log in to Eventora and book your seats before the slots fill up.
      </div>
    `,
  }),
});

module.exports = {
  signupTemplate,
  loginTemplate,
  bookingTemplate,
  eventAnnouncementTemplate,
};
