import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fakerEN_IN as faker } from '@faker-js/faker';

// --- CONFIGURATION ---
const APPROVED_PROVIDER_COUNT = 10;
const PENDING_PROVIDER_COUNT = 3; 
const CUSTOMER_COUNT = 20;
const DEFAULT_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin123@gmail.com';
const ADMIN_PASSWORD = 'admin123password';
// ---------------------

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ serviceAccountKey.json not found!');
    process.exit(1);
  }
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
} catch (error) {
  console.error('❌ Init Failed:', error);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

const KITCHEN_IMAGES = [
  "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1610192244261-3f33de3f5507?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1505253758473-96b701d2cd3e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1626132661869-42d95310c70c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
];

const CUISINES = ['North Indian', 'South Indian', 'Gujarati', 'Punjabi', 'Jain', 'Healthy/Diet', 'Bengali', 'Maharashtrian'];
const CITIES = ['Ahmedabad', 'Mumbai', 'Delhi', 'Bangalore', 'Pune'];

const REVIEW_TEXTS = [
    "The food was absolutely delicious and homely!",
    "Great taste, but delivery was a bit late.",
    "Perfect quantity and quality. Highly recommended.",
    "Loved the paneer dish, very authentic.",
    "Good for daily meals, not too spicy.",
    "Amazing service and tasty food.",
    "The rotis were soft and fresh.",
    "A bit oily for my taste, but good flavor.",
    "Best tiffin service I've tried so far.",
    "Value for money meal."
];

// --- HELPER: Add Days to Date ---
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// --- HELPER: Subtract Days from Date ---
function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

// --- DELETE FUNCTION ---
async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  const collections = ['users', 'providerProfiles', 'subscriptions', 'reviews', 'notifications', 'foodReports'];
  for (const key of collections) {
    const batch = db.batch();
    const snapshot = await db.collection(key).listDocuments();
    if (snapshot.length === 0) continue;
    
    console.log(`   - Deleting ${snapshot.length} docs from ${key}`);
    let count = 0;
    for (const doc of snapshot) {
      batch.delete(doc);
      count++;
      if (count >= 400) {
        await batch.commit();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
  }

  console.log('   - Deleting Auth users...');
  try {
    const listUsersResult = await auth.listUsers(1000);
    const uids = listUsersResult.users.map(u => u.uid);
    if (uids.length > 0) await auth.deleteUsers(uids);
  } catch (e) {
    console.log('   - Error deleting users (might be empty):', e);
  }
  console.log('✅ Database cleared.');
}


// --- SEED FUNCTION ---
async function seedDatabase() {
  console.log('🌱 Seeding database...');

  const approvedProviderIds: string[] = [];
  const customerIds: string[] = [];
  // Map: providerId -> Array of { id, frequency, price, name }
  const providerPlans: { [providerId: string]: any[] } = {};

  // 0. Create ADMIN User
  console.log(`   - Creating ADMIN User...`);
  const adminRecord = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, displayName: 'System Admin' });
  await db.collection('users').doc(adminRecord.uid).set({
    uid: adminRecord.uid, email: ADMIN_EMAIL, role: 'admin', createdAt: admin.firestore.FieldValue.serverTimestamp(),
    name: 'System Admin',
  });

  // 1. Create APPROVED Providers
  console.log(`   - Creating ${APPROVED_PROVIDER_COUNT} Approved Providers...`);
  for (let i = 0; i < APPROVED_PROVIDER_COUNT; i++) {
    const email = `provider${i + 1}@tiffly.com`;
    const userRecord = await auth.createUser({ email, password: DEFAULT_PASSWORD, displayName: faker.person.fullName() });
    const uid = userRecord.uid;
    approvedProviderIds.push(uid);

    const kitchenName = `${faker.person.firstName()}'s ${faker.helpers.arrayElement(['Kitchen', 'Rasoi', 'Tiffin', 'Meals'])}`;
    const cuisine = faker.helpers.arrayElement(CUISINES);
    const city = faker.helpers.arrayElement(CITIES);
    const image = KITCHEN_IMAGES[i % KITCHEN_IMAGES.length];

    await db.collection('users').doc(uid).set({
      uid, email, role: 'provider', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      name: userRecord.displayName, address: faker.location.streetAddress(), phoneNumber: faker.phone.number(),
    });

    await db.collection('providerProfiles').doc(uid).set({
      userId: uid, email,
      providerFullName: userRecord.displayName,
      kitchenName: kitchenName,
      kitchenImageUrl: image,
      phoneNumber: faker.phone.number(),
      kitchenDescription: faker.lorem.sentence(),
      streetAddress: faker.location.streetAddress(),
      city: city,
      pincode: faker.location.zipCode(),
      cuisineType: cuisine,
      maxCapacity: '50',
      status: 'approved',
      averageRating: 0,
      ratingCount: 0,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.past()),
    });

    // Menu
    await db.collection('providerProfiles').doc(uid).collection('menuDetails').doc('weeklyMenu').set({
      monday: 'Paneer Butter Masala, Roti, Rice', tuesday: 'Aloo Gobi, Paratha', wednesday: 'Dal Makhani, Jeera Rice',
      thursday: 'Chole Bhature', friday: 'Veg Biryani, Raita', saturday: 'Rajma Chawal', sunday: 'Special Thali',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Plans (Strict 7 day / 30 day logic)
    providerPlans[uid] = [];
    const planConfigs = [
      { name: 'Weekly Lunch', price: 800, freq: 'Weekly', type: 'Lunch' },
      { name: 'Monthly Dinner', price: 3000, freq: 'Monthly', type: 'Dinner' }
    ];
    for (const p of planConfigs) {
      const planRef = await db.collection('providerProfiles').doc(uid).collection('plans').add({
        planName: p.name, price: p.price, frequency: p.freq, mealType: p.type,
        description: 'Standard tiffin service', createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      providerPlans[uid].push({ id: planRef.id, ...p });
    }

    // Notifications
    await db.collection('notifications').add({
      userId: uid,
      title: 'Account Approved! ✅',
      body: `Congratulations, ${userRecord.displayName}! Your kitchen is now active.`,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent({ days: 5 })),
      isRead: faker.datatype.boolean(),
    });
  }

  // 2. Create PENDING Providers
  console.log(`   - Creating ${PENDING_PROVIDER_COUNT} Pending Providers...`);
  for (let i = 0; i < PENDING_PROVIDER_COUNT; i++) {
    const email = `pending${i + 1}@tiffly.com`;
    const userRecord = await auth.createUser({ email, password: DEFAULT_PASSWORD, displayName: faker.person.fullName() });
    const uid = userRecord.uid;

    await db.collection('users').doc(uid).set({
      uid, email, role: 'provider', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      name: userRecord.displayName, address: faker.location.streetAddress(), phoneNumber: faker.phone.number(),
    });

    await db.collection('providerProfiles').doc(uid).set({
      userId: uid, email,
      providerFullName: userRecord.displayName,
      kitchenName: `${faker.person.firstName()}'s New Kitchen`,
      kitchenImageUrl: KITCHEN_IMAGES[(i + 5) % KITCHEN_IMAGES.length],
      phoneNumber: faker.phone.number(),
      kitchenDescription: "I am a new cook looking to join Tiffly.",
      streetAddress: faker.location.streetAddress(),
      city: faker.helpers.arrayElement(CITIES),
      pincode: faker.location.zipCode(),
      cuisineType: faker.helpers.arrayElement(CUISINES),
      maxCapacity: '20',
      status: 'pending_approval',
      averageRating: 0,
      ratingCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 3. Create Customers
  console.log(`   - Creating ${CUSTOMER_COUNT} Customers...`);
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const email = `customer${i + 1}@tiffly.com`;
    const userRecord = await auth.createUser({ email, password: DEFAULT_PASSWORD, displayName: faker.person.fullName() });
    customerIds.push(userRecord.uid);

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid, email, role: 'customer', createdAt: admin.firestore.FieldValue.serverTimestamp(),
      name: userRecord.displayName, address: faker.location.streetAddress(), phoneNumber: faker.phone.number(),
    });

    await db.collection('notifications').add({
      userId: userRecord.uid,
      title: 'Welcome to Tiffly! 👋',
      body: `Hi ${userRecord.displayName}, thanks for joining us. Browse our kitchens now!`,
      createdAt: admin.firestore.Timestamp.fromDate(faker.date.recent({ days: 10 })),
      isRead: true,
    });
  }

  // 4. Create Subscriptions & Reviews (Logic Updated)
  console.log(`   - Generating Subscriptions & Reviews...`);
  for (const customerId of customerIds) {
    const subCount = faker.number.int({ min: 1, max: 3 });
    
    for (let j = 0; j < subCount; j++) {
      const providerId = faker.helpers.arrayElement(approvedProviderIds);
      const plan = faker.helpers.arrayElement(providerPlans[providerId]); // Pick a real plan
      
      const isExpired = faker.datatype.boolean();

      let startDate, endDate, status;
      const durationDays = plan.freq === 'Weekly' ? 7 : 30;

      if (isExpired) {
        // --- EXPIRED LOGIC ---
        // Start date = 60 to 100 days ago
        startDate = subDays(new Date(), faker.number.int({ min: 60, max: 100 }));
        // End date = Start Date + Duration (Result is still in the past)
        endDate = addDays(startDate, durationDays);
        status = 'active'; // Status stays active, logic handles expiry by date
      } else {
        // --- ACTIVE LOGIC ---
        // Start date = 0 to (Duration - 1) days ago
        // e.g. Weekly plan started 2 days ago
        startDate = subDays(new Date(), faker.number.int({ min: 0, max: durationDays - 1 }));
        // End date = Start Date + Duration (Result is in the future)
        endDate = addDays(startDate, durationDays);
        status = 'active';
      }

      await db.collection('subscriptions').add({
        userId: customerId,
        providerId: providerId,
        planId: plan.id,
        planName: plan.name,
        planFrequency: plan.freq,
        pricePaid: plan.price, // Use CORRECT price from plan
        status: status,
        startDate: admin.firestore.Timestamp.fromDate(startDate),
        endDate: admin.firestore.Timestamp.fromDate(endDate),
        createdAt: admin.firestore.Timestamp.fromDate(startDate),
      });

      if (isExpired) {
        await db.collection('reviews').add({
          userId: customerId,
          providerId: providerId,
          rating: faker.number.int({ min: 3, max: 5 }),
          reviewText: faker.helpers.arrayElement(REVIEW_TEXTS),
          createdAt: admin.firestore.Timestamp.fromDate(endDate),
        });
      }
    }
  }

  // 5. Recalculate Provider Ratings
  console.log(`   - Recalculating Provider Ratings...`);
  for (const providerId of approvedProviderIds) {
    const reviewsSnap = await db.collection('reviews').where('providerId', '==', providerId).get();
    let total = 0, count = 0;
    reviewsSnap.forEach(doc => { total += doc.data().rating; count++; });
    if (count > 0) {
      const avg = Math.round((total / count) * 10) / 10;
      await db.collection('providerProfiles').doc(providerId).update({ averageRating: avg, ratingCount: count });
    }
  }
  
  console.log('✅ Seeding Complete!');
  console.log('------------------------------------------------');
  console.log(`👉 ADMIN Login:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`👉 Provider Login: provider1@tiffly.com / ${DEFAULT_PASSWORD}`);
  console.log(`👉 Customer Login: customer1@tiffly.com / ${DEFAULT_PASSWORD}`);
  console.log('------------------------------------------------');
}

// Run
const main = async () => { await clearDatabase(); await seedDatabase(); };
main();