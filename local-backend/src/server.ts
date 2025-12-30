// src/server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
// Use CommonJS require syntax for node-fetch@2
const fetch = require('node-fetch'); 
const YOUR_IP = '10.70.19.103'; // <--- PASTE YOUR ACTUAL IP HERE

dotenv.config();

// --------------------- FIREBASE SETUP ---------------------
try {
  // Resolve path from the compiled JS file in 'dist' (or 'lib') folder
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ serviceAccountKey.json not found at: ${serviceAccountPath}`);
    process.exit(1);
  }
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log('✅ Firebase Admin SDK Initialized.');
} catch (error) {
  console.error('❌ FIREBASE ADMIN SDK INIT FAILED:', error);
  process.exit(1);
}

const db = admin.firestore();
// ----------------------------------------------------------

// ---------------------- STRIPE SETUP ----------------------
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !stripeWebhookSecret) {
  console.error('❌ Stripe keys (SECRET and WEBHOOK_SECRET) not found in .env file!');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
// ----------------------------------------------------------

// --- Helper Function to Send Expo Push Notification ---
const sendExpoPushNotification = async (token: string, title: string, body: string): Promise<void> => {
  if (!token || !token.startsWith('ExponentPushToken')) {
    console.log(`[Notifications] Invalid or missing token, skipping push: ${token}`);
    return;
  }
  const message = { to: token, sound: 'default', title: title, body: body, };
  try {
    console.log(`[Notifications] Sending push to ${token}`);
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    console.log(`[Notifications] Push notification sent successfully.`);
  } catch (error) {
    console.error('[Notifications] Error sending push notification:', error);
  }
};
// ----------------------------------------------------------

// --- Helper Function to Create Inbox Notification ---
const createFirestoreNotification = async (userId: string, title: string, body: string): Promise<void> => {
  if (!userId) {
     console.error('[Notifications] Cannot create notification: userId is missing.');
     return;
  }
  try {
    await db.collection('notifications').add({
      userId: userId,
      title: title,
      body: body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });
    console.log(`[Notifications] Inbox message created for user ${userId}`);
  } catch (error) {
    console.error('[Notifications] Error creating inbox message:', error);
  }
};
// ----------------------------------------------------------


const app = express();
const port = process.env.PORT || 4242;
app.use(cors({ origin: true }));

// ------------------ STRIPE WEBHOOK ROUTE ------------------
// IMPORTANT: Raw body parser for webhook MUST come first
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }), 
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      console.log('✅ [Webhook] Verifying signature...');
      event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
      console.log(`✅ [Webhook] Verified: ${event.type}`);
    } catch (err) {
      console.error('❌ [Webhook] Signature verification failed:', (err as Error).message);
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { 
        userId, 
        providerId, 
        planId, 
        planName, 
        planFrequency,
        pricePaid 
      } = session.metadata || {};

      if (!userId || !providerId || !planId || !planFrequency || !pricePaid || userId === 'UNKNOWN_USER') {
        console.error('⚠️ [Webhook] Missing required metadata:', session.metadata);
        return res.status(200).json({ received: true, error: 'Missing metadata' });
      }

      try {
        const subRef = db.collection('subscriptions').doc();
        const startDate = new Date();
        const endDate = new Date(startDate);
        if (planFrequency.toLowerCase() === 'weekly') {
          endDate.setDate(startDate.getDate() + 7);
        } else {
          endDate.setMonth(startDate.getMonth() + 1);
        }
        const priceInRupees = parseFloat(pricePaid) / 100;

        await subRef.set({
          userId, providerId, planId,
          planName: planName || 'N/A',
          planFrequency,
          pricePaid: priceInRupees,
          startDate: admin.firestore.Timestamp.fromDate(startDate),
          endDate: admin.firestore.Timestamp.fromDate(endDate),
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          stripeSubscriptionId: session.subscription,
          stripeCheckoutSessionId: session.id,
        });

        console.log(`✅ [Webhook] Subscription created for user ${userId} with price ${priceInRupees}`);
        
        // --- Send "New Subscriber" Notification to Provider ---
        try {
          const providerUserDoc = await db.collection('users').doc(providerId).get(); 
          if (providerUserDoc.exists) { // Use .exists (boolean)
            const providerToken = providerUserDoc.data()?.pushToken;
            const title = 'You have a new subscriber! 🎉';
            const body = `A new customer just subscribed to your "${planName}" plan.`;
            
            // Send both notifications (don't need to await)
            sendExpoPushNotification(providerToken, title, body); 
            createFirestoreNotification(providerId, title, body);
          } else {
            console.log(`[Webhook] Provider user document not found for ID: ${providerId}`);
          }
        } catch (notifyError) {
          console.error('[Webhook] Failed to send "New Subscriber" notification:', notifyError);
        }
        // --- END NOTIFICATION LOGIC ---

      } catch (dbError) {
        console.error('❌ [Webhook] Firestore Error:', dbError);
        return res.status(500).send('DB Error');
      }
    } else {
      console.log(`ℹ️ [Webhook] Unhandled event type: ${event.type}`);
    }
    res.status(200).json({ received: true });
  }
);
// ----------------------------------------------------------

// JSON parser for other routes MUST come AFTER the raw parser for webhook
app.use(express.json());

// ------------------- CHECKOUT SESSION ---------------------
// Type for create checkout request body
interface CreateCheckoutRequestBody {
  price: number; // in paise
  planName: string;
  providerId: string;
  planId: string;
  customerId?: string;
  frequency: 'Weekly' | 'Monthly';
}

app.post(
  '/create-checkout-session',
  async (req: Request<object, object, CreateCheckoutRequestBody>, res: Response) => {
    try {
      const { price, planName, providerId, planId, customerId, frequency } = req.body;
      if (!price || !planName || !providerId || !planId || !frequency) {
        return res.status(400).send({ error: 'Missing required data' });
      }
      const interval = frequency.toLowerCase() === 'weekly' ? 'week' : 'month';
      if (interval !== 'week' && interval !== 'month') {
        return res.status(400).send({ error: 'Invalid frequency.' });
      }

      // const successUrl = 'http://localhost:5173/payment-success';
      // const cancelUrl = process.env.CHECKOUT_CANCEL_URL || 'http://localhost:5173/';

      const successUrl = `http://${YOUR_IP}:5173/payment-success`; 
      const cancelUrl = `http://${YOUR_IP}:5173/`;

      const session = await stripe.checkout.sessions.create({
        line_items: [ {
            price_data: {
              currency: 'inr',
              product_data: { name: planName },
              unit_amount: Math.round(price),
              recurring: { interval },
            },
            quantity: 1,
          }, ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: customerId || 'UNKNOWN_USER',
          providerId,
          planId,
          planName,
          planFrequency: frequency,
          pricePaid: String(price), // Send price in paise
        },
      });
      
      console.log('✅ Stripe Session created:', session.id);
      if (!session.url) { throw new Error('Stripe session URL is null.'); }
      res.send({ checkoutUrl: session.url });

    } catch (error) {
      console.error('❌ Error creating Stripe session:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send({ error: `Failed to create checkout session: ${message}` });
    }
  }
);
// ----------------------------------------------------------

