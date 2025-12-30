// src/screens/provider/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, Button, List, Divider, Avatar, ActivityIndicator, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../../navigation/ProviderTabNavigator';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '../../services/imageService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ProfileScreenNavigationProp = StackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const theme = useTheme();

  const [kitchenName, setKitchenName] = useState('');
  const [kitchenImage, setKitchenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch Provider Profile Data
  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'providerProfiles', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setKitchenName(data.kitchenName || '');
        setKitchenImage(data.kitchenImageUrl || null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  // Handle Image Change
  const handleEditImage = async () => {
    // 1. Request Permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to change the kitchen image.");
      return;
    }

    // 2. Pick Image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadNewImage(result.assets[0].uri);
    }
  };

  // Upload and Save to Firestore
  const uploadNewImage = async (uri: string) => {
    if (!user) return;
    setUploading(true);
    try {
      // Upload to Cloudinary
      const newImageUrl = await uploadImageAsync(uri);
      
      if (newImageUrl) {
        // Update Firestore
        const docRef = doc(db, 'providerProfiles', user.uid);
        await updateDoc(docRef, { kitchenImageUrl: newImageUrl });
        
        // Update Local State
        setKitchenImage(newImageUrl);
        Alert.alert("Success", "Kitchen image updated successfully!");
      } else {
        Alert.alert("Error", "Failed to upload image.");
      }
    } catch (error) {
      console.error("Error updating image:", error);
      Alert.alert("Error", "Could not update profile image.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        
        {/* Editable Image Container */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handleEditImage} disabled={uploading} activeOpacity={0.7}>
            {uploading ? (
              <View style={[styles.avatarImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
                <ActivityIndicator size="small" />
              </View>
            ) : kitchenImage ? (
              <Image source={{ uri: kitchenImage }} style={styles.avatarImage} />
            ) : (
              <Avatar.Icon size={100} icon="chef-hat" style={{ backgroundColor: theme.colors.primary }} />
            )}
            
            {/* Edit Badge Icon */}
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <Icon name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Kitchen Name */}
        <Text variant="headlineSmall" style={styles.kitchenNameText}>
          {kitchenName || "Your Kitchen"}
        </Text>
        
        {/* Email */}
        <Text style={styles.emailText}>{user?.email}</Text>
        
        <Text style={styles.statusText}>(Approved Provider)</Text>
      </View>

      {/* List items */}
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        
        <List.Item
          title="My Earnings"
          description="View your transaction history"
          left={() => <List.Icon icon="cash-multiple" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('Earnings')}
          style={styles.listItem}
        />
        
        <List.Item
          title="Account Settings"
          description="Update your name, address, or phone"
          left={() => <List.Icon icon="account-edit-outline" />}
          right={() => <List.Icon icon="chevron-right" />}
          onPress={() => navigation.navigate('AccountSettings')}
          style={styles.listItem}
        />
      </List.Section>
      
      <Divider style={styles.divider} />

      <Button
        mode="contained"
        onPress={signOut}
        icon="logout"
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
      >
        Logout
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingVertical: 30,
    alignItems: "center",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 3,
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  kitchenNameText: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: "#666",
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "green",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
    paddingVertical: 4,
    elevation: 1,
  },
  divider: {
    height: 20,
    backgroundColor: "transparent",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    paddingVertical: 6,
    elevation: 2,
  },
});