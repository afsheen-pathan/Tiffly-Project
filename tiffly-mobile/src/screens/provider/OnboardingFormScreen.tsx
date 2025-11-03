// src/screens/provider/OnboardingFormScreen.tsx

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import {
  Button,
  Text,
  TextInput,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../../contexts/AuthContext";
import { uploadImageToCloudinary } from "../../services/imageService";
import {
  updateProviderProfile,
  ProviderProfileData,
} from "../../services/userService";

// 1. --- DEFINE THE VALIDATION SCHEMA ---
const profileSchema = z.object({
  providerFullName: z.string().min(3, "Full name is required"),
  kitchenName: z.string().min(3, "Kitchen name is required"),
  kitchenImageUrl: z.string().url("Image is required"), // We'll validate this
  phoneNumber: z.string().min(10, "A valid phone number is required"),
  kitchenDescription: z
    .string()
    .min(20, "Description must be at least 20 characters"),
  streetAddress: z.string().min(5, "Address is required"),
  city: z.string().min(3, "City is required"),
  pincode: z.string().length(6, "Must be a 6-digit pincode"),
  cuisineType: z.string().min(1, "Please select a cuisine type"),
  maxCapacity: z.string().min(1, "Please select a capacity"),
  fssaiLicenseNumber: z.string().optional(),
});

type Props = {
  onProfileSubmit: () => void; // This is the refetch function
};

export const OnboardingFormScreen = ({ onProfileSubmit }: Props) => {
  const { user } = useAuth(); // To get the user's ID
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // 2. --- SETUP REACT HOOK FORM ---
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProviderProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      providerFullName: "",
      kitchenName: "",
      kitchenImageUrl: "",
      phoneNumber: "",
      kitchenDescription: "",
      streetAddress: "",
      city: "",
      pincode: "",
      cuisineType: "",
      maxCapacity: "",
      fssaiLicenseNumber: "",
    },
  });

  // Watch the image URL field to show a preview
  const imageUrl = watch("kitchenImageUrl");

  // 3. --- IMAGE UPLOAD HANDLER ---
  const onImageUpload = async () => {
    setImageUploading(true);
    const url = await uploadImageToCloudinary(); // Our function from imageService
    setImageUploading(false);

    if (url) {
      // Set the value in the form and trigger validation
      setValue("kitchenImageUrl", url, { shouldValidate: true });
    }
  };

  // 4. --- FORM SUBMIT HANDLER ---
  const onSubmit = async (data: ProviderProfileData) => {
    if (!user) return;
    setLoading(true);

    const { success } = await updateProviderProfile(user.uid, data);

    setLoading(false);
    if (success) {
      // 3. CALL THE REFETCH FUNCTION!
      onProfileSubmit();
      // This refetches the user's role, AppNavigator re-renders,
      // sees the status is 'pending_approval', and automatically
      // shows the new PendingProviderTabNavigator.
    } else {
      alert("Error: Could not submit your profile. Please try again.");
    }
  };

  // Helper for Picker styling
  const pickerWrapperStyle = {
    borderWidth: 1,
    borderColor: errors.cuisineType ? theme.colors.error : "gray",
    borderRadius: 4,
    marginBottom: 8,
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Complete Your Profile
      </Text>
      <Text style={styles.subtitle}>
        This information will be reviewed by our team before approval.
      </Text>

      {/* --- RENDER ALL 11 FORM FIELDS --- */}

      <Controller
        name="providerFullName"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Your Full Legal Name (Private)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.providerFullName}
            style={styles.input}
          />
        )}
      />
      {errors.providerFullName && (
        <Text style={styles.errorText}>{errors.providerFullName.message}</Text>
      )}

      <Controller
        name="kitchenName"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Kitchen Name (Public)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.kitchenName}
            style={styles.input}
          />
        )}
      />
      {errors.kitchenName && (
        <Text style={styles.errorText}>{errors.kitchenName.message}</Text>
      )}

      {/* --- Image Uploader --- */}
      <Button
        icon="camera"
        mode="outlined"
        onPress={onImageUpload}
        loading={imageUploading}
        disabled={imageUploading}
        style={styles.input}
      >
        {imageUrl ? "Change Kitchen Photo" : "Upload Kitchen Photo"}
      </Button>
      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
      )}
      {errors.kitchenImageUrl && (
        <Text style={styles.errorText}>{errors.kitchenImageUrl.message}</Text>
      )}

      <Controller
        name="phoneNumber"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Contact Phone Number (Private)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.phoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
          />
        )}
      />
      {errors.phoneNumber && (
        <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
      )}

      <Controller
        name="kitchenDescription"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Kitchen Description (Public)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.kitchenDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        )}
      />
      {errors.kitchenDescription && (
        <Text style={styles.errorText}>
          {errors.kitchenDescription.message}
        </Text>
      )}

      <Controller
        name="streetAddress"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Street Address"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.streetAddress}
            style={styles.input}
          />
        )}
      />
      {errors.streetAddress && (
        <Text style={styles.errorText}>{errors.streetAddress.message}</Text>
      )}

      <Controller
        name="city"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="City"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.city}
            style={styles.input}
          />
        )}
      />
      {errors.city && (
        <Text style={styles.errorText}>{errors.city.message}</Text>
      )}

      <Controller
        name="pincode"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Pincode"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.pincode}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
        )}
      />
      {errors.pincode && (
        <Text style={styles.errorText}>{errors.pincode.message}</Text>
      )}

      {/* --- Cuisine Type Picker --- */}
      <Controller
        name="cuisineType"
        control={control}
        render={({ field: { onChange, value } }) => (
          <View style={pickerWrapperStyle}>
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={{ height: 50 }}
            >
              <Picker.Item label="Select Cuisine Type..." value="" />
              <Picker.Item label="North Indian" value="North Indian" />
              <Picker.Item label="South Indian" value="South Indian" />
              <Picker.Item label="Gujarati" value="Gujarati" />
              <Picker.Item label="Jain" value="Jain" />
              <Picker.Item label="Continental" value="Continental" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        )}
      />
      {errors.cuisineType && (
        <Text style={styles.errorText}>{errors.cuisineType.message}</Text>
      )}

      {/* --- Max Capacity Picker --- */}
      <Controller
        name="maxCapacity"
        control={control}
        render={({ field: { onChange, value } }) => (
          <View style={pickerWrapperStyle}>
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={{ height: 50 }}
            >
              <Picker.Item label="Select Max Capacity..." value="" />
              <Picker.Item label="10-20 customers" value="10-20" />
              <Picker.Item label="20-50 customers" value="20-50" />
              <Picker.Item label="50+ customers" value="50+" />
            </Picker>
          </View>
        )}
      />
      {errors.maxCapacity && (
        <Text style={styles.errorText}>{errors.maxCapacity.message}</Text>
      )}

      <Controller
        name="fssaiLicenseNumber"
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="FSSAI License (Optional)"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.fssaiLicenseNumber}
            style={styles.input}
          />
        )}
      />
      {errors.fssaiLicenseNumber && (
        <Text style={styles.errorText}>
          {errors.fssaiLicenseNumber.message}
        </Text>
      )}

      {/* --- SUBMIT BUTTON --- */}
      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        disabled={loading || imageUploading}
        loading={loading}
        style={styles.button}
      >
        Submit for Approval
      </Button>
    </ScrollView>
  );
};

// 5. --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    marginBottom: 8,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
    paddingVertical: 4,
    marginBottom: 40,
  },
  errorText: {
    color: "red",
    alignSelf: "flex-start",
    marginLeft: 4,
    marginBottom: 8,
  },
});
