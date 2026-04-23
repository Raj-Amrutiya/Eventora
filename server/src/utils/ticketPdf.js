const PDFDocument = require('pdfkit');

const dataUrlToBuffer = (dataUrl) => {
  const base64Data = String(dataUrl).split(',')[1] || '';
  return Buffer.from(base64Data, 'base64');
};

const fmtDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || 'N/A');
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`;

const drawInfoPanel = ({ doc, x, y, width, title, items }) => {
  const headerHeight = 30;
  const rowHeight = 27;
  const panelHeight = headerHeight + (items.length * rowHeight) + 16;

  doc.roundedRect(x, y, width, panelHeight, 14).fillAndStroke('#f8fbff', '#dbe6f4');

  doc.fillColor('#1d3557').fontSize(11).font('Helvetica-Bold').text(title, x + 14, y + 10);

  let rowY = y + headerHeight + 4;
  items.forEach((item) => {
    doc.fillColor('#5f7288').fontSize(8).font('Helvetica-Bold').text(item.label.toUpperCase(), x + 14, rowY + 2, {
      width: 120,
    });
    doc.fillColor('#0f172a').fontSize(10.5).font('Helvetica').text(String(item.value || 'N/A'), x + 136, rowY, {
      width: width - 150,
      align: 'right',
      ellipsis: true,
    });
    rowY += rowHeight;
  });

  return panelHeight;
};

const generateTicketPdfBuffer = ({ booking, event, user, qrCodeDataUrl }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const cardX = 30;
    const cardY = 24;
    const cardWidth = pageWidth - 60;
    const cardHeight = pageHeight - 48;

    doc.rect(0, 0, pageWidth, pageHeight).fill('#edf2f9');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 20).fillAndStroke('#ffffff', '#d8e2ef');

    const headerHeight = 108;
    doc.roundedRect(cardX, cardY, cardWidth, headerHeight, 20).fill('#0f2747');
    doc.rect(cardX, cardY + headerHeight - 20, cardWidth, 20).fill('#0f2747');

    doc.fillColor('#ffffff').fontSize(21).font('Helvetica-Bold').text('Eventora Event Pass', cardX + 24, cardY + 28);
    doc.fillColor('#c8d7ea').fontSize(10.5).font('Helvetica').text('Ganpat University Smart Ticketing Platform', cardX + 24, cardY + 56);

    doc.roundedRect(cardX + cardWidth - 220, cardY + 30, 192, 34, 10).fill('#1e3f6a');
    doc.fillColor('#eaf3ff').fontSize(9).font('Helvetica-Bold').text(`BOOKING REF  ${booking?.bookingReference || 'N/A'}`, cardX + cardWidth - 212, cardY + 43, {
      width: 176,
      align: 'center',
    });

    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(event?.title || 'Campus Event', cardX + 24, cardY + headerHeight + 16, {
      width: cardWidth - 48,
      ellipsis: true,
    });

    const contentY = cardY + headerHeight + 46;
    const leftX = cardX + 20;
    const rightWidth = 188;
    const rightX = cardX + cardWidth - rightWidth - 20;
    const leftWidth = rightX - leftX - 16;

    const detailsHeight = drawInfoPanel({
      doc,
      x: leftX,
      y: contentY,
      width: leftWidth,
      title: 'Event Details',
      items: [
        { label: 'Date', value: fmtDate(event?.date) },
        { label: 'Time', value: event?.time || 'N/A' },
        { label: 'Venue', value: event?.venue || 'N/A' },
        { label: 'Organizer', value: event?.organizer || 'Student Activity Cell' },
      ],
    });

    const attendeeHeight = drawInfoPanel({
      doc,
      x: leftX,
      y: contentY + detailsHeight + 12,
      width: leftWidth,
      title: 'Attendee',
      items: [
        { label: 'Name', value: user?.name || 'Student' },
        { label: 'Email', value: user?.email || 'N/A' },
      ],
    });

    drawInfoPanel({
      doc,
      x: leftX,
      y: contentY + detailsHeight + attendeeHeight + 24,
      width: leftWidth,
      title: 'Booking & Payment',
      items: [
        { label: 'Seats', value: (booking?.selectedSeats || []).join(', ') || 'N/A' },
        { label: 'Tickets', value: booking?.tickets || 0 },
        { label: 'Method', value: booking?.paymentMethod || 'N/A' },
        { label: 'Status', value: booking?.paymentStatus || 'pending' },
        { label: 'Amount', value: fmtCurrency(booking?.paymentAmount) },
      ],
    });

    doc.roundedRect(rightX, contentY, rightWidth, 266, 14).fillAndStroke('#f6f9ff', '#dbe6f4');
    doc.fillColor('#1d3557').fontSize(11).font('Helvetica-Bold').text('Gate Verification', rightX + 14, contentY + 12);

    if (qrCodeDataUrl) {
      const qrBuffer = dataUrlToBuffer(qrCodeDataUrl);
      doc.roundedRect(rightX + 21, contentY + 38, 146, 146, 12).fillAndStroke('#ffffff', '#cfdced');
      doc.image(qrBuffer, rightX + 28, contentY + 45, { fit: [132, 132], align: 'center' });
    }
    doc.fillColor('#51677f').fontSize(9).font('Helvetica').text('Present this QR code at the\nentry gate for verification.', rightX + 18, contentY + 196, {
      width: rightWidth - 36,
      align: 'center',
      lineGap: 2,
    });

    const statusColor = String(booking?.paymentStatus || '').toLowerCase() === 'paid' ? '#16a34a' : '#f59e0b';
    doc.roundedRect(rightX + 32, contentY + 238, rightWidth - 64, 20, 8).fill(statusColor);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(String(booking?.paymentStatus || 'pending').toUpperCase(), rightX + 40, contentY + 244, {
      width: rightWidth - 80,
      align: 'center',
    });

    const footerY = cardY + cardHeight - 72;
    doc.moveTo(cardX + 20, footerY - 12).lineTo(cardX + cardWidth - 20, footerY - 12).lineWidth(1).strokeColor('#dce5f1').stroke();
    doc.fillColor('#526881').fontSize(9).font('Helvetica').text('This is a system-generated pass. Carry a valid student ID card for entry.', cardX + 24, footerY, {
      width: cardWidth - 48,
      align: 'left',
    });
    doc.fillColor('#7a8ca2').fontSize(8).text('Support: events@ganpatuniversity.edu.in | Eventora', cardX + 24, footerY + 20, {
      width: cardWidth - 48,
      align: 'left',
    });

    doc.end();
  });

module.exports = {
  generateTicketPdfBuffer,
  dataUrlToBuffer,
};