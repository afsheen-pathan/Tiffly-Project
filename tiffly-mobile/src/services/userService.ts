// src/services/userService.ts

import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch, // Import writeBatch
} from "firebase/firestore";

// --- Sign Up/In Types ---
export type SignUpData = {
  email: string;
  password: string;
  role: "customer" | "provider";
};
export type SignInData = {
  email: string;
  password: string;
};

// --- Sign Up Function ---
export const signUp = async (data: SignUpData) => {
  const { email, password, role } = data;
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    // Create user doc
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      createdAt: serverTimestamp(),
      name: "",
      address: "",
      phoneNumber: "",
    });
    // Create provider profile doc if role is provider
    if (role === "provider") {
      await setDoc(doc(db, "providerProfiles", user.uid), {
        userId: user.uid,
        email: user.email,
        providerFullName: "",
        kitchenName: "",
        kitchenImageUrl: "",
        phoneNumber: "",
        kitchenDescription: "",
        streetAddress: "",
        city: "",
        pincode: "",
        cuisineType: "",
        maxCapacity: "10-20",
        fssaiLicenseNumber: "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
    }
    await signOut(auth); // Sign out after creation
    return { success: true };
  } catch (error: any) {
    console.error("Error signing up: ", error);
    return { error };
  }
};

// --- Sign In Function ---
export const signIn = async (data: SignInData) => {
  const { email, password } = data;
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { user: userCredential.user };
  } catch (error: any) {
    console.error("Error signing in: ", error);
    return { error };
  }
};

// --- Password Reset Function ---
export const requestPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    let message = "Failed to send reset email.";
    if (error.code === "auth/user-not-found") {
      message = "No account found with this email address.";
    }
    return { error: message };
  }
};

// --- Customer Profile Update Types & Function ---
export type UserProfileDetails = {
  name: string;
  address: string;
  phoneNumber: string;
};
export type UserProfile = {
  uid: string;
  email: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  pushToken?: string; // Ensure pushToken is part of this type
};
export const updateUserProfile = async (
  userId: string,
  details: UserProfileDetails
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      ...details,
      profileComplete: true,
      updatedAt: serverTimestamp(),
    });
    console.log(`User profile updated for ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating user profile for ${userId}:`, error);
    return { success: false, error: "Failed to save details." };
  }
};

