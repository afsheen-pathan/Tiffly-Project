// src/services/imageService.ts

import * as ImagePicker from 'expo-image-picker';

// --- IMPORTANT: UPDATE THESE VALUES ---
const CLOUD_NAME = 'afshinpathan';
const UPLOAD_PRESET = 'tiffly_main';
// ------------------------------------

export const uploadImageToCloudinary = async () => {
  // 1. Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
    return null;
  }

  // 2. Launch image picker
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3], // Standard aspect ratio for a kitchen photo
    quality: 0.7,   // Compress image to 70% quality
  });

  if (result.canceled || !result.assets || !result.assets[0]) {
    // User cancelled the picker
    return null;
  }

  // 3. Prepare the upload
  const asset = result.assets[0];
  const data = new FormData();
  
  // We need to create a special URI for file upload
  const uriParts = asset.uri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  
  const file = {
    uri: asset.uri,
    type: `image/${fileType}`,
    name: `upload.${fileType}`,
  } as any; // Use 'as any' to avoid FormData type issues
  
  data.append('file', file);
  data.append('upload_preset', UPLOAD_PRESET);
  data.append('cloud_name', CLOUD_NAME);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  try {
    // 4. Upload the image
    const response = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const jsonResponse = await response.json();
    
    if (jsonResponse.secure_url) {
      // 5. Return the secure URL
      return jsonResponse.secure_url as string;
    } else {
      console.error('Cloudinary upload error:', jsonResponse);
      return null;
    }
  } catch (err) {
    console.error('Error uploading image:', err);
    return null;
  }
};