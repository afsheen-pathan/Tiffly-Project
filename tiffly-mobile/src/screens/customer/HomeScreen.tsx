// src/screens/customer/HomeScreen.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  ActivityIndicator,
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  useTheme,
} from "react-native-paper";
import {
  getApprovedProviders,
  PublicProviderProfile,
} from "../../services/userService";
import { StackNavigationProp } from "@react-navigation/stack";
import { HomeStackParamList } from "../../navigation/CustomerTabNavigator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AddressBar } from "../../components/AddressBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
type HomeScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  "ProviderList"
>;

// --- Updated ProviderCard ---
const ProviderCard = ({
  provider,
  onPress,
}: {
  provider: PublicProviderProfile;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const rating = provider.averageRating
    ? provider.averageRating.toFixed(1)
    : "New";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Card style={styles.card} elevation={2}>
        <Card.Cover
          source={{
            uri:
              provider.kitchenImageUrl ||
              "https://via.placeholder.com/700x400.png?text=No+Image",
          }}
          style={styles.cardImage}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Title style={styles.cardTitle} numberOfLines={1}>
              {provider.kitchenName}
            </Title>
            {/* --- Rating Badge --- */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>{rating}</Text>
              {/* Update this line */}
              <MaterialCommunityIcons
                name="star"
                size={14}
                color="white"
                style={{ marginLeft: 2 }}
              />
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Chip
              icon="map-marker-outline"
              mode="outlined"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {provider.city}
            </Chip>
            <Chip
              icon="silverware-fork-knife"
              mode="outlined"
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {provider.cuisineType}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [providers, setProviders] = useState<PublicProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { providers: fetchedProviders, error: fetchError } =
      await getApprovedProviders();
    if (fetchError) {
      setError("Failed to load providers.");
    } else {
      setProviders(fetchedProviders || []);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProviders();
    }, [fetchProviders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProviders().then(() => setRefreshing(false));
  }, [fetchProviders]);

  // --- Search Filtering ---
  const filteredProviders = useMemo(() => {
    if (!searchQuery) {
      return providers;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return providers.filter(
      (provider) =>
        provider.kitchenName.toLowerCase().includes(lowerCaseQuery) ||
        provider.cuisineType.toLowerCase().includes(lowerCaseQuery) ||
        provider.city.toLowerCase().includes(lowerCaseQuery)
    );
  }, [providers, searchQuery]);

  // --- Navigation ---
  const handleCardPress = (provider: PublicProviderProfile) => {
    navigation.navigate("ProviderDetail", {
      providerId: provider.id,
      kitchenName: provider.kitchenName,
    });
  };

  // Render item for FlatList
  const renderProviderCard = ({ item }: { item: PublicProviderProfile }) => (
    <ProviderCard provider={item} onPress={() => handleCardPress(item)} />
  );

  // --- Render ---
  return (
    <View style={styles.container}>
      <AddressBar />

      <FlatList
        data={filteredProviders}
        renderItem={renderProviderCard}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <Searchbar
              placeholder="Search by kitchen, cuisine, or city..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={{ color: "#222" }}
              placeholderTextColor="#888"
              iconColor="#e53935" // icon color
              rippleColor="rgba(255,87,34,0.2)"
              selectionColor="#e53935" // text highlight
              cursorColor="#e53935" // input cursor
              theme={{
                colors: {
                  primary: "#e53935", // active outline color
                },
              }}
            />

            <Text variant="titleMedium" style={styles.listHeader}>
              Available Kitchens
            </Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              animating={true}
              style={styles.loader}
              size="large"
            />
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No approved providers found.</Text>
              {searchQuery ? (
                <Text style={styles.emptySubText}>
                  Try adjusting your search.
                </Text>
              ) : null}
            </View>
          )
        }
      />
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
    paddingTop: 4,
  },

  // ⭐ Searchbar (Premium)
  searchbar: {
    marginHorizontal: 8,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: "#F2F2F2",
  },

  listHeader: {
    paddingHorizontal: 12,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 20,
    color: "#222",
  },

  // ⭐ Provider Card
  card: {
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },

  // Beautiful header image
  cardImage: {
    height: 170,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  cardContent: {
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 10,
  },

  // ⭐ Title Row
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1A1A1A",
    flexShrink: 1,
    flex: 1,
    letterSpacing: 0.2,
    marginRight: 10,

    // soft shadow glow (premium)
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // ⭐ Rating Badge - Premium pill style
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 18,
    minWidth: 48,
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#e53935",
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  ratingText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginRight: 3,
  },

  // ⭐ Chips (city + cuisine)
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  chip: {
    marginRight: 6,
    marginBottom: 6,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#FFF5F0",
    borderColor: "#FFCCBC",
    borderWidth: 1,
    alignItems: "center",
  },

  chipText: {
    fontSize: 12,
    color: "#e53935",
    fontWeight: "600",
  },

  loader: {
    marginTop: 60,
  },

  emptyContainer: {
    flex: 1,
    paddingTop: 120,
    alignItems: "center",
  },

  errorText: {
    fontSize: 16,
    color: "#E53935",
  },

  emptyText: {
    fontSize: 16,
    color: "gray",
  },

  emptySubText: {
    fontSize: 14,
    color: "lightgray",
    marginTop: 8,
  },
});
