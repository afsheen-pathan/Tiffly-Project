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
  useTheme,
} from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { HomeStackParamList } from "../../navigation/CustomerTabNavigator";
import {
  getProviderDetailsAndPlans,
  FullProviderProfile,
  Plan,
  updateUserProfile,
  UserProfileDetails,
  UserProfile,
  // --- 1. Import the CORRECT function ---
  getActiveSubscriptionForPlan, 
  WeeklyMenu,
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
  const theme = useTheme();

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

  // --- proceedToCheckout function ---
  const proceedToCheckout = useCallback(
    async (plan: Plan) => {
      if (!user || !plan.id) return;
      setIsSubscribing(plan.id);
      console.log(`[${new Date().toISOString()}] Proceeding to checkout for plan: ${plan.id}`);
      try {
        console.log(`[${new Date().toISOString()}] Calling backend: ${API_BASE_URL}/create-checkout-session`);
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
        console.log(`[${new Date().toISOString()}] Backend response status: ${response.status}`);

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
        console.log(`[${new Date().toISOString()}] Backend response data:`, data);
        if (!data.checkoutUrl) {
          throw new Error(data.error || `Failed to get checkout URL`);
        }
        const checkoutUrl = data.checkoutUrl;
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
        } else {
          Alert.alert("Error", `Cannot open Stripe Checkout URL.`);
        }
      } catch (err: any) {
        console.error(`[${new Date().toISOString()}] Subscription Error Caught:`, err);
        Alert.alert("Subscription Failed", err.message || "Could not initiate checkout.");
      } finally {
        setIsSubscribing(null);
        setSelectedPlanForSubscription(null);
      }
    },
    [user, providerId]
  );

  // --- handleSubscribe function ---
  const handleSubscribe = async (plan: Plan) => {
    if (!user || !plan.id || isSubscribing) return;

    setSelectedPlanForSubscription(plan);
    setIsSubscribing(plan.id);

    try {
      console.log(
        `Checking for existing sub: User ${user.uid}, Provider ${providerId}, Plan ${plan.id}`
      );
      // --- 2. FIX: Call the new, correct function ---
      const { subscription: existingSub, error: subCheckError } =
        await getActiveSubscriptionForPlan(
            user.uid,
            providerId,
            plan.id
        );
      // --- END FIX ---

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

  // --- handleDetailsSubmit function ---
  const handleDetailsSubmit = async (details: UserProfileDetails) : Promise<{ success: boolean; error?: string }> => {
    if (!user || !selectedPlanForSubscription) {
      return { success: false, error: 'User or Plan context lost.' };
    }
    const result = await updateUserProfile(user.uid, details);
    if (result.success) {
      console.log("User details saved, now proceeding to checkout.");
      proceedToCheckout(selectedPlanForSubscription);
    }
    return result;
  };

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
            <View style={styles.badgeRow}>
  <View style={styles.badge}>
    <MaterialIcons name="restaurant-menu" size={16} color="#e53935" />
    <Text style={styles.badgeText}>{profile.cuisineType}</Text>
  </View>

  <View style={styles.badge}>
    <MaterialIcons name="location-pin" size={16} color="#e53935" />
    <Text style={styles.badgeText}>{profile.city}</Text>
  </View>
</View>

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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    textAlign: "center",
    marginTop: 40,
    color: "red",
    fontSize: 16,
  },

  headerImage: {
    width: "100%",
    height: 250,
  },

  /* ------------------------------
      PROVIDER INFO CARD (Premium)
  ------------------------------ */
  card: {
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 7,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  kitchenName: {
    fontWeight: "800",
    fontSize: 24,
    color: "#1A1A1A",
    marginBottom: 12,
  },

  // Premium badges (Cuisine + Location)
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 4,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 6,
  },

  badgeIcon: {
    marginRight: 4,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e53935",
  },

  // Premium rating badge (Orange gradient)
  ratingContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#ff6c43ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  ratingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 4,
  },

  detailText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
  },

  detailLabel: {
    fontWeight: "bold",
    color: "#666",
  },

  description: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  plansHeader: {
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 18,
    fontWeight: "bold",
    fontSize: 20,
    color: "#222",
  },

  /* ------------------------------
          WEEKLY MENU CARD
  ------------------------------ */
  menuCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 3,
    marginBottom: 18,
    paddingBottom: 6,
  },

  menuRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-start",
  },

  dayLabel: {
    fontSize: 15,
    fontWeight: "700",
    width: 90,
    color: "#FF7043",
  },

  menuText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    lineHeight: 20,
  },

  noMenuText: {
    textAlign: "center",
    padding: 10,
    color: "gray",
  },

  /* ------------------------------
              PLANS LIST
  ------------------------------ */
  listSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 22,
    borderRadius: 14,
    elevation: 2,
  },

  listItem: {
    paddingVertical: 14,
    paddingRight: 0,
  },

  planTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#222",
    flexShrink: 1,
    flexWrap: "wrap",
  },

  planDescription: {
    fontSize: 13,
    color: "#666",
    flexWrap: "wrap",
    lineHeight: 19,
    marginTop: 6,
  },

  noPlansText: {
    textAlign: "center",
    color: "gray",
    marginVertical: 20,
  },

  /* ------------------------------
           SUBSCRIBE BUTTON
  ------------------------------ */
  subscribeButton: {
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 16,
    alignSelf: "center",
    marginRight: 10,
  },

  subscribeButtonLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textTransform: "none",
  },
});

