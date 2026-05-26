# GoNaatu Mobile Apps

3 separate Expo React Native apps sharing one backend.

## Setup (do this for each app)

```bash
# 1. Update your PC's local IP in each config.js
#    Change LOCAL_IP = '192.168.1.5' to your PC's actual IP
#    Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)

# 2. Install dependencies
cd mobile/customer-app && npm install
cd mobile/partner-app  && npm install
cd mobile/delivery-app && npm install

# 3. Start each app (in separate terminals)
cd mobile/customer-app && npx expo start
cd mobile/partner-app  && npx expo start
cd mobile/delivery-app && npx expo start

# 4. Scan QR code with Expo Go app on your phone
#    (phone and PC must be on same WiFi network)
```

## Apps

| App | Screens | Port |
|-----|---------|------|
| Customer | Login, OTP, Home, Cart, Checkout, Order Tracking, History, Profile | expo start |
| Partner  | Login, OTP, Dashboard (live orders), All Orders, Profile | expo start |
| Delivery | Login, OTP, Dashboard (accept/deliver), Profile | expo start |

## Backend
Start backend first: `cd backend && node server.js`
