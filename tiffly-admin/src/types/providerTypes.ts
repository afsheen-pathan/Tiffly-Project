// src/types/providerTypes.ts
import { Timestamp } from 'firebase/firestore';

// Define the full provider profile data type
export type FullProviderProfileData = {
  id: string; // This is the doc ID, which is the User ID
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
  status: string;
  createdAt?: Timestamp; // Make optional if some docs might not have it
  // Add any other fields that are part of the document
};