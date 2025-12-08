import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { API_URL } from "./new-exercise";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDifficultyColor,
  getDifficultyText,
} from "../components/ExerciseCard";
import { useRouter } from "expo-router";

export default function AllExercise() {
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchExercises = async () => {
    try {
      const res = await fetch(`${API_URL}`);
      const json = await res.json();

      if (json.success) {
        setExercises(json.data);
        setFiltered(json.data);
      } else {
        setError("API returned an error.");
      }
    } catch (err) {
      setError("Failed to load exercises.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // 🔍 FILTER FUNCTION
  const handleSearch = (text) => {
    setSearch(text);

    if (!text.trim()) {
      setFiltered(exercises);
      return;
    }

    const query = text.toLowerCase();

    const filteredData = exercises.filter((item) =>
      item.name.toLowerCase().includes(query)
    );

    setFiltered(filteredData);
  };

  // 🔄 PULL-TO-REFRESH FUNCTION
  const onRefresh = () => {
    setRefreshing(true);
    fetchExercises(); // calls API again
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Loading exercises...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4">
      <View className="mb-2">
        <Text className="text-2xl font-bold mb-4">All Exercises</Text>
      </View>

      {/* Search Bar */}
      <TextInput
        value={search}
        onChangeText={handleSearch}
        placeholder="Search exercises..."
        className="bg-white p-4 rounded-2xl mb-4 text-lg shadow"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View className="bg-white flex-row items-center p-4 mb-3 rounded-2xl shadow-sm border border-gray-200">
            {/* IMAGE */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                className="w-14 h-14 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-14 h-14 bg-gray-200 rounded-lg items-center justify-center">
                <Text className="text-gray-500 text-xs">No Img</Text>
              </View>
            )}

            {/* RIGHT SIDE CONTENT */}
            <View className="flex-1 ml-4">
              {/* NAME */}
              <Text className="text-lg font-semibold text-gray-900">
                {item.name}
              </Text>

              {/* SHORT DESCRIPTION */}
              <Text className="text-gray-500 text-sm mt-1">
                {item.description || "No description available"}
              </Text>

              <View className="flex-row items-center gap-4 mt-4 justify-between">
                {/* DIFFICULTY BADGE */}
                <View
                  className={`self-start mt-2 px-3 py-1 rounded-full ${getDifficultyColor(
                    item.difficulty
                  )}`}>
                  <Text className="text-white text-xs font-semibold">
                    {getDifficultyText(item.difficulty)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "active-workout",
                      params: { exercise: JSON.stringify(item) },
                    })
                  }>
                  <Text className="text-blue-600 font-semibold bg-blue-100 px-3 py-1 rounded-xl">Add exercise</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
