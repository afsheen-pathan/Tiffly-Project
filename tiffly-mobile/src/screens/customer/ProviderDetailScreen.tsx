// src/screens/customer/ProviderDetailScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Linking,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Card,
  Button,
  List,
  Divider,
  useTheme, // Import useTheme
} from "react-native-paper";
import { RouteProp, useRoute } from "@react-navigation/native";
import { HomeStackParamList } from "../../navigation/CustomerTabNavigator";
import {
  getProviderDetailsAndPlans,
  FullProviderProfile,
  Plan,
  updateUserProfile,
  UserProfileDetails,
  UserProfile,
  getUserActiveSubscription,
  WeeklyMenu, // Import WeeklyMenu type
} from "../../services/userService";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import { CustomerDetailsModal } from "../../components/CustomerDetailsModal";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { format } from 'date-fns';

type ProviderDetailScreenRouteProp = RouteProp<
  HomeStackParamList,
  "ProviderDetail"
>;
const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/300x200.png?text=No+Image";

// --- Helper Component for Daily Menu Row ---
const DailyMenuRow = ({ day, menu }: { day: string; menu?: string }) => {
  const theme = useTheme();
  return (
    <View style={styles.menuRow}>
      <Text style={[styles.dayLabel, { color: theme.colors.primary }]}>
        {day.charAt(0).toUpperCase() + day.slice(1)}
      </Text>
      <Text style={styles.menuText}>{menu || 'Menu not set for this day.'}</Text>
    </View>
  );
};
// ----------------------------------------