// --- ENDPOINT FOR ADMIN (Account Approved) NOTIFICATIONS ---
interface SendNotificationBody {
    userId: string;
    title: string;
    body: string;
}

app.post('/send-notification', async (req: Request<object, object, SendNotificationBody>, res: Response) => {
    try {
        const { userId, title, body } = req.body;
        if (!userId || !title || !body) {
            return res.status(400).send({ error: 'Missing required data: userId, title, body' });
        }
        console.log(`[Notifications] Received request to notify user: ${userId}`);

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.error(`[Notifications] User ${userId} not found, cannot send notification.`);
            return res.status(404).send({ error: 'User not found' });
        }
        const userToken = userDoc.data()?.pushToken;

        await sendExpoPushNotification(userToken, title, body);
        await createFirestoreNotification(userId, title, body);

        res.status(200).send({ success: true, message: 'Notification sent.' });

    } catch (error) {
        console.error('❌ Error sending notification:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).send({ error: `Failed to send notification: ${message}` });
    }
});
// --- END NEW ENDPOINT ---

// --- ENDPOINT FOR MENU UPDATE NOTIFICATIONS ---
interface NotifyMenuUpdateBody {
    providerId: string;
}

app.post('/notify-menu-update', async (req: Request<object, object, NotifyMenuUpdateBody>, res: Response) => {
    try {
        const { providerId } = req.body;
        if (!providerId) {
            return res.status(400).send({ error: 'Missing providerId' });
        }

        console.log(`[Notifications] Received request to notify subscribers for provider: ${providerId}`);

        // 1. Fetch provider's kitchenName
        let kitchenName = 'Your provider';
        try {
            const providerDoc = await db.collection('providerProfiles').doc(providerId).get();
            if (providerDoc.exists) {
                kitchenName = providerDoc.data()?.kitchenName || kitchenName;
            }
        } catch (e) { console.error("Failed to fetch kitchenName:", e); }

        // 2. Find all active subscribers for this provider
        const subsRef = db.collection('subscriptions');
        const q = subsRef.where('providerId', '==', providerId).where('status', '==', 'active');
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            console.log('[Notifications] No active subscribers found. No notifications sent.');
            return res.status(200).send({ success: true, message: 'No active subscribers to notify.' });
        }

        const userIds = new Set<string>();
        querySnapshot.forEach(doc => userIds.add(doc.data().userId));

        // 3. Get push tokens for those users
        const tokens: { userId: string, token: string }[] = [];
        const usersRef = db.collection('users');
        // 'in' query limited to 30. For a real app, batch this.
        const usersQuery = usersRef.where(admin.firestore.FieldPath.documentId(), 'in', Array.from(userIds).slice(0, 30));
        const usersSnapshot = await usersQuery.get();

        usersSnapshot.forEach(doc => {
            const pushToken = doc.data()?.pushToken;
            if (pushToken) {
                tokens.push({ userId: doc.id, token: pushToken });
            }
        });

        if (tokens.length === 0) {
             console.log('[Notifications] No subscribers found with push tokens. No notifications sent.');
             return res.status(200).send({ success: true, message: 'No subscribers with push tokens.' });
        }

        // 4. Send notifications in parallel
        const title = 'Menu Updated! 🍲';
        const body = `Your provider, ${kitchenName}, has just updated their menu for the week!`;
        
        const pushPromises = tokens.map(t => sendExpoPushNotification(t.token, title, body));
        const inboxPromises = tokens.map(t => createFirestoreNotification(t.userId, title, body));

        await Promise.all([...pushPromises, ...inboxPromises]);

        console.log(`[Notifications] Sent menu update notifications to ${tokens.length} subscribers.`);
        res.status(200).send({ success: true, message: `Sent to ${tokens.length} subscribers.` });

    } catch (error) {
        console.error('❌ Error sending menu update notifications:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).send({ error: `Failed to send notifications: ${message}` });
    }
});
// --- END NEW ENDPOINT ---

