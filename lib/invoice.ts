import type { Order } from "./types";
import { fmtDate, fmtPrice } from "./format";

interface AdminOrder extends Order {
  user?: { id: string; name: string | null; email: string | null };
}

export function downloadInvoice(order: AdminOrder): void {
  const address = order.address;
  const customerName = order.user?.name ?? address?.name ?? "Customer";
  const customerEmail = order.user?.email ?? "—";
  const customerPhone = address?.phone ?? null;
  const shippingName = address?.name ?? customerName;
  const shippingLine = address
    ? `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`
    : "Address not available";
  const shippingCityLine = address
    ? `${address.city}, ${address.state} - ${address.zip}`
    : "";
  const shippingCountry = address?.country ?? "";
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = order.items.reduce((s, i) => {
    const discPct = i.discount ?? 0;
    return s + (discPct > 0 ? i.price * (discPct / 100) * i.quantity : 0);
  }, 0);

  const itemRows = order.items
    .map((item) => {
      const discPct = item.discount ?? 0;
      const unitPrice = discPct > 0 ? item.price * (1 - discPct / 100) : item.price;
      const lineTotal = unitPrice * item.quantity;
      const discountCell = discPct > 0
        ? `<span class="discount-badge">${discPct}% off</span><br><span class="dim" style="font-size:11px">−${fmtPrice(item.price * (discPct / 100))}/unit</span>`
        : `<span class="dim">—</span>`;
      return `
        <tr>
          <td class="td-left">${item.product.name}<br><span class="mono dim">${item.productId}</span></td>
          <td class="td-center">${item.quantity}</td>
          <td class="td-right">${discPct > 0 ? `${fmtPrice(unitPrice)}<br><span class="strike">${fmtPrice(item.price)}</span>` : fmtPrice(item.price)}</td>
          <td class="td-right">${discountCell}</td>
          <td class="td-right bold">${fmtPrice(lineTotal)}</td>
        </tr>`;
    })
    .join("");

  const discountRow =
    discountAmount > 0
      ? `<div class="total-row discount-row"><span>Discount</span><span>−${fmtPrice(discountAmount)}</span></div>`
      : "";

  const paymentSection = order.payment
    ? `<div class="section" style="margin-top:32px">
        <p class="section-label">Payment</p>
        <p class="info">Status: <strong>${order.payment.status}</strong></p>
        ${order.payment.method ? `<p class="info">Method: <strong>${order.payment.method}</strong></p>` : ""}
        ${order.payment.transactionId ? `<p class="info">Transaction ID: <span class="mono">${order.payment.transactionId}</span></p>` : ""}
        ${order.payment.razorpayOrderId ? `<p class="info">Razorpay Order: <span class="mono">${order.payment.razorpayOrderId}</span></p>` : ""}
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Invoice #${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #18181b;
      background: #fff;
    }
    .page { max-width: 760px; margin: 40px auto; padding: 0 32px 60px; }

    /* ── Header ──────────────────────────────────────────────── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 28px;
      border-bottom: 2px solid #18181b;
      margin-bottom: 32px;
    }
    .brand-tag {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: #a1a1aa; margin-bottom: 6px;
    }
    .brand-name { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .invoice-id { font-size: 22px; font-weight: 800; font-family: monospace; margin-bottom: 6px; }
    .label { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #a1a1aa; }
    .value { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .status-pill {
      margin-top: 8px; display: inline-block;
      padding: 2px 10px; background: #f4f4f5;
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase; color: #71717a;
    }

    /* ── Two-column grid ────────────────────────────────────── */
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .section-label {
      font-size: 10px; font-weight: 700;
      letter-spacing: 0.25em; text-transform: uppercase;
      color: #a1a1aa; margin-bottom: 10px;
    }
    .info { font-size: 13px; color: #3f3f46; line-height: 1.7; }
    .info strong { color: #18181b; font-weight: 600; }

    /* ── Items table ────────────────────────────────────────── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #fafafa; border-top: 1px solid #e4e4e7; border-bottom: 2px solid #e4e4e7; }
    thead th {
      padding: 10px 12px; font-size: 10px; font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase; color: #a1a1aa; text-align: left;
    }
    .td-left  { padding: 11px 12px; border-bottom: 1px solid #f4f4f5; font-size: 13px; }
    .td-center{ padding: 11px 12px; border-bottom: 1px solid #f4f4f5; font-size: 13px; text-align: center; color: #71717a; }
    .td-right { padding: 11px 12px; border-bottom: 1px solid #f4f4f5; font-size: 13px; text-align: right; color: #71717a; }
    .bold { font-weight: 700; color: #18181b !important; }
    .mono { font-family: monospace; font-size: 11px; }
    .dim  { color: #a1a1aa; }
    .strike { color: #a1a1aa; text-decoration: line-through; }
    .discount-badge { display: inline-block; color: #16a34a; font-weight: 700; font-size: 11px; }

    /* ── Totals ─────────────────────────────────────────────── */
    .totals { margin-left: auto; width: 300px; }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 7px 0; font-size: 13px; color: #71717a;
      border-bottom: 1px solid #f4f4f5;
    }
    .total-row.discount-row { color: #16a34a; }
    .total-row.grand {
      padding: 11px 0; font-size: 16px; font-weight: 800; color: #18181b;
      border-top: 2px solid #18181b; border-bottom: 2px solid #18181b;
      margin-top: 4px;
    }

    /* ── Footer ─────────────────────────────────────────────── */
    .footer {
      margin-top: 48px; padding-top: 20px;
      border-top: 1px solid #e4e4e7;
      text-align: center; font-size: 11px; color: #a1a1aa;
      line-height: 1.8;
    }

    /* ── Print button (hidden in print) ─────────────────────── */
    .print-btn {
      display: block; margin: 32px auto 0;
      padding: 11px 28px; background: #18181b; color: #fff;
      border: none; cursor: pointer;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.18em; text-transform: uppercase;
    }
    .print-btn:hover { background: #27272a; }

    @media print {
      body { margin: 0; }
      .page { max-width: 100%; margin: 0; padding: 24px; }
      .print-btn { display: none !important; }
    }
    @media (max-width: 640px) {
      .page { margin: 20px auto; padding: 0 16px 32px; }
      .header { flex-direction: column; gap: 20px; }
      .grid { grid-template-columns: 1fr; gap: 20px; }
      .totals { width: 100%; }
      thead th, .td-left, .td-center, .td-right { padding-left: 8px; padding-right: 8px; }
      .invoice-id { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <p class="brand-tag">Sanitary Fitted</p>
        <p class="brand-name">Tax Invoice</p>
      </div>
      <div style="text-align:right">
        <div class="invoice-id">#${order.id.slice(0, 8).toUpperCase()}</div>
        <div class="label">Date Issued</div>
        <div class="value">${fmtDate(order.createdAt)}</div>
        <div class="status-pill">${order.status}</div>
      </div>
    </div>

    <!-- Bill To / Ship To -->
    <div class="grid">
      <div>
        <p class="section-label">Bill To</p>
        <p class="info"><strong>${customerName}</strong></p>
        <p class="info">${customerEmail}</p>
        ${customerPhone ? `<p class="info">${customerPhone}</p>` : ""}
      </div>
      <div>
        <p class="section-label">Ship To</p>
        <p class="info"><strong>${shippingName}</strong></p>
        <p class="info">${shippingLine}</p>
        ${shippingCityLine ? `<p class="info">${shippingCityLine}</p>` : ""}
        ${shippingCountry ? `<p class="info">${shippingCountry}</p>` : ""}
      </div>
    </div>

    <!-- Order reference -->
    <div style="margin-bottom:24px">
      <p class="section-label">Order Reference</p>
      <p class="info"><span class="mono">${order.id}</span></p>
    </div>

    <!-- Items -->
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Discount</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmtPrice(subtotal)}</span></div>
      ${discountRow}
      <div class="total-row grand"><span>Total</span><span>${fmtPrice(order.totalPrice)}</span></div>
    </div>

    <!-- Payment -->
    ${paymentSection}

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Sanitary Fitted &nbsp;·&nbsp; This is a computer-generated invoice and does not require a signature.</p>
    </div>

    <button class="print-btn" onclick="window.print()">Download / Print PDF</button>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site to download invoices.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    setTimeout(() => win.print(), 250);
  };
}