export const ProviderDetailScreen = () => {
  const route = useRoute<ProviderDetailScreenRouteProp>();
  const { providerId } = route.params;
  const { user } = useAuth();
  const theme = useTheme(); // Get theme for styling

  const [profile, setProfile] = useState<FullProviderProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] =
    useState<Plan | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const {
        profile: fetchedProfile,
        plans: fetchedPlans,
        weeklyMenu: fetchedWeeklyMenu,
        error: fetchError,
      } = await getProviderDetailsAndPlans(providerId);
      
      if (fetchError) {
        setError(typeof fetchError === "string" ? fetchError : "Failed to load details.");
      } else {
        setProfile(fetchedProfile || null);
        setPlans(fetchedPlans || []);
        setWeeklyMenu(fetchedWeeklyMenu || null);
      }
      setLoading(false);
    };
    fetchData();
  }, [providerId]);

  // --- ADDED proceedToCheckout function ---
  const proceedToCheckout = useCallback(
    async (plan: Plan) => {
      if (!user || !plan.id) return;
      // Note: setIsSubscribing is already set in handleSubscribe
      console.log(
        `[${new Date().toISOString()}] Proceeding to checkout for plan: ${
          plan.id
        }`
      );
      try {
        console.log(
          `[${new Date().toISOString()}] Calling backend: ${API_BASE_URL}/create-checkout-session`
        );
        const response = await fetch(
          `${API_BASE_URL}/create-checkout-session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              price: plan.price * 100, // Paise
              planName: plan.planName,
              providerId: providerId,
              planId: plan.id,
              customerId: user.uid,
              frequency: plan.frequency,
            }),
          }
        );
        console.log(
          `[${new Date().toISOString()}] Backend response status: ${
            response.status
          }`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend Error Response Text:", errorText);
            let errorMessage = `Failed to get checkout URL (Status: ${response.status})`;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch { errorMessage = errorText || errorMessage; }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(
          `[${new Date().toISOString()}] Backend response data:`,
          data
        );
        if (!data.checkoutUrl) {
          throw new Error(data.error || `Failed to get checkout URL`);
        }
        const checkoutUrl = data.checkoutUrl;
        console.log(
          `[${new Date().toISOString()}] Received Stripe Checkout URL:`,
          checkoutUrl
        );
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert("Error", `Cannot open Stripe Checkout URL.`);
        }
      } catch (err: any) {
        console.error(
          `[${new Date().toISOString()}] Subscription Error Caught:`,
          err
        );
        Alert.alert("Subscription Failed", err.message || "Could not initiate checkout.");
      } finally {
        setIsSubscribing(null);
        setSelectedPlanForSubscription(null);
      }
    },
    [user, providerId] // Dependencies
  );
  // --- END proceedToCheckout ---

  // --- ADDED handleSubscribe function ---
  const handleSubscribe = async (plan: Plan) => {
    if (!user || !plan.id || isSubscribing) return;

    setSelectedPlanForSubscription(plan);
    setIsSubscribing(plan.id);

    try {
      console.log(
        `Checking for existing sub: User ${user.uid}, Provider ${providerId}, Plan ${plan.id}`
      );
      const { subscription: existingSub, error: subCheckError } =
        await getUserActiveSubscription(
            user.uid,
            providerId,
            plan.id
        );

      if (subCheckError) {
        Alert.alert("Database Error", subCheckError);
        throw new Error(subCheckError);
      }
      if (existingSub) {
        Alert.alert(
          "Already Subscribed",
          `You already have an active or paused subscription for "${plan.planName}" from this provider.`
        );
        setIsSubscribing(null);
        setSelectedPlanForSubscription(null);
        return;
      }
      console.log(
        "No existing subscription for this specific plan found. Proceeding..."
      );

      console.log("Checking user profile details...");
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        if (!userData.name || !userData.address || !userData.phoneNumber) {
          console.log("User details missing, opening modal.");
          setIsDetailsModalVisible(true);
        } else {
          console.log("User details found, proceeding to checkout.");
          await proceedToCheckout(plan);
        }
      } else {
        console.error("User document not found!");
        setIsDetailsModalVisible(true);
      }
    } catch (error: any) {
      console.error("Error during pre-subscribe checks:", error);
      if (!error.message?.includes("Database query requires an index")) {
        Alert.alert(
          "Error",
          error.message || "Could not start subscription process."
        );
      }
      setIsSubscribing(null);
      setSelectedPlanForSubscription(null);
    }
  };
  // --- END handleSubscribe ---

  // --- ADDED handleDetailsSubmit function ---
  const handleDetailsSubmit = async (details: UserProfileDetails) : Promise<{ success: boolean; error?: string }> => {
    if (!user || !selectedPlanForSubscription) {
      return { success: false, error: 'User or Plan context lost.' };
    }
    const result = await updateUserProfile(user.uid, details);
    if (result.success) {
      console.log("User details saved, now proceeding to checkout.");
      proceedToCheckout(selectedPlanForSubscription); // Don't await, let it run
    }
    return result; // Return result of the profile update
  };
  // --- END handleDetailsSubmit ---


  // --- Rendering ---
  if (loading) { return <ActivityIndicator animating={true} style={styles.loader} size="large" />; }
  if (error) { return <Text style={styles.errorText}>{error}</Text>; }
  if (!profile) { return <Text style={styles.errorText}>Provider details not found.</Text>; }

  return (
    <>
      <ScrollView style={styles.container}>
        <Image
          source={{ uri: profile.kitchenImageUrl || PLACEHOLDER_IMAGE }}
          style={styles.headerImage}
        />
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.kitchenName}>
              {profile.kitchenName}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Cuisine:</Text>{" "}
              {profile.cuisineType}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Location:</Text>{" "}
              {profile.streetAddress}, {profile.city}
            </Text>
            {profile.kitchenDescription && (
              <Text style={styles.description}>
                {profile.kitchenDescription}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* --- Weekly Menu Section --- */}
        <Text variant="titleLarge" style={styles.plansHeader}>
          This Week's Menu
        </Text>
        <Card style={styles.menuCard}>
          <Card.Content>
            {weeklyMenu ? (
              <>
                <DailyMenuRow day="Monday" menu={weeklyMenu.monday} />
                <DailyMenuRow day="Tuesday" menu={weeklyMenu.tuesday} />
                <DailyMenuRow day="Wednesday" menu={weeklyMenu.wednesday} />
                <DailyMenuRow day="Thursday" menu={weeklyMenu.thursday} />
                <DailyMenuRow day="Friday" menu={weeklyMenu.friday} />
                <DailyMenuRow day="Saturday" menu={weeklyMenu.saturday} />
                <DailyMenuRow day="Sunday" menu={weeklyMenu.sunday} />
              </>
            ) : (
              <Text style={styles.noMenuText}>
                This provider hasn't set their weekly menu yet.
              </Text>
            )}
          </Card.Content>
        </Card>
        {/* --- END Weekly Menu Section --- */}


        <Text variant="titleLarge" style={styles.plansHeader}>
          Available Subscription Plans
        </Text>
        {plans.length === 0 ? (
          <Text style={styles.noPlansText}>This provider hasn't added any plans yet.</Text>
        ) : (
          <List.Section style={styles.listSection}>
            {plans.map((plan, index) => (
              <React.Fragment key={plan.id}>
                <List.Item
                  title={plan.planName}
                  description={`₹${plan.price} / ${plan.frequency} - ${
                    plan.mealType
                  }\n${plan.description || ""}`}
                  titleStyle={styles.planTitle}
                  descriptionStyle={styles.planDescription}
                  descriptionNumberOfLines={3}
                  right={() => (
                    <Button
                      mode="contained"
                      onPress={() => handleSubscribe(plan)}
                      loading={isSubscribing === plan.id}
                      disabled={!!isSubscribing}
                      style={styles.subscribeButton}
                      labelStyle={styles.subscribeButtonLabel}
                    >
                      {isSubscribing === plan.id ? "" : "Subscribe"}
                    </Button>
                  )}
                  style={styles.listItem}
                />
                {index < plans.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List.Section>
        )}
      </ScrollView>

      {/* --- Render the Modal --- */}
      <CustomerDetailsModal
        visible={isDetailsModalVisible}
        onDismiss={() => {
          setIsDetailsModalVisible(false);
          setIsSubscribing(null);
          setSelectedPlanForSubscription(null);
        }}
        onSubmit={handleDetailsSubmit}
      />
    </>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { textAlign: "center", marginTop: 50, color: "red", fontSize: 16 },
  headerImage: { width: "100%", height: 200 },
  card: { margin: 12, marginTop: -40, elevation: 4 },
  kitchenName: { fontWeight: "bold", marginBottom: 8 },
  detailText: { fontSize: 14, color: "#333", marginBottom: 4 },
  detailLabel: { fontWeight: "bold", color: "#555" },
  description: { marginTop: 10, fontSize: 14, color: "#666", lineHeight: 20 },
  plansHeader: {
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 16,
    fontWeight: "bold",
  },
  noPlansText: { textAlign: "center", color: "gray", marginVertical: 20, paddingHorizontal: 12 },
  noMenuText: { textAlign: "center", color: "gray", padding: 10 },
  listSection: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 8,
    elevation: 1,
  },
  listItem: { paddingVertical: 8 },
  planTitle: { fontWeight: "bold", marginBottom: 4 },
  planDescription: { fontSize: 13, color: "gray" },
  subscribeButton: { alignSelf: "center", marginRight: 8 },
  subscribeButtonLabel: { fontSize: 12 },
  menuCard: {
    marginHorizontal: 12,
    elevation: 1,
    marginBottom: 10, // Add margin
  },
  menuRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    width: 90,
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
});