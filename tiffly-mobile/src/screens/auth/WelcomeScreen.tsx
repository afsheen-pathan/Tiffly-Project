import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=1970';
const { height } = Dimensions.get('window');

export const WelcomeScreen = ({ navigation }: Props) => (
  <View style={styles.container}>
    <ImageBackground source={{ uri: PLACEHOLDER_IMAGE }} resizeMode="cover" style={styles.imageBackground}>
      <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.contentContainer}>
        <Text variant="displayMedium" style={styles.title}>Homemade Food,</Text>
        <Text variant="displayMedium" style={[styles.title, styles.titleHighlight]}>Delivered Daily.</Text>
        <Text style={styles.subtitle}>Enjoy fresh meals from verified home kitchens every day.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button mode="contained" onPress={() => navigation.navigate('Login')} style={styles.button} labelStyle={styles.buttonLabel}>
          Sign In
        </Button>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>
            Don’t have an account? <Text style={styles.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageBackground: { flex: 1, height, justifyContent: 'space-between', padding: 20 },
  contentContainer: { flex: 1, justifyContent: 'center', marginTop: '30%' },
  title: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  titleHighlight: { color: '#9EF0A3' },
  subtitle: { color: '#fff', textAlign: 'center', fontSize: 16, marginTop: 16, paddingHorizontal: 20 },
  buttonContainer: { paddingBottom: 50 },
  button: { borderRadius: 30, paddingVertical: 10 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
  link: { marginTop: 16, textAlign: 'center', color: '#fff', fontSize: 15 },
  linkBold: { fontWeight: 'bold', textDecorationLine: 'underline' },
});