// --- Provider Profile Update Types & Function ---
export type ProviderProfileData = {
  providerFullName: string;
  kitchenName: string;
  kitchenImageUrl: string;
  phoneNumber: string;
  kitchenDescription: string;
  streetAddress: string;
  city: string;
  pincode: string;
  cuisineType: string;
  maxCapacity: string;
  fssaiLicenseNumber?: string;
};
export const updateProviderProfile = async (
  userId: string,
  data: ProviderProfileData
) => {
  try {
    const providerDocRef = doc(db, "providerProfiles", userId);
    await updateDoc(providerDocRef, {
      ...data,
      status: "pending_approval",
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating provider profile:", error);
    return { error };
  }
};

// --- Plan Types & Functions ---
export type Plan = {
  id?: string;
  planName: string;
  price: number;
  mealType: "Lunch" | "Dinner";
  frequency: "Weekly" | "Monthly";
  description?: string;
  createdAt?: Timestamp;
};
export const getProviderPlans = async (
  providerId: string
): Promise<{ plans: Plan[]; error?: any }> => {
  try {
    const plansRef = collection(db, "providerProfiles", providerId, "plans");
    const q = query(plansRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const plans: Plan[] = [];
    querySnapshot.forEach((docSnap) => {
      plans.push({ id: docSnap.id, ...docSnap.data() } as Plan);
    });
    return { plans };
  } catch (error) {
    console.error("Error fetching provider plans:", error);
    return { plans: [], error };
  }
};
export const addProviderPlan = async (
  providerId: string,
  planData: Omit<Plan, "id" | "createdAt">
): Promise<{ planId?: string; error?: any }> => {
  try {
    const plansRef = collection(db, "providerProfiles", providerId, "plans");
    const docRef = await addDoc(plansRef, {
      ...planData,
      createdAt: serverTimestamp(),
    });
    return { planId: docRef.id };
  } catch (error) {
    console.error("Error adding provider plan:", error);
    return { error };
  }
};
export const updateProviderPlan = async (
  providerId: string,
  planId: string,
  planData: Partial<Plan>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const planDocRef = doc(db, "providerProfiles", providerId, "plans", planId);
    await updateDoc(planDocRef, {
      ...planData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating provider plan:", error);
    return { success: false, error };
  }
};
export const deleteProviderPlan = async (
  providerId: string,
  planId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const planDocRef = doc(db, "providerProfiles", providerId, "plans", planId);
    await deleteDoc(planDocRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting provider plan:", error);
    return { success: false, error };
  }
};

// --- Weekly Menu Types & Functions ---
export type WeeklyMenu = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  updatedAt?: Timestamp;
};
export const getProviderWeeklyMenu = async (
  providerId: string
): Promise<{ menu: WeeklyMenu | null; error?: string }> => {
  try {
    const menuDocRef = doc(
      db,
      "providerProfiles",
      providerId,
      "menuDetails",
      "weeklyMenu"
    );
    const docSnap = await getDoc(menuDocRef);
    if (docSnap.exists()) {
      return { menu: docSnap.data() as WeeklyMenu };
    } else {
      return { menu: null };
    }
  } catch (error) {
    console.error("Error fetching weekly menu:", error);
    return { menu: null, error: "Failed to load menu." };
  }
};
export const updateProviderWeeklyMenu = async (
  providerId: string,
  menuData: Omit<WeeklyMenu, "updatedAt">
): Promise<{ success: boolean; error?: string }> => {
  try {
    const menuDocRef = doc(
      db,
      "providerProfiles",
      providerId,
      "menuDetails",
      "weeklyMenu"
    );
    await setDoc(
      menuDocRef,
      { ...menuData, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating weekly menu:", error);
    return { success: false, error: "Failed to save menu." };
  }
};

// --- Public/Full Provider Profile Types ---
export type PublicProviderProfile = {
  id: string;
  kitchenName: string;
  city: string;
  cuisineType: string;
  kitchenImageUrl?: string;
  averageRating?: number;
  ratingCount?: number;
};
export type FullProviderProfile = {
  id: string;
  kitchenName: string;
  city: string;
  cuisineType: string;
  kitchenImageUrl?: string;
  kitchenDescription?: string;
  streetAddress?: string;
  weeklyMenu?: WeeklyMenu | null;
  averageRating?: number;
  ratingCount?: number;
};

// --- Get Approved Providers (for Customer Home) ---
export const getApprovedProviders = async (): Promise<{ providers: PublicProviderProfile[]; error?: any }> => {
  try {
    const providersRef = collection(db, 'providerProfiles');
    const q = query(providersRef, where('status', '==', 'approved'));
    const querySnapshot = await getDocs(q);
    const providerList: PublicProviderProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.kitchenName && data.city && data.cuisineType) {
        providerList.push({
          id: docSnap.id,
          kitchenName: data.kitchenName,
          city: data.city,
          cuisineType: data.cuisineType,
          kitchenImageUrl: data.kitchenImageUrl,
          // --- THIS IS THE FIX: Map the rating data ---
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
          // ------------------------------------------
        });
      }
    });
    return { providers: providerList };
  } catch (error) {
    console.error("Error fetching approved providers:", error);
    return { providers: [], error };
  }
};

// --- Get Provider Details, Plans, AND Weekly Menu ---
export const getProviderDetailsAndPlans = async (
  providerId: string
): Promise<{
  profile: FullProviderProfile | null;
  plans: Plan[];
  weeklyMenu: WeeklyMenu | null;
  error?: string;
}> => {
  let profile: FullProviderProfile | null = null;
  let plans: Plan[] = [];
  let weeklyMenu: WeeklyMenu | null = null;
  try {
    const providerDocRef = doc(db, "providerProfiles", providerId);
    const providerDoc = await getDoc(providerDocRef);
    if (!providerDoc.exists()) {
      return {
        error: "Provider not found.",
        profile: null,
        plans: [],
        weeklyMenu: null,
      };
    }
    const providerData = providerDoc.data();
    profile = {
      id: providerDoc.id,
      kitchenName: providerData.kitchenName || "N/A",
      city: providerData.city || "N/A",
      cuisineType: providerData.cuisineType || "N/A",
      kitchenImageUrl: providerData.kitchenImageUrl,
      kitchenDescription: providerData.kitchenDescription,
      streetAddress: providerData.streetAddress,
      // --- Map rating here too ---
      averageRating: providerData.averageRating,
      ratingCount: providerData.ratingCount,
      // -------------------------
    };
    const plansRef = collection(db, "providerProfiles", providerId, "plans");
    const plansQuery = query(plansRef, orderBy("createdAt", "desc"));
    const plansSnapshot = await getDocs(plansQuery);
    plansSnapshot.forEach((docSnap) => {
      plans.push({ id: docSnap.id, ...docSnap.data() } as Plan);
    });
    const { menu: fetchedMenu } = await getProviderWeeklyMenu(providerId);
    weeklyMenu = fetchedMenu;
    return { profile, plans, weeklyMenu };
  } catch (error: any) {
    console.error("Error fetching provider details/plans/menu:", error);
    return {
      error: "Failed to load provider details.",
      profile: null,
      plans: [],
      weeklyMenu: null,
    };
  }
};

// --- Subscription Types & Functions ---
export type Subscription = {
  id: string;
  userId: string;
  providerId: string;
  planId: string;
  planName: string;
  planFrequency: "Weekly" | "Monthly";
  startDate: Timestamp;
  endDate: Timestamp;
  status: "active" | "paused" | "cancelled" | "trialing";
  createdAt: Timestamp;
  pricePaid?: number;
  kitchenName?: string;
  customerName?: string;
  pausedUntil?: Timestamp | null;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
};
export const getUserActiveSubscriptions = async (
  userId: string,
): Promise<{ subscriptions: Subscription[] | null; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    const now = Timestamp.now(); // Get current Firestore timestamp

    // Query for active/paused subscriptions where the endDate is in the future
    const conditions = [
      where('userId', '==', userId),
      where('status', 'in', ['active', 'paused']),
      where('endDate', '>=', now) // --- THIS IS THE AUTO-EXPIRY FIX ---
    ];

    const q = query(
      subsRef,
      ...conditions,
      orderBy('endDate', 'asc'), // Show soonest-to-expire first
    );

    console.log(`[getUserActiveSubscriptions] Querying for user ${userId}...`);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`[getUserActiveSubscriptions] No active subscriptions found.`);
      return { subscriptions: [] }; // Return empty array
    }

    // --- Fetch kitchenName for EACH subscription in parallel ---
    const subscriptionPromises = querySnapshot.docs.map(async (docSnap) => {
      let subscriptionData = { id: docSnap.id, ...docSnap.data() } as Subscription;
      
      if (subscriptionData.providerId) {
        try {
            const providerDocRef = doc(db, 'providerProfiles', subscriptionData.providerId);
            const providerDoc = await getDoc(providerDocRef);
            subscriptionData.kitchenName = providerDoc.exists() ? providerDoc.data().kitchenName || 'N/A' : 'N/A';
        } catch (providerError) {
            subscriptionData.kitchenName = 'Error';
        }
      }
      return subscriptionData;
    });

    const subscriptions = await Promise.all(subscriptionPromises);
    
    console.log(`[getUserActiveSubscriptions] Found ${subscriptions.length} active subscriptions.`);
    return { subscriptions };

  } catch (error: any) {
    if (error.code === 'failed-precondition') {
         const indexUrlMatch = error.message.match(/(https:\/\/[^\s]+)/);
         const indexUrl = indexUrlMatch ? indexUrlMatch[0] : 'Check Firebase Console';
         return { subscriptions: null, error: `Database query requires an index. Create it: ${indexUrl}` };
    }
    console.error(`[getUserActiveSubscriptions] Error fetching for user ${userId}:`, error);
    return { subscriptions: null, error: 'Failed to load subscriptions.' };
  }
};
// --- *** END MODIFICATION *** ---

