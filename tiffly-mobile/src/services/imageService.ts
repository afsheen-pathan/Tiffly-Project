// src/services/imageService.ts

import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = "afshinpathan";
const CLOUDINARY_UPLOAD_PRESET = "tiffly_main";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Upload raw file URI → Cloudinary
export const uploadImageAsync = async (uri: string): Promise<string | null> => {
  if (!uri) return null;

  const uriParts = uri.split(".");
  const fileType = uriParts[uriParts.length - 1];

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `upload.${fileType}`,
    type: `image/${fileType}`,
  } as any);

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Cloudinary Error:", err);
      return null;
    }

    const data = await response.json();
    return data.secure_url || null;
  } catch (error) {
    console.error("Upload exception:", error);
    Alert.alert("Upload Failed", "Could not upload image.");
    return null;
  }
};

// Pick Image → Upload to Cloudinary
export const uploadImageToCloudinary = async (): Promise<string | null> => {
  try {
    // Ask permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Needed", "Allow gallery access to upload images.");
      return null;
    }

    // Open Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return null;

    const uri = result.assets[0].uri;
    if (!uri) return null;

    // Upload to Cloudinary
    return await uploadImageAsync(uri);
  } catch (err) {
    console.error("Picker/Upload error:", err);
    return null;
  }
};
