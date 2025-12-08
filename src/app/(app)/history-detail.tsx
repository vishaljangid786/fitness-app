import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WORKOUTS_API } from "../../lib/api";

// --- Type Definitions (Keep these as they are correct) ---
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

export default function HistoryDetailPage() {
  const router = useRouter();
  const { workout, workoutId } = useLocalSearchParams<{
    workout?: string;
    workoutId?: string;
  }>();
  const [parsedWorkout, setParsedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const maybeParsed = () => {
      if (workout) {
        try {
          const parsed: Workout = JSON.parse(workout);
          setParsedWorkout(parsed);
          setLoading(false);
          return true;
        } catch (err: any) {
          setError("Could not read workout data");
          setLoading(false);
          return true;
        }
      }
      return false;
    };

    if (maybeParsed()) return;

    const fetchWorkout = async () => {
      if (!workoutId) {
        setError("No workout data found");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${WORKOUTS_API}/${workoutId}`);
        const result = await response.json();
        if (response.ok && result.success) {
          setParsedWorkout(result.data);
        } else {
          throw new Error(result.error || "Failed to load workout");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [workout, workoutId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading workout...</Text>
      </SafeAreaView>
    );
  }

  if (!parsedWorkout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-700 font-semibold">
          {error || "No workout data found"}
        </Text>
      </SafeAreaView>
    );
  }

  // --- Helper Functions ---

  // Calculates the total volume in kg for the workout
  const calculateTotalVolume = (exercises: Exercise[]): number => {
    let totalVolume = 0;
    for (const exercise of exercises) {
      for (const set of exercise.sets) {
        // Assuming all weights are provided in 'kg' as per the image for simplicity in calculation.
        if (set.weightUnit === "kg") {
          totalVolume += set.reps * set.weight;
        } else if (set.weightUnit === "lbs") {
          // Note: Add conversion logic if your data uses lbs
          totalVolume += set.reps * set.weight * 0.453592;
        }
      }
    }
    // Round to the nearest whole number to match the image format (2,250 kg)
    return Math.round(totalVolume);
  };

  // Calculates the total number of sets
  const calculateTotalSets = (exercises: Exercise[]): number => {
    return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  };

  // Formats the timestamp to look like "Tuesday, July 1, 2025 at 3:52 PM"
  const formatDateForSummary = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " at " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // Formats duration from seconds to "50m" (or "1h 20m")
  const formatDurationForSummary = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    // Format to show 'Xm' like '50m' or '1h 20m'
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // Calculated values for the summary card
  const totalVolume = calculateTotalVolume(parsedWorkout.exercises);
  const totalSets = calculateTotalSets(parsedWorkout.exercises);
  const totalExercises = parsedWorkout.exercises.length;

  // --- Render Component ---
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header Bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Workout Record
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
        {/* Workout Summary Section */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">
            Workout Summary
          </Text>
          <TouchableOpacity className="bg-red-500 px-3 py-2 rounded-lg">
            <Text className="text-white font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Details List */}
        <View className="mb-6">
          <View className="flex-row items-center py-1">
            <Ionicons name="calendar-outline" size={18} color="#4b5563" />
            <Text className="ml-3 text-base text-gray-600">
              {formatDateForSummary(parsedWorkout.dateTime)}
            </Text>
          </View>
          <View className="flex-row items-center py-1">
            <Ionicons name="time-outline" size={18} color="#4b5563" />
            <Text className="ml-3 text-base text-gray-600">
              {formatDurationForSummary(parsedWorkout.duration)}
            </Text>
          </View>
          <View className="flex-row items-center py-1">
            <Ionicons name="barbell-outline" size={18} color="#4b5563" />
            <Text className="ml-3 text-base text-gray-600">
              {totalExercises} exercises
            </Text>
          </View>
          <View className="flex-row items-center py-1">
            <Ionicons name="stats-chart-outline" size={18} color="#4b5563" />
            <Text className="ml-3 text-base text-gray-600">
              {totalSets} total sets
            </Text>
          </View>
          <View className="flex-row items-center py-1">
            <Ionicons name="trending-up-outline" size={18} color="#4b5563" />
            <Text className="ml-3 text-base text-gray-600">
              {totalVolume.toLocaleString()} kg total volume
            </Text>
          </View>
        </View>

        {/* Exercises List */}
        {parsedWorkout.exercises.map((ex, exIndex) => (
          <View
            key={ex._key || ex._id || `ex-${exIndex}`}
            className="mt-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            {/* Exercise Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-semibold text-gray-900 text-lg">
                {ex.name}
              </Text>
              <View className="w-6 h-6 rounded-full bg-blue-500 justify-center items-center">
                <Text className="text-white font-bold">{exIndex + 1}</Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600 mb-3">
              {ex.sets.length} sets completed
            </Text>

            {/* Sets List */}
            {ex.sets.map((s, setIndex) => (
              <View
                key={s._key || `set-${setIndex}`}
                className="flex-row justify-between items-center py-2">
                {/* Set Index and Reps */}
                <View className="flex-row items-center">
                  <View className="w-5 h-5 rounded-full bg-gray-200 justify-center items-center mr-3">
                    <Text className="text-gray-700 text-xs font-bold">
                      {setIndex + 1}
                    </Text>
                  </View>
                  <Text className="text-gray-900 text-base">{s.reps} reps</Text>
                </View>

                {/* Weight and Icon */}
                <View className="flex-row items-center">
                  <Ionicons
                    name="trending-up-outline"
                    size={16}
                    color="#4b5563"
                    style={{ marginRight: 5, transform: [{ rotate: "90deg" }] }}
                  />
                  <Text className="text-gray-900 text-base font-medium">
                    {s.weight} {s.weightUnit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
        {/* Add space at the bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
