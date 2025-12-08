import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { WORKOUTS_API } from "../../../lib/api";

// --- Type Definitions (Kept from original) ---
type WorkoutSet = {
  reps: number;
  weight: number;
  weightUnit: "kg" | "lbs";
  _key: string;
};

type Exercise = {
  _id: string;
  name: string;
  sets: WorkoutSet[];
  _key: string;
};

type Workout = {
  _id: string;
  dateTime: string;
  duration: number; // in seconds
  exercises: Exercise[];
};

export default function HistoryPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchWorkouts = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(WORKOUTS_API);
      const result = await response.json();
      if (response.ok && result.success) {
        setWorkouts(result.data);
      } else {
        throw new Error(result.error || "Failed to load workouts");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  const calculateTotalSets = (exercises: Exercise[] = []): number =>
    exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);

  const calculateTotalVolume = (exercises: Exercise[] = []): number => {
    let totalVolume = 0;
    for (const exercise of exercises) {
      for (const set of exercise.sets || []) {
        // Simple multiplication; assumes kg is the base unit.
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        totalVolume += reps * weight;
      }
    }
    return Math.round(totalVolume);
  };

  // Formats the timestamp to look like "Today", "Yesterday", or "Tue, Sep 15"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Normalize dates for comparison (ignore time)
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const normalizedToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const normalizedYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (normalizedDate.getTime() === normalizedToday.getTime()) return "Today";
    if (normalizedDate.getTime() === normalizedYesterday.getTime())
      return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Formats duration from seconds to "2m 4s"
  const formatDurationForList = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    let durationString = "";
    if (mins > 0) {
      durationString += `${mins}m `;
    }
    durationString += `${secs}s`;
    return durationString.trim();
  };

  // --- Loading State Render ---
  if (loading) {
    return (
      <SafeAreaView className="bg-gray-50 flex-1">
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Workout History
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView className="bg-gray-50 flex-1">
      {/* History Summary Section */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Workout History
        </Text>
        <Text className="text-gray-600 mt-1">
          {workouts.length} workout{workouts.length !== 1 ? "s" : ""} completed
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl
            // Note: refreshing state is kept simple here as per initial code
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchWorkouts();
            }}
            colors={["#3B82F6"]}
          />
        }>
        {error ? (
          <View className="bg-white rounded-2xl p-6 border border-red-200">
            <Text className="text-red-600 font-semibold">Error</Text>
            <Text className="text-red-500 mt-1">{error}</Text>
          </View>
        ) : workouts.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Ionicons name="barbell-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No workouts found
            </Text>
            <Text className="text-gray-500 mt-1 text-center">
              Complete a workout to see it here.
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <TouchableOpacity
              key={workout._id}
              className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-200"
              onPress={() =>
                router.push({
                  pathname: "/history-detail",
                  params: { workoutId: workout._id },
                })
              }>
              {/* Top Row: Date and Like Button */}
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-gray-900">
                  {formatDate(workout.dateTime)}
                </Text>
                {/* Like Button (Heart icon) */}
                <TouchableOpacity className="p-1">
                  <Ionicons name="heart-outline" size={24} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              {/* Stats Row 1: Duration, Exercises, Sets */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text className="ml-1 text-base text-gray-600 mr-4">
                  {formatDurationForList(workout.duration)}
                </Text>

                {/* Exercise Count Chip */}
                <View className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-xs font-medium text-gray-700">
                    {workout.exercises.length} exercise
                    {workout.exercises.length !== 1 ? "s" : ""}
                  </Text>
                </View>

                {/* Set Count Chip */}
                <View className="bg-gray-100 px-2 py-1 rounded-full">
                  <Text className="text-xs font-medium text-gray-700">
                    {calculateTotalSets(workout.exercises)} sets
                  </Text>
                </View>
              </View>

              {/* Preview Row: Max 3 Exercises/Highlights */}
              <View className="flex-row flex-wrap">
                {workout.exercises.slice(0, 3).map((ex, index) => (
                  <View
                    key={ex._key || ex._id || `${ex.name}-${index}`}
                    className="bg-blue-500/10 px-2 py-1 rounded-full mr-2 mb-2">
                    <Text className="text-xs font-medium text-blue-700">
                      {ex.name}
                    </Text>
                  </View>
                ))}
                {/* Optional: Show Total Volume/Weight */}
                <View className="bg-gray-100 px-2 py-1 rounded-full mb-2">
                  <Text className="text-xs font-medium text-gray-700">
                    {calculateTotalVolume(workout.exercises).toLocaleString()}{" "}
                    kg total
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        {/* Add space at the bottom for the fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
