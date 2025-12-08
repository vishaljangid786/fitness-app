import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

export default function workout() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 justify-between bg-gray-50">
      <View className="p-4">
        <Text className="text-4xl font-bold text-gray-800 h-10">
          Ready to Train?
        </Text>
        <Text className="text-base text-gray-600">
          Start your workout session
        </Text>
      </View>

      <View className="bg-white rounded-2xl p-4 mx-4">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row">
            <View className="bg-[#d7ebff] w-16 h-16 rounded-full items-center justify-center mb-4">
              <Ionicons name="fitness" size={24} color="#637ed1" />
            </View>
            <View className="ml-2 p-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                Start Workout
              </Text>
              <Text className="font-bold text-zinc-500 mb-2">
                Begin your fitness journey
              </Text>
            </View>
          </View>

          <View>
            <Text className="bg-blue-100 rounded-full px-4 py-2">Ready</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/active-workout")}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-2 bg-blue-600 py-4 rounded-2xl shadow">
          <Ionicons name="play" size={22} color="#fff" />
          <Text className="text-white font-semibold text-lg">
            Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
