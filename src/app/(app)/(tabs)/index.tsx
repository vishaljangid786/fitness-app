import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { WORKOUTS_API } from "../../../lib/api";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workouts, setWorkouts] = useState<
    { _id: string; dateTime: string; duration: number; exercises: any[] }[]
  >([]);

  const fetchWorkouts = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${WORKOUTS_API}/user/${user?.id}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setWorkouts(result.data || []);
      } else {
        throw new Error(result.error || "Failed to load workouts");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load workouts");
    } finally {
      setLoading(false);
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

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const averageDuration =
    totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours > 0) return `${hours}h ${remMins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  const lastWorkout = sortedWorkouts[0];

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4 pt-4">
      {/* Greeting */}
      <View>
        <Text className="text-xl text-gray-600">Welcome back,</Text>
        <Text className="text-3xl font-bold text-gray-900 mt-1">
          {user?.firstName || "NewBie"}! 💪
        </Text>
      </View>

      {/* Stats Card */}
      <View className="bg-white rounded-3xl p-6 py-8 mt-6 shadow">
        {loading ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading stats...</Text>
          </View>
        ) : error ? (
          <View className="items-center">
            <Text className="text-red-600 font-semibold">Unable to load</Text>
            <Text className="text-gray-500 mt-1 text-center">{error}</Text>
          </View>
        ) : (
          <View className="flex-row justify-between">
            <View className="items-center gap-2">
              <Text className="text-sm text-gray-500">Total Workouts</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {totalWorkouts}
              </Text>
            </View>

            <View className="items-center gap-2">
              <Text className="text-sm text-gray-500">Total Time</Text>
              <Text className="text-2xl font-bold text-green-600">
                {formatDuration(totalDuration)}
              </Text>
            </View>

            <View className="items-center gap-2">
              <Text className="text-sm text-gray-500">Average Duration</Text>
              <Text className="text-2xl font-bold text-purple-600">
                {formatDuration(averageDuration)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <Text className="mt-8 mb-3 text-lg font-semibold text-gray-900">
        Quick Actions
      </Text>

      <TouchableOpacity
        className="bg-blue-600 p-5 py-8 rounded-3xl shadow flex-row items-center justify-between"
        onPress={() => router.push("/workout")}>
        <View className="flex-row items-center">
          <Ionicons name="play" size={26} color="white" />
          <Text className="text-white text-lg font-semibold ml-3">
            Start Workout
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={26} color="white" />
      </TouchableOpacity>

      <View className="flex-row mt-4">
        <TouchableOpacity
          className="flex-1 bg-white rounded-2xl p-4 py-6 mr-3 items-center shadow"
          onPress={() => router.push("/history")}>
          <Ionicons name="time-outline" size={32} color="#4B5563" />
          <Text className="mt-4 text-gray-700 font-medium">
            Workout History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white rounded-2xl p-4 py-6 ml-3 items-center shadow"
          onPress={() => router.push("/exercises")}>
          <Ionicons name="barbell-outline" size={32} color="#4B5563" />
          <Text className="mt-4 text-gray-700 font-medium">
            Browse Exercises
          </Text>
        </TouchableOpacity>
      </View>

      {/* Last Workout */}
      <Text className="mt-8 mb-3 text-lg font-semibold text-gray-900">
        Last Workout
      </Text>

      <View className="bg-white rounded-3xl p-5 py-8 shadow">
        {loading ? (
          <View className="items-center">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-gray-500 mt-2">Loading last workout...</Text>
          </View>
        ) : !lastWorkout ? (
          <Text className="text-gray-500 text-center">
            No workouts yet. Start your first session!
          </Text>
        ) : (
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-gray-500">
                {new Date(lastWorkout.dateTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              <Text className="text-xl font-semibold text-gray-900 mt-2">
                {formatDuration(lastWorkout.duration)}
              </Text>
              <Text className="text-gray-500 mt-2">
                {lastWorkout.exercises?.length || 0} exercises •{" "}
                {lastWorkout.exercises?.reduce(
                  (sum: number, ex: any) => sum + (ex.sets?.length || 0),
                  0
                )}{" "}
                sets
              </Text>
            </View>
            <Ionicons name="heart-outline" size={26} color="#9CA3AF" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
