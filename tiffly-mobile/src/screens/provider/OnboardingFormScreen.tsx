import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
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

// Validation Schema
const profileSchema = z.object({
  providerFullName: z.string().min(3, "Full name is required"),
  kitchenName: z.string().min(3, "Kitchen name is required"),
  kitchenImageUrl: z.string().url("Image is required"),
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
  onProfileSubmit: () => void;
};

export const OnboardingFormScreen = ({ onProfileSubmit }: Props) => {
  const { user } = useAuth();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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

  const imageUrl = watch("kitchenImageUrl");

  // Upload Image Handler
  const onImageUpload = async () => {
    setImageUploading(true);
    const url = await uploadImageToCloudinary();
    setImageUploading(false);

    if (url) {
      setValue("kitchenImageUrl", url, { shouldValidate: true });
    }
  };

  // Form Submit Handler
  const onSubmit = async (data: ProviderProfileData) => {
    if (!user) return;

    setLoading(true);
    const { success } = await updateProviderProfile(user.uid, data);

    setLoading(false);

    if (success) {
      onProfileSubmit();
    } else {
      alert("Error: Could not submit your profile. Please try again.");
    }
  };

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

      {/* Full Name */}
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

      {/* Kitchen Name */}
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

      {/* Image Upload */}
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

      {/* Phone Number */}
      <Controller
        name="phoneNumber"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Contact Phone Number (Private)"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={!!errors.phoneNumber}
            keyboardType="phone-pad"
            style={styles.input}
          />
        )}
      />
      {errors.phoneNumber && (
        <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
      )}

      {/* Description */}
      <Controller
        name="kitchenDescription"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Kitchen Description (Public)"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
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

      {/* Address */}
      <Controller
        name="streetAddress"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Street Address"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={!!errors.streetAddress}
            style={styles.input}
          />
        )}
      />
      {errors.streetAddress && (
        <Text style={styles.errorText}>{errors.streetAddress.message}</Text>
      )}

      {/* City */}
      <Controller
        name="city"
        control={control}
        render={({ field }) => (
          <TextInput
            label="City"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={!!errors.city}
            style={styles.input}
          />
        )}
      />
      {errors.city && (
        <Text style={styles.errorText}>{errors.city.message}</Text>
      )}

      {/* Pincode */}
      <Controller
        name="pincode"
        control={control}
        render={({ field }) => (
          <TextInput
            label="Pincode"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
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

      {/* Cuisine Type */}
      <Controller
        name="cuisineType"
        control={control}
        render={({ field }) => (
          <View style={pickerWrapperStyle}>
            <Picker selectedValue={field.value} onValueChange={field.onChange}>
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

      {/* Max Capacity */}
      <Controller
        name="maxCapacity"
        control={control}
        render={({ field }) => (
          <View style={pickerWrapperStyle}>
            <Picker selectedValue={field.value} onValueChange={field.onChange}>
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

      {/* FSSAI Optional */}
      <Controller
        name="fssaiLicenseNumber"
        control={control}
        render={({ field }) => (
          <TextInput
            label="FSSAI License (Optional)"
            value={field.value}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            error={!!errors.fssaiLicenseNumber}
            style={styles.input}
          />
        )}
      />

      {/* Submit */}
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fafafa" },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: "#e53935",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 22,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 1,
  },
  imagePreview: {
    width: "100%",
    height: 190,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#e53935",
  },
  errorText: { color: "#e53935", fontSize: 12, marginLeft: 4, marginBottom: 8 },
  button: {
    marginTop: 22,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#e53935",
  },
});
