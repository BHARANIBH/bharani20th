# GoNaatu — Project Context for Claude

## What is this?
GoNaatu is a Pure Desi Country Chicken e-commerce delivery app (like Swiggy/Zomato but only for fresh country chicken). Built for a real business in India.

## Project Structure
```
goNaatu-master/
├── backend/              ← Node.js + Express + Socket.IO + MongoDB
├── frontend/             ← Customer PWA (vanilla JS) — old version
├── customer/             ← Customer PWA (vanilla JS) — current version
├── partner/              ← Partner dashboard (vanilla JS web)
│   └── orders.html       ← Main partner page with live cutting feature
├── delivery/             ← Delivery agent web dashboard
├── mobile/
│   ├── customer-app/     ← React Native (Expo SDK 54) customer app
│   ├── partner-app/      ← React Native (Expo SDK 51) partner app
│   └── delivery-app/     ← React Native delivery agent app (WIP)
└── CLAUDE.md             ← This file
```

## How to Run Everything

### 1. Backend (run first)
```bash
cd backend
node server.js
# Runs on http://localhost:5000
```

### 2. Partner Dashboard (browser)
```
Open http://localhost:5000/partner
Login with partner credentials
Go to Orders tab — live requests will pop up automatically (polls every 3s)
```

### 3. Customer Mobile App (Expo)
```bash
cd mobile/customer-app
npx expo start
# Press 'a' for Android emulator or scan QR with Expo Go
```

### 4. Partner Mobile App (Expo SDK 51 — use browser only, not Expo Go)
```bash
cd mobile/partner-app
npx expo start --web
# Press 'w' for browser
# NOTE: Expo Go won't work — SDK mismatch. Use browser or partner web dashboard instead.
```

## Local IP Configuration
When testing on a physical phone:
- Edit `mobile/customer-app/config.js`
- Set `LOCAL_IP` to your machine's local IP (e.g. `192.168.1.21`)
- Both phone and laptop must be on the same WiFi

## Tech Stack
- **Backend**: Node.js, Express, Socket.IO, MongoDB (Mongoose), Razorpay, Twilio
- **Customer App**: React Native, Expo SDK 54, React Navigation, Axios
- **Partner App**: React Native, Expo SDK 51
- **Web dashboards**: Vanilla JS, HTML, CSS (no framework)

## Database
- MongoDB — connection string in `backend/.env` (not committed)
- Key collections: `users`, `orders`, `partners`, `products`, `addresses`, `deliveryagents`

## Environment Variables (backend/.env)
```
MONGODB_URI=...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

## Key API Endpoints

### Orders
- `POST /api/orders` — Place order
- `GET /api/orders/my-orders` — Customer order history
- `GET /api/orders/live-requests/pending` — Partner polls this every 3s for live requests
- `POST /api/orders/:id/request-live` — Customer requests live chicken cutting
- `POST /api/orders/:id/send-live-url` — Partner sends YouTube URL to customer
- `POST /api/orders/:id/partner-busy` — Partner rejects live request

### Auth
- `POST /api/auth/send-otp` — Send OTP via Twilio
- `POST /api/auth/verify-otp` — Verify OTP + get JWT

## Socket.IO Events
- `join:order` — Customer joins room `order:<orderId>` to track their order
- `join:partners` — Partner joins `partners` room
- `order:new` — Emitted to `partners` when new order placed
- `order:status` — Emitted to `order:<orderId>` when status changes
- `live:requested` — Emitted to `partners` when customer requests live
- `live:url` — Emitted to `order:<orderId>` when partner sends YouTube URL
- `live:busy` — Emitted to `order:<orderId>` when partner is busy

## Live Chicken Cutting Feature Flow
1. Customer places order → sees "Watch Live Cutting" card on tracking screen
2. Customer taps "Request Live Video" → calls `POST /api/orders/:id/request-live`
3. Backend sets `liveRequested: true` on order, emits `live:requested` via socket
4. Partner dashboard polls `/api/orders/live-requests/pending` every 3 seconds
5. Modal pops up on partner screen showing customer name + phone
6. Partner enters YouTube Live URL → taps "Send to Customer"
7. Backend saves URL, sets `isLive: true`, emits `live:url` via socket
8. Customer app receives socket event → shows "Watch Live" button → opens YouTube

## Order Model — Live Fields
```js
liveRequested: Boolean  // customer has requested live
isLive: Boolean         // partner has sent the URL
liveStreamUrl: String   // YouTube URL
```

## MongoDB Order ID Pattern
Orders have TWO IDs:
- `orderId` — custom string like `DESI1234567890` (shown to users)
- `_id` — MongoDB ObjectId

The `findOrder()` helper in `orderRoutes.js` handles both:
```js
async function findOrder(id) {
  return await Order.findOne({ orderId: id }) ||
         await Order.findById(id).catch(() => null);
}
```

## Known Issues / Pending Work
- [ ] Partner Expo app (SDK 51) can't run on Expo Go — needs SDK 54 upgrade
- [ ] Delivery app is mostly a skeleton — needs full implementation
- [ ] Production deployment: switch `config.js` to Railway URL before building APK
- [ ] Clear old test orders with `liveRequested: true` from MongoDB if polling shows stale requests
- [ ] Build production APK: `eas build --platform android` in customer-app folder

## GitHub Repo
https://github.com/BHARANIBH/bharani20th

## Folder Path on Windows Dev Machine
```
C:\Users\dell\Documents\bharani 20th\goNaatu-master
```
Note the space in "bharani 20th" — always quote the path in PowerShell.