// This function is now only used for the subscription blocking check
export const getActiveSubscriptionForPlan = async (
  userId: string,
  providerId: string,
  planId: string
): Promise<{ subscription: Subscription | null; error?: string }> => {
  try {
    const subsRef = collection(db, 'subscriptions');
    const conditions = [
      where('userId', '==', userId),
      where('status', 'in', ['active', 'paused']),
      where('providerId', '==', providerId),
      where('planId', '==', planId),
    ];
    const q = query( subsRef, ...conditions, limit(1) );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { subscription: null };
    }
    const docSnap = querySnapshot.docs[0];
    return { subscription: { id: docSnap.id, ...docSnap.data() } as Subscription };
    
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
         const indexUrlMatch = error.message.match(/(https:\/\/[^\s]+)/);
         const indexUrl = indexUrlMatch ? indexUrlMatch[0] : 'Check Firebase Console';
         return { subscription: null, error: `Database query requires an index. Create it: ${indexUrl}` };
    }
    console.error(`[getActiveSubscriptionForPlan] Error fetching:`, error);
    return { subscription: null, error: 'Failed to load subscription.' };
  }
};


export const updateSubscriptionStatus = async (
    subscriptionId: string,
    newStatus: 'active' | 'paused',
    pauseEndDate?: Date | null,
    daysPaused?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const subDocRef = doc(db, 'subscriptions', subscriptionId);
    const updateData: any = {
        status: newStatus,
        pausedUntil: pauseEndDate ? Timestamp.fromDate(pauseEndDate) : null,
        updatedAt: serverTimestamp(),
    };
    if (newStatus === 'paused' && daysPaused && daysPaused > 0) {
        const subDoc = await getDoc(subDocRef);
        if (subDoc.exists()) {
            const currentEndDate = (subDoc.data().endDate as Timestamp).toDate();
            const newEndDate = new Date(currentEndDate);
            newEndDate.setDate(currentEndDate.getDate() + daysPaused);
            updateData.endDate = Timestamp.fromDate(newEndDate);
            console.log(`Extended subscription ${subscriptionId} end date by ${daysPaused} days`);
        } else { throw new Error("Subscription document not found."); }
    }
    await updateDoc(subDocRef, updateData);
    console.log(`Subscription ${subscriptionId} status updated to ${newStatus}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating subscription status:", error);
    return { success: false, error: 'Failed to update subscription status.' };
  }
};

// --- Daily Delivery Types & Functions ---
export type DailyDelivery = {
  subscriptionId: string;
  userId: string;
  customerName: string;
  customerAddress: string;
  planName: string;
  mealType: 'Lunch' | 'Dinner' | 'N/A';
};
export const getTodaysDeliveries = async (providerId: string): Promise<{ deliveries: DailyDelivery[]; error?: string }> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const subsRef = collection(db, 'subscriptions');
    const q = query(
      subsRef,
      where('providerId', '==', providerId),
      where('status', '==', 'active'),
      where('endDate', '>=', Timestamp.now()) // --- Auto-expiry fix for provider ---
    );
    const querySnapshot = await getDocs(q);
    const deliveryList: DailyDelivery[] = [];
    const dataFetchPromises: Promise<void>[] = [];
    querySnapshot.forEach((subDoc) => {
      const subData = { id: subDoc.id, ...subDoc.data() } as Subscription;
      const pausedUntilDate = subData.pausedUntil?.toDate();
      if (pausedUntilDate && pausedUntilDate >= today) {
        console.log(`Skipping paused sub: ${subData.id}`);
        return;
      }
      dataFetchPromises.push(
        Promise.all([
          getDoc(doc(db, 'users', subData.userId)),
          getDoc(doc(db, 'providerProfiles', subData.providerId, 'plans', subData.planId))
        ]).then(([userDoc, planDoc]) => {
          const customerName = userDoc.exists() ? (userDoc.data() as UserProfile).name || 'N/A' : 'User Not Found';
          const customerAddress = userDoc.exists() ? (userDoc.data() as UserProfile).address || 'Address not set' : 'N/A';
          const mealType = planDoc.exists() ? (planDoc.data() as Plan).mealType : 'N/A';
          deliveryList.push({
            subscriptionId: subData.id,
            userId: subData.userId,
            customerName: customerName,
            customerAddress: customerAddress,
            planName: subData.planName,
            mealType: mealType,
          });
        }).catch(err => { console.error(`Failed to fetch details for sub ${subData.id}:`, err); })
      );
    });
    await Promise.all(dataFetchPromises);
    console.log(`Found ${deliveryList.length} deliveries for today for provider ${providerId}`);
    deliveryList.sort((a, b) => a.customerName.localeCompare(b.customerName));
    return { deliveries: deliveryList };
  } catch (error: any) {
    console.error(`Error fetching today's deliveries for provider ${providerId}:`, error);
    return { deliveries: [], error: 'Failed to load delivery list.' };
  }
};

