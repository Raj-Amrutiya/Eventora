function TermsPage() {
  return (
    <div className="page-shell">
      <section className="card terms-hero">
        <p className="kicker">Legal</p>
        <h2>Terms and Conditions</h2>
        <p>
          These terms govern the use of Eventora for event discovery, ticket booking, and account access at
          Ganpat University.
        </p>
      </section>

      <section className="terms-grid">
        <article className="card">
          <h3>Account Use</h3>
          <p>Use a valid email address and keep your password confidential.</p>
          <p>Users are responsible for all actions taken through their accounts.</p>
        </article>

        <article className="card">
          <h3>Bookings and Tickets</h3>
          <p>Booking confirmations are generated digitally and linked to your account.</p>
          <p>Event seat availability and pricing are managed by the organizing team.</p>
        </article>

        <article className="card">
          <h3>Communication Consent</h3>
          <p>
            By using Eventora, you agree to receive login alerts, booking confirmations, and event notification
            emails.
          </p>
          <p>You may contact support for assistance regarding account or event issues.</p>
        </article>
      </section>
    </div>
  );
}

export default TermsPage;