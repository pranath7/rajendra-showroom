/**
 * Rajendra Showroom – Automated UPI Payment SMS Listener (No Payment Gateway)
 * 
 * How to use:
 * 1. Run this Node.js script on your store server or PC: `node scripts/sms_payment_listener.js`
 * 2. On your store Android phone (which receives bank payment SMS), install any free SMS-to-HTTP app:
 *    - "SMS Forwarder" (by Lanterna) OR "Tasker" OR "MacroDroid"
 * 3. Set the Forwarder Webhook URL to: `http://<YOUR-SERVER-IP>:3000/api/sms-webhook`
 * 
 * Supported Banks/Apps: HDFC, ICICI, SBI, Axis, PhonePe, GPay, Paytm Business
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Port to listen on
const PORT = process.env.PORT || 3000;

// Firebase Project Credentials
const FIREBASE_PROJECT_ID = "rajendra-showroom";

/**
 * Parses incoming SMS text for amount, UTR / Ref Number, and Order Reference ID
 * Example SMS strings:
 * - "Credited with Rs.1499.00 to A/c ... via UPI Ref 42019812019. Note: Bill_ORD1721664000123 - HDFC Bank"
 * - "Received Rs 1499 from customer for Bill ORD1721664000123 UTR: 42019812019"
 * - "A/c 1234 credited by Rs. 500.00 on 22-Jul-26 transfer from VPA rajendra@upi (UPI Ref no 42019812019)"
 */
function parsePaymentSms(smsText) {
  if (!smsText) return null;
  
  const text = String(smsText).trim();
  console.log(`\n📩 Processing Incoming SMS:\n"${text}"`);

  // Verify it is a CREDIT / RECEIVED message (ignore debits)
  const isCredit = /credit|credited|received|deposited|added|recvd/i.test(text) && !/debited|sent|withdrawn/i.test(text);
  if (!isCredit) {
    console.log("ℹ️ Ignored (not a credit notification).");
    return null;
  }

  // 1. Extract Amount (e.g., Rs 1499.00, Rs. 500, INR 1200)
  const amountMatch = text.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // 2. Extract UTR / UPI Ref Number (12 digits)
  const utrMatch = text.match(/(?:UPI Ref|Ref no|Ref|UTR)[:\s#-]*(\d{12})/i) || text.match(/\b\d{12}\b/);
  const utr = utrMatch ? utrMatch[1] : `SMS_${Date.now()}`;

  // 3. Extract Order Reference ID (e.g. ORD1721664000123 or ORD-12345)
  const orderRefMatch = text.match(/(ORD[-_]?\d+)/i) || text.match(/(?:Bill|Order|Ref)[:\s#-]*([A-Za-z0-9_-]+)/i);
  const orderRef = orderRefMatch ? orderRefMatch[1] : null;

  return {
    amount,
    utr,
    orderRef,
    rawText: text,
    timestamp: new Date().toISOString()
  };
}

/**
 * Syncs the verified payment to Firebase Firestore via REST API
 */
function syncPaymentToFirebase(paymentData, callback) {
  const orderRef = paymentData.orderRef || `UNMATCHED_${paymentData.utr}`;
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/pending_payments/${encodeURIComponent(orderRef)}?updateMask.fieldPaths=status&updateMask.fieldPaths=utr&updateMask.fieldPaths=verifiedAt&updateMask.fieldPaths=amount`;

  const payload = JSON.stringify({
    fields: {
      status: { stringValue: "PAID" },
      utr: { stringValue: paymentData.utr },
      verifiedAt: { stringValue: paymentData.timestamp },
      amount: { doubleValue: paymentData.amount || 0 }
    }
  });

  const parsedUrl = url.parse(firestoreUrl);
  const req = https.request({
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`✅ Synced payment for ${orderRef} to Firebase Firestore (HTTP ${res.statusCode})`);
      if (callback) callback(null, body);
    });
  });

  req.on('error', (err) => {
    console.error("❌ Failed to sync to Firebase:", err.message);
    if (callback) callback(err);
  });

  req.write(payload);
  req.end();
}

// Create HTTP Webhook Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);

  // Health check endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h2>⚡ Rajendra Showroom Payment Detector Service Active</h2>
      <p>Webhook Endpoint: <code>POST /api/sms-webhook</code></p>
      <p>Send test payload: <code>POST /api/simulate-payment</code></p>
    `);
    return;
  }

  // Webhook endpoint for Android SMS Forwarders
  if (req.method === 'POST' && (parsedUrl.pathname === '/api/sms-webhook' || parsedUrl.pathname === '/api/simulate-payment')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        let data = {};
        if (body) {
          try {
            data = JSON.parse(body);
          } catch(e) {
            data = { smsText: body };
          }
        }
        
        // Accept SMS text from various format field names
        const smsText = data.smsText || data.text || data.body || data.message || data.content || '';
        const orderRef = data.orderRef || null;
        const utr = data.utr || null;
        const amount = data.amount || null;

        if (orderRef) {
          // Direct manual trigger / simulation
          const paymentData = {
            orderRef: String(orderRef),
            utr: utr || `SIM_${Date.now().toString().slice(-6)}`,
            amount: Number(amount || 0),
            timestamp: new Date().toISOString()
          };
          syncPaymentToFirebase(paymentData, () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: "Payment verified!", payment: paymentData }));
          });
          return;
        }

        const parsed = parsePaymentSms(smsText);
        if (!parsed) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: "No credit payment detected in SMS text." }));
          return;
        }

        syncPaymentToFirebase(parsed, () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: "Payment processed successfully", parsed }));
        });

      } catch (err) {
        console.error("Error processing request:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Rajendra Showroom Payment Detector Service Active!`);
  console.log(`📡 Listening on Port: ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/sms-webhook`);
  console.log(`======================================================\n`);
});
