import * as functions from "firebase-functions";
import Stripe from "stripe";

// Initialize Stripe (without apiVersion)
let stripe: Stripe;
try {
  const stripeSecretKey = functions.config().stripe.secret;
  if (!stripeSecretKey) {
    throw new Error("Stripe secret key not found in config.");
  }
  stripe = new Stripe(stripeSecretKey); // REMOVED apiVersion argument
} catch (e) {
  console.error("Failed to initialize Stripe:", e);
}

// Define the expected input data type
interface PaymentIntentData {
  amount: number; // Expect amount in smallest currency unit (e.g., paise)
  currency: string; // Expect currency code (e.g., 'inr')
}

export const createPaymentIntent = functions.https.onCall(
    async (
        request: functions.https.CallableRequest<PaymentIntentData>
    ) => {
      if (!stripe) {
        console.error("Stripe not initialized.");
        throw new functions.https.HttpsError(
            "internal",
            "Payment service not configured.",
        );
      }

      const data = request.data;
      const uid = request.auth?.uid;

      const {amount, currency} = data;

      if (
        !amount || typeof amount !== "number" || amount <= 0 ||
      !currency || typeof currency !== "string"
      ) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Requires 'amount' (positive number, smallest unit) and 'currency'",
        );
      }

      try {
        console.log(
            "Creating PI:",
            amount,
            currency.toUpperCase(),
            "for User:",
            uid || "Anon",
        );

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount),
          currency: currency.toLowerCase(),
          automatic_payment_methods: {enabled: true},
          metadata: {userId: uid ?? null}, // Pass UID if using auth check
        });

        console.log("PI created:", paymentIntent.id);

        return {
          clientSecret: paymentIntent.client_secret,
        };
      } catch (error) {
        console.error("Error creating PI:", error);
        const message = error instanceof Error ? error.message :"Unknown error";
        throw new functions.https.HttpsError(
            "internal",
            `Payment creation failed: ${message}`,
        );
      }
    },
);
