# 🍜 Tiffly Project: Subscription-Based Tiffin Service Application

Tiffly is a full-stack marketplace application connecting customers with local home-based tiffin providers. It streamlines the process of subscribing to daily meals, managing payments, and coordinating deliveries. The system consists of a mobile app (for Customers & Providers), a web admin panel, and a custom backend server.

---

## ✨ Key Features

| User Role | Features |
| :--- | :--- |
| **Customer** (Mobile) | • Browse "Approved" providers & search by cuisine/city.<br>• View detailed 7-day Weekly Menus.<br>• Subscribe to Weekly/Monthly plans via **Stripe**.<br>• **"Deliver Here"** address bar & Profile management.<br>• Pause/Resume subscriptions (with auto-renewal date extension).<br>• **Payment History** with detailed receipts.<br>• **Rate & Review** providers after purchase.<br>• **Notification Inbox** with unread badge (Order updates, Menu changes). |
| **Provider** (Mobile) | • Multi-step Onboarding Form (Kitchen details, FSSAI, Image upload).<br>• **Daily Dashboard:** See active deliveries for *today* with "Dispatch" button.<br>• **Menu Management:** Create/Edit subscription plans & update Weekly Menu.<br>• **Earnings:** View transaction history & calculated earnings (90% share).<br>• **Food Waste:** Report leftover food for donation.<br>• Receive push notifications for New Subscribers & Account Approval. |
| **Admin** (Web) | • **Dashboard:** Real-time analytics (Revenue, Active Subs) & Charts.<br>• **Provider Management:** Approve/Reject applications; Suspend/Deactivate accounts.<br>• **Transactions:** View full ledger & Platform Revenue (8% share).<br>• **Food Reports:** Manage leftover food reports from providers. |
| **Backend** | • **Stripe Connect (Simulated):** Handles payments & webhooks.<br>• **Push Notifications:** Triggers via Expo Push API.<br>• **Job Processing:** Calculates ratings & revenue splits. |

---

## 🛠️ Tech Stack

* **Frontend (Mobile):** React Native, Expo, TypeScript, React Native Paper, React Navigation
* **Frontend (Admin):** React.js, TypeScript, Vite, Tailwind CSS, Recharts
* **Backend:** Node.js, Express.js, TypeScript
* **Database & Auth:** Google Firebase (Firestore, Authentication, Storage)
* **Payments:** Stripe Checkout
* **Image Storage:** Cloudinary
* **Notifications:** Expo Push Notifications

---

## ⚙️ Prerequisites

Ensure you have the following installed:
1.  **Node.js** (LTS Version) & **npm**
2.  **Git**
3.  **Expo Go** app on your physical Android/iOS device.
4.  **Stripe CLI** (for forwarding webhooks locally).

---

## 🚀 Installation

Follow these steps in order. Open your terminal in the folder where you want to store the project.

### 1. Clone the Repository
```bash
git clone [https://github.com/afsheen-pathan/Tiffly-Project.git](https://github.com/afsheen-pathan/Tiffly-Project.git)
cd Tiffly-Project

```
### 2. Mobile App
```bash
cd tiffly-mobile
npm install
cd ..
```
### 3. Admin Panel
```bash
cd tiffly-admin
npm install
cd ..
```
### 4. Backend Server
```bash
cd local-backend
npm install
# Install specific packages required for this setup
npm install node-fetch@2
npm i --save-dev @types/node-fetch@2
cd ..
```

-------

## 🔑 Configuration Guide (Crucial)

Since this is a secure project, API keys are not included. You must create the following files manually.

### 1. Firebase Configuration (Database)
Get keys from: Firebase Console > Project Settings > General > Web App.

Update File: tiffly-mobile/src/config/firebase.ts

Update File: tiffly-admin/src/config/firebase.ts
```bash
// Replace the placeholder object with your actual config
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```
### 2. Backend Service Account (Admin SDK)
Get key from: Firebase Console > Project Settings > Service Accounts > "Generate new private key".

Action:

Download the JSON file.

Rename it to serviceAccountKey.json.

Move it into the local-backend/ folder.

### 3. Local IP Address (Networking)
Why: Allows your phone to talk to your computer's server.

Find IP: Run ipconfig (Windows) or ifconfig (Mac) and copy your IPv4 Address (e.g., 192.168.1.10).

Update File: tiffly-mobile/src/config/api.ts
```bash
const LOCAL_IP_ADDRESS = 'YOUR_IPV4_ADDRESS'; // e.g. '192.168.1.10'
```
Update File: local-backend/src/server.ts
```bash
// Find this line near the top
const YOUR_IP = 'YOUR_IPV4_ADDRESS';
```
Update File: tiffly-admin/src/services/adminNotificationService.ts
```bash
const LOCAL_BACKEND_URL = 'http://YOUR_IPV4_ADDRESS:4242';
```

### 4. Stripe Configuration (Payments)
Get keys from: Stripe Dashboard > Developers > API Keys.

Create File: local-backend/.env
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  (Get this after running 'stripe listen')
PORT=4242
```

Update File: tiffly-mobile/App.tsx
```bash
const STRIPE_PUBLISHABLE_KEY = "pk_test_...";
```
### 5. Cloudinary (Image Uploads)
Get keys from: Cloudinary Dashboard > Settings > Upload.

Update File: tiffly-mobile/src/services/imageService.ts

Update CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET.

### 6. Expo Project ID (Notifications)
Action: Run npx expo config --json inside tiffly-mobile to verify your ID.

Update File: tiffly-mobile/app.json
```bash
"extra": {
  "eas": {
    "projectId": "YOUR_EXPO_PROJECT_ID"
  }
}
```
----
## ▶️ Running the Application
You need 4 separate terminal windows running simultaneously.

### Terminal 1: Local Backend
```bash
cd local-backend
npm run dev
```

### Terminal 2: Admin Panel
```bash
cd tiffly-admin
npm run dev
```

### Terminal 3: Stripe Webhook Listener
```bash
# Forwards Stripe events to your local server
stripe listen --forward-to localhost:4242/webhook
```

### Terminal 4: Mobile App
```bash
cd tiffly-mobile
npx expo start -c
```

---

## 🧪 End-to-End Testing Flow

1. Provider Signup:

  (Mobile) Sign up as a Provider -> Fill Onboarding Form -> Submit.

2. Admin Approval:

  (Web) Log in -> "Pending Providers" -> Click "Approve".

  (Check: Provider gets "Account Approved" notification).

3. Provider Setup:

  (Mobile) Log in -> "My Menu" -> Set Weekly Menu -> Add a Subscription Plan.

  (Check: "Menu Updated" notification logic).

4. Customer Subscription:

  (Mobile) Log in as Customer -> Browse -> Tap Provider -> "Subscribe" -> Pay via Stripe.

  (Check: Redirects to Success Page -> App shows Active Subscription).

  (Check: Provider gets "New Subscriber" notification).

5. Provider Dispatch:

  (Mobile) Provider Dashboard -> Tap "Dispatch".

  (Check: Customer gets "Tiffin on its way" notification).

6. Review:

  (Mobile) Customer Profile -> Payment History -> Tap "Rate".

  (Check: Admin Panel shows updated average rating for Provider).
