import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import http from '../api/http';
import SmartImage from '../components/SmartImage';

const seatRows = 'ABCDEFGHIJKL'.split('');
const seatNumbers = Array.from({ length: 10 }, (_, index) => index + 1);

const couponRules = {
  FEST10: { type: 'percent', value: 10, maxDiscount: 300 },
  STUDENT50: { type: 'flat', value: 50 },
};

function BookingPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tickets, setTickets] = useState(1);
  const [message, setMessage] = useState('');
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [netBankName, setNetBankName] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const baseAmount = (event?.price || 0) * Number(tickets || 1);
  const convenienceFee = Math.round(baseAmount * 0.04);
  const gstAmount = Math.round((baseAmount + convenienceFee) * 0.18);
  const bulkBookingDiscount = Number(tickets || 1) > 5 ? 200 : 0;

  let couponDiscountAmount = 0;
  if (appliedCoupon && couponRules[appliedCoupon]) {
    const rule = couponRules[appliedCoupon];
    if (rule.type === 'percent') {
      couponDiscountAmount = Math.round(((baseAmount + convenienceFee + gstAmount) * rule.value) / 100);
      if (rule.maxDiscount) {
        couponDiscountAmount = Math.min(couponDiscountAmount, rule.maxDiscount);
      }
    }
    if (rule.type === 'flat') {
      couponDiscountAmount = rule.value;
    }
  }

  const discountAmount = couponDiscountAmount + bulkBookingDiscount;

  const totalAmount = Math.max(0, baseAmount + convenienceFee + gstAmount - discountAmount);

  const seatLayout = seatRows.flatMap((row) => seatNumbers.map((number) => `${row}${number}`));

  useEffect(() => {
    const load = async () => {
      const [eventResponse, occupiedResponse, walletResponse] = await Promise.all([
        http.get(`/events/${id}`),
        http.get(`/bookings/event/${id}/occupied-seats`),
        http.get('/wallet/me').catch(() => ({ data: { data: null } })),
      ]);

      setEvent(eventResponse.data.data);
      setOccupiedSeats((occupiedResponse.data.data || []).map((seat) => String(seat).toUpperCase()));
      setWallet(walletResponse.data.data?.wallet || null);
    };
    load();
  }, [id]);

  useEffect(() => {
    setSelectedSeats((current) => current.slice(0, Number(tickets || 1)));
  }, [tickets]);

  const buildTransactionId = () => `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const validatePaymentInputs = () => {
    if (event?.price === 0) {
      return '';
    }

    if (paymentMethod === 'wallet' && (wallet?.balance || 0) < totalAmount) {
      return 'Insufficient wallet balance. Please top up first.';
    }

    if (paymentMethod === 'upi' && !upiId.includes('@')) {
      return 'Please enter a valid UPI ID.';
    }

    if (paymentMethod === 'card' && cardNumber.replace(/\s/g, '').length < 12) {
      return 'Please enter a valid card number.';
    }

    if (paymentMethod === 'netbanking' && netBankName.trim().length < 3) {
      return 'Please enter a valid bank name.';
    }

    return '';
  };

  const submitBooking = async () => {
    setMessage('');
    const validationError = validatePaymentInputs();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (selectedSeats.length !== Number(tickets)) {
      setMessage(`Please select exactly ${tickets} seat(s).`);
      return;
    }

    setProcessing(true);

    try {
      // Simulate realistic payment gateway processing delay.
      if (event?.price > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      await http.post('/bookings', {
        eventId: id,
        tickets: Number(tickets),
        selectedSeats,
        couponCode: appliedCoupon,
        paymentStatus: event?.price > 0 ? 'paid' : 'pending',
        paymentMethod: event?.price > 0 ? paymentMethod : 'none',
        paymentTransactionId: event?.price > 0 ? buildTransactionId() : '',
      });
      setMessage(
        bulkBookingDiscount > 0
          ? 'Booking and payment successful. A bulk-booking discount of INR 200 has been applied.'
          : 'Booking and payment successful. Confirmation email sent.'
      );
      setTimeout(() => navigate('/my-tickets'), 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Booking failed.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSeat = (seatCode) => {
    if (occupiedSeats.includes(seatCode)) {
      return;
    }

    setSelectedSeats((current) => {
      if (current.includes(seatCode)) {
        return current.filter((seat) => seat !== seatCode);
      }

      if (current.length >= Number(tickets)) {
        return current;
      }

      return [...current, seatCode];
    });
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon('');
      setMessage('Coupon cleared.');
      return;
    }

    if (!couponRules[code]) {
      setMessage('Invalid coupon. Try FEST10 or STUDENT50.');
      return;
    }

    setAppliedCoupon(code);
    setMessage(`Coupon ${code} applied.`);
  };

  if (!event) {
    return <div className="page-shell">Loading booking page...</div>;
  }

  return (
    <div className="page-shell booking-grid">
      <section className="card booking-summary-card">
        <h2>{event.title}</h2>
        <SmartImage src={event.image} alt={event.title} className="booking-banner" />
        <p>{event.venue}</p>
        <p>Seats available: {event.seatsAvailable}</p>
        <p>{event.price === 0 ? 'Free event' : `INR ${event.price} per ticket`}</p>
        <div className="price-box">
          <p>Tickets: {tickets}</p>
          <p>Base: INR {baseAmount}</p>
          <p>Convenience Fee: INR {convenienceFee}</p>
          <p>GST: INR {gstAmount}</p>
          {couponDiscountAmount > 0 ? <p>Coupon Discount: - INR {couponDiscountAmount}</p> : null}
          {bulkBookingDiscount > 0 ? <p>Bulk Booking Discount: - INR {bulkBookingDiscount}</p> : null}
          <p>Discount: - INR {discountAmount}</p>
          <h3>Grand Total: INR {totalAmount}</h3>
        </div>
      </section>

      <section className="card checkout-card">
        <h3>Secure Checkout</h3>
        <label>
          Number of tickets
          <input
            type="number"
            min={1}
            max={10}
            value={tickets}
            onChange={(e) => setTickets(e.target.value)}
          />
        </label>

        <div className="seat-map-card">
          <p>Select Seats ({selectedSeats.length}/{tickets})</p>
          <div className="seat-grid">
            {seatLayout.map((seat) => {
              const isOccupied = occupiedSeats.includes(seat);
              const isSelected = selectedSeats.includes(seat);
              return (
                <button
                  key={seat}
                  type="button"
                  className={`seat-btn ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSeat(seat)}
                  disabled={isOccupied}
                >
                  {seat}
                </button>
              );
            })}
          </div>
          <p className="hint-text">Gray: booked, Blue: selected</p>
        </div>

        <label>
          Coupon Code
          <div className="coupon-row">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="FEST10 or STUDENT50"
            />
            <button type="button" className="btn ghost" onClick={applyCoupon}>Apply</button>
          </div>
        </label>

        {event.price > 0 ? (
          <>
            <label>
              Payment Method
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
              </select>
            </label>

            {paymentMethod === 'wallet' ? (
              <div className="wallet-tip-card">
                <strong>Wallet Balance: INR {wallet?.balance || 0}</strong>
                <p>{(wallet?.balance || 0) >= totalAmount ? 'Wallet is ready for quick checkout.' : 'Add money in Wallet to complete this booking.'}</p>
              </div>
            ) : null}

            {paymentMethod === 'upi' ? (
              <label>
                UPI ID
                <input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@oksbi"
                />
              </label>
            ) : null}

            {paymentMethod === 'card' ? (
              <label>
                Card Number
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="XXXX XXXX XXXX XXXX"
                />
              </label>
            ) : null}

            {paymentMethod === 'netbanking' ? (
              <label>
                Bank Name
                <input
                  value={netBankName}
                  onChange={(e) => setNetBankName(e.target.value)}
                  placeholder="Enter bank name"
                />
              </label>
            ) : null}
          </>
        ) : null}

        <button className="btn auth-submit" onClick={submitBooking} disabled={processing}>
          {processing ? 'Processing Payment...' : event.price > 0 ? 'Pay and Book Ticket' : 'Confirm Free Booking'}
        </button>
        {selectedSeats.length > 0 ? <p>Selected Seats: {selectedSeats.join(', ')}</p> : null}
        {message ? <p>{message}</p> : null}
      </section>
    </div>
  );
}

export default BookingPage;
