import { client } from "@/lib/sanity/client";
import { GetWorkoutsQueryResult, Workout } from "@/lib/sanity/types";
import { useUser } from "@clerk/clerk-expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { defineQuery } from "groq";
import { formatDuration } from "lib/utils";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const getWorkoutsQuery =
  defineQuery(`*[_type == "workout" && userId == $userId] | order(dateTime desc) {
        _id,
    dateTime,
    duration,
      userId,
    exercises[]{
      exercise->{
        _id,
        name,
      },
      sets[]{
        reps,
        weight,
        weightUnit,
        _type,
        _key, 
      },
      _type,
      _key,
    },
  }
`);

export default function HistoryPage() {
  const { user } = useUser();
  const router = useRouter();

  const [workouts, setWorkouts] = useState<GetWorkoutsQueryResult>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh } = useLocalSearchParams();

  const fetchWorkouts = async () => {
    console.log("Clerk user.id:", user?.id);
    console.log(
      "All workouts:",
      await client.fetch(`*[_type == "workout"]{_id, userId}`)
    );

    try {
      const results = await client.fetch(getWorkoutsQuery, { userId: user.id });
      console.log(results);

      setWorkouts(results);
    } catch (error) {
      console.error("Error fetching workouts:", error); 
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  useEffect(() => {
    if (refresh == "true") {
      fetchWorkouts();
      router.replace("/(app)/(tabs)/history");
    }
  }, [refresh]);

  useEffect(() => {
    fetchWorkouts();
  }, [user?.id]);

  const formatWorkoutDuration = (seconds: number) => {
    if (!seconds) return "Duration not recorded";
    return formatDuration(seconds);
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-gray-50 flex-1 ">
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">
            Workout History
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-gray-600 mt-4">Loading workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-gray-50 flex-1">
      {/* Header */}
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
            refreshing={refreshing}
            onRefresh={fetchWorkouts}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
            title="Pull to refresh workouts"
            titleColor="#6b7280"
          />
        }>
        {workouts.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Ionicons name="barbell-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              No workouts found
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Your workouts will appear here
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View
              key={workout._id}
              className="bg-white rounded-2xl p-6 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">
                {formatDate(
                  (workout as any).dateTime ?? (workout as any).date ?? ""
                )}
              </Text>

              <Text className="text-gray-600 mt-1">
                Duration:{" "}
                {formatWorkoutDuration((workout as any).duration ?? 0)}
              </Text>

              <View className="mt-3">
                {(workout.exercises as any[] | undefined)?.filter(Boolean).map(
                  (ex) =>
                    ex && (
                      <View key={ex._key} className="mt-3">
                        <Text className="font-semibold text-gray-800">
                          {ex.exercise?.name ?? "Unnamed Exercise"}
                        </Text>
                        {(ex.sets as any[] | undefined)?.filter(Boolean).map(
                          (s) =>
                            s && (
                              <Text
                                key={s._key}
                                className="text-gray-600 text-sm">
                                {s.reps} reps — {s.weight} {s.weightUnit}
                              </Text>
                            )
                        )}
                      </View>
                    )
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
