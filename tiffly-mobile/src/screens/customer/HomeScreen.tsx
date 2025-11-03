// src/screens/customer/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native'; // Keep TouchableOpacity
import { Text, Card, ActivityIndicator, Chip, Searchbar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // 1. Import useNavigation
import { getApprovedProviders, PublicProviderProfile } from '../../services/userService';
// 2. Import navigation types
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../navigation/CustomerTabNavigator'; // Correct import path

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x200.png?text=No+Image';

// 3. Define the specific navigation prop type for this screen
type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ProviderList'>;

export const HomeScreen = () => {
  const [providers, setProviders] = useState<PublicProviderProfile[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<PublicProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<HomeScreenNavigationProp>(); // 4. Get navigation object

  // Function to fetch providers
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { providers: fetchedProviders, error: fetchError } = await getApprovedProviders();
    if (fetchError) {
      setError('Failed to load providers.');
      setProviders([]);
      setFilteredProviders([]);
    } else if (fetchedProviders) {
      setProviders(fetchedProviders);
      setFilteredProviders(fetchedProviders); // Initially show all
    }
    setLoading(false);
  }, []);

  // Fetch when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProviders();
    }, [fetchProviders])
  );

  // Handle search query changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredProviders(providers); // Show all if search is empty
    } else {
      const lowerCaseQuery = query.toLowerCase();
      const filtered = providers.filter(
        (p) =>
          p.kitchenName.toLowerCase().includes(lowerCaseQuery) ||
          p.city.toLowerCase().includes(lowerCaseQuery) ||
          p.cuisineType.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProviders(filtered);
    }
  };


  // Render item for FlatList
  const renderProviderCard = ({ item }: { item: PublicProviderProfile }) => (
     // 5. Wrap Card in TouchableOpacity and add onPress
    <TouchableOpacity
      onPress={() => navigation.navigate('ProviderDetail', {
          providerId: item.id,
          kitchenName: item.kitchenName // Pass kitchenName for the header title
        })
      }
    >
      <Card style={styles.card}>
        <Card.Cover
          source={{ uri: item.kitchenImageUrl || PLACEHOLDER_IMAGE }}
          style={styles.cardCover}
        />
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={styles.kitchenName}>{item.kitchenName}</Text>
          <View style={styles.detailsRow}>
             <Chip icon="map-marker-outline" mode="outlined" style={styles.chip} textStyle={styles.chipText}>
               {item.city}
             </Chip>
             <Chip icon="silverware-fork-knife" mode="outlined" style={styles.chip} textStyle={styles.chipText}>
              {item.cuisineType}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by Kitchen, City, Cuisine..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchbar}
      />

      {loading && <ActivityIndicator animating={true} style={styles.loader} />}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !error && filteredProviders.length === 0 && (
         <Text style={styles.emptyText}>
            {searchQuery ? 'No providers match your search.' : 'No approved providers found yet.'}
         </Text>
      )}

      {!loading && !error && filteredProviders.length > 0 && (
        <FlatList
          data={filteredProviders}
          renderItem={renderProviderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={1} // Single column list
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 8,
    borderRadius: 8,
  },
  loader: {
    marginTop: 50,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: 'red',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 8, // Add padding at the bottom
  },
  card: {
    marginVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
   cardCover: {
    height: 150, // Adjust height as needed
  },
  cardContent: {
    paddingTop: 12,
  },
  kitchenName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow chips to wrap
    alignItems: 'center',
    marginTop: 4,
  },
  chip: {
    marginRight: 6,
    marginBottom: 6, // Add bottom margin for wrapping
    height: 28, // Make chips smaller
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11, // Smaller text in chips
  },
});