// --- *** NEW: Ratings & Reviews Endpoint *** ---

interface SubmitReviewBody {
  providerId: string;
  userId: string;
  rating: number;
  reviewText: string;
}

app.post('/submit-review', async (req: Request<object, object, SubmitReviewBody>, res: Response) => {
  try {
    const { providerId, userId, rating, reviewText } = req.body;

    if (!providerId || !userId || !rating) {
      return res.status(400).send({ error: 'Missing required data' });
    }

    // 1. Save the new review
    await db.collection('reviews').add({
      providerId,
      userId,
      rating,
      reviewText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[Reviews] New review added for provider ${providerId}: ${rating} stars`);

    // 2. Recalculate Average Rating
    const reviewsSnapshot = await db.collection('reviews').where('providerId', '==', providerId).get();
    
    let totalRating = 0;
    let count = 0;
    
    reviewsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.rating) {
        totalRating += data.rating;
        count++;
      }
    });

    const averageRating = count > 0 ? (totalRating / count) : 0;
    // Round to 1 decimal place (e.g., 4.2)
    const roundedAverage = Math.round(averageRating * 10) / 10;

    console.log(`[Reviews] New stats for ${providerId}: ${roundedAverage} stars (${count} reviews)`);

    // 3. Update Provider Profile
    await db.collection('providerProfiles').doc(providerId).update({
      averageRating: roundedAverage,
      ratingCount: count,
    });

    res.status(200).send({ success: true });

  } catch (error) {
    console.error('❌ Error submitting review:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).send({ error: `Failed to submit review: ${message}` });
  }
});
// --- *** END NEW ENDPOINT *** ---


app.get('/', (_: Request, res: Response) => {
  res.send('🚀 Tiffly Local Backend is running!');
});

app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});