// --- Provider Subscription/Earnings Functions ---
export const getProviderSubscriptions = async (
  providerId: string
): Promise<{ subscriptions: Subscription[]; error?: string }> => {
  try {
    const subsRef = collection(db, "subscriptions");
    const q = query(
      subsRef,
      where("providerId", "==", providerId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const subscriptionListPromises = querySnapshot.docs.map(async (docSnap) => {
      let subData = { id: docSnap.id, ...docSnap.data() } as Subscription;
      if (subData.userId) {
        try {
          const userDocRef = doc(db, "users", subData.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            subData.customerName = userDoc.data().name || "N/A";
          } else {
            subData.customerName = "User Not Found";
          }
        } catch (e) {
          console.error("Error fetching customer name for earnings:", e);
          subData.customerName = "N/A";
        }
      }
      return subData;
    });
    const subscriptionList = await Promise.all(subscriptionListPromises);
    console.log(
      `[getProviderSubscriptions] Fetched ${subscriptionList.length} total subscriptions for provider ${providerId}`
    );
    return { subscriptions: subscriptionList };
  } catch (error: any) {
    console.error(`[getProviderSubscriptions] Error fetching:`, error);
    if (error.code === "failed-precondition") {
      const indexUrlMatch = error.message.match(/(https:\/\/[^\s]+)/);
      const indexUrl = indexUrlMatch
        ? indexUrlMatch[0]
        : "Check Firebase Console";
      return {
        subscriptions: [],
        error: `Index required. Create it: ${indexUrl}`,
      };
    }
    return { subscriptions: [], error: "Failed to load subscription history." };
  }
};

// --- Customer Subscription History Function ---
export const getCustomerSubscriptions = async (
  userId: string
): Promise<{ subscriptions: Subscription[]; error?: string }> => {
  try {
    const subsRef = collection(db, "subscriptions");
    const q = query(
      subsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const subscriptionListPromises = querySnapshot.docs.map(async (docSnap) => {
      let subData = { id: docSnap.id, ...docSnap.data() } as Subscription;
      if (subData.providerId) {
        try {
          const providerDocRef = doc(
            db,
            "providerProfiles",
            subData.providerId
          );
          const providerDoc = await getDoc(providerDocRef);
          if (providerDoc.exists()) {
            subData.kitchenName = providerDoc.data().kitchenName || "N/A";
          } else {
            subData.kitchenName = "Unknown Provider";
          }
        } catch (e) {
          console.error("Error fetching provider name for history:", e);
          subData.kitchenName = "N/A";
        }
      }
      return subData;
    });
    const subscriptionList = await Promise.all(subscriptionListPromises);
    console.log(
      `[getCustomerSubscriptions] Fetched ${subscriptionList.length} total subscriptions for user ${userId}`
    );
    return { subscriptions: subscriptionList };
  } catch (error: any) {
    console.error(`[getCustomerSubscriptions] Error fetching:`, error);
    if (error.code === "failed-precondition") {
      const indexUrlMatch = error.message.match(/(https:\/\/[^\s]+)/);
      const indexUrl = indexUrlMatch
        ? indexUrlMatch[0]
        : "Check Firebase Console";
      return {
        subscriptions: [],
        error: `Index required. Create it: ${indexUrl}`,
      };
    }
    return { subscriptions: [], error: "Failed to load subscription history." };
  }
};

// --- Get User Push Token ---
export const getUserPushToken = async (
  userId: string
): Promise<string | null> => {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const token = (userDoc.data() as UserProfile).pushToken;
      if (token) {
        return token;
      }
    }
    console.log(`[Notifications] No push token found for user ${userId}`);
    return null;
  } catch (error) {
    console.error("Error fetching user push token:", error);
    return null;
  }
};

// --- *** ADDED NOTIFICATION FUNCTIONS *** ---

// Type for a single notification document
export type Notification = {
  id: string; // Firestore document ID
  userId: string; // The user who *receives* this notification
  title: string;
  body: string;
  createdAt: Timestamp;
  isRead: boolean;
};

// Function to create a new notification in Firestore
export const createNotification = async (
  userId: string,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!userId) {
    console.error(
      "[Notifications] Cannot create notification: userId is missing."
    );
    return { success: false, error: "User ID missing." };
  }

  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      userId: userId,
      title: title,
      body: body,
      createdAt: serverTimestamp(),
      isRead: false,
    });
    console.log(`[Notifications] Inbox message created for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error("[Notifications] Error creating inbox message:", error);
    return { success: false, error: "Failed to save notification." };
  }
};

// Function to get all notifications for a user
export const getUserNotifications = async (
  userId: string
): Promise<{ notifications: Notification[]; error?: string }> => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const notificationList: Notification[] = [];
    querySnapshot.forEach((docSnap) => {
      notificationList.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as Notification);
    });

    console.log(
      `[Notifications] Fetched ${notificationList.length} inbox messages for user ${userId}`
    );
    return { notifications: notificationList };
  } catch (error: any) {
    console.error(`[Notifications] Error fetching inbox:`, error);
    if (error.code === "failed-precondition") {
      const indexUrlMatch = error.message.match(/(https:\/\/[^\s]+)/);
      const indexUrl = indexUrlMatch
        ? indexUrlMatch[0]
        : "Check Firebase Console";
      return {
        notifications: [],
        error: `Index required. Create it: ${indexUrl}`,
      };
    }
    return { notifications: [], error: "Failed to load notifications." };
  }
};

// Marks all unread notifications for a user as read
export const markNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  if (!userId) return;

  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("isRead", "==", false)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
    console.log(
      `[Notifications] Marked ${querySnapshot.size} notifications as read for user ${userId}`
    );
  } catch (error) {
    console.error(
      "[Notifications] Error marking notifications as read:",
      error
    );
  }
};
// --- *** END NOTIFICATION FUNCTIONS *** ---

// --- *** ADD NEW FOOD REPORT FUNCTIONS *** ---
export type FoodReportData = {
  providerId: string;
  kitchenName: string;
  providerAddress: string;
  providerPhone: string;
  foodDescription: string;
  quantity: string;
  pickupByTime: string;
  status: 'new' | 'handled';
  createdAt: Timestamp;
};

export const createFoodReport = async (
  providerData: Omit<FoodReportData, 'status' | 'createdAt'> // Data from the form
): Promise<{ success: boolean; error?: string }> => {
  if (!providerData.providerId) {
    return { success: false, error: 'Provider ID is missing.' };
  }
  try {
    const reportRef = collection(db, 'foodReports');
    await addDoc(reportRef, {
      ...providerData,
      status: 'new', // Always set to 'new' on creation
      createdAt: serverTimestamp(),
    });
    console.log(`[FoodReport] New report created for provider ${providerData.providerId}`);
    return { success: true };
  } catch (error) {
    console.error('[FoodReport] Error creating report:', error);
    return { success: false, error: 'Failed to submit report.' };
  }
};
// --- *** END NEW FUNCTIONS *** ---