import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { client, urlFor } from "@/lib/sanity/client";
import { Exercise } from "@/lib/sanity/types";
import { defineQuery } from "groq";
import {
  getDifficultyColor,
  getDifficultyText,
} from "../components/ExerciseCard";

const singleExerciseQuery = defineQuery(`
  *[_type == "exercise" && _id == $id][0]
`);

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise>(null);
  const [loading, setLoading] = useState(true);
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const fetchExercise = async () => {
      if (!id) return;
      try {
        const exerciseData = await client.fetch(singleExerciseQuery, { id });
        setExercise(exerciseData);
      } catch (error) {
        console.error("Error fetching exercise:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, []);

  const getAiGuidance = async () => {
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-gray-500"> Loading execise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (aiLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0)", // dim background
        justifyContent: "flex-end", // content at bottom
      }}>
      {/* Modal Container */}
      <View
        style={{
          height: "95%", // leaves ~10% at top
          backgroundColor: "white",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          padding: 20,
        }}>
        {/* Header with close button  */}
        <View className="absolute top-12 left-0 right-0 z-10 px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/20 rounded-full items-center justify-center backdrop-blur-sm">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <View className="h-80 bg-white relative">
            {exercise?.image ? (
              <Image
                source={{ uri: urlFor(exercise.image?.asset?._ref).url() }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : (
              <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent"></View>
            )}
          </View>

          {/* Content */}
          <View className="px-4 py-6">
            {/* Title and dificulty */}
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-3xl  font-bold text-gray-800 mb-2">
                  {exercise?.name}
                </Text>
                <View
                  className={`self-start px-4 py-2 rounded-full ${getDifficultyColor(
                    exercise?.difficulty
                  )}`}>
                  <Text className="text-sm font-semibold text-white">
                    {getDifficultyText(exercise?.difficulty)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                Description
              </Text>
              <Text className="text-gray-600 leading-6 text-base">
                {exercise?.description ||
                  "No description available for this exercise."}
              </Text>
            </View>

            {/* Video section */}
            {exercise?.videoUrl && (
              <View className="mb-6">
                <Text className="text-xl font-semibold text-gray-800 mb-3">
                  Video Tutorial
                </Text>
                <TouchableOpacity
                  className="bg-red-500 rounded-xl p-4 flex-row items-center"
                  onPress={() => Linking.openURL(exercise.videoUrl)}>
                  <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
                    <Ionicons name="play" size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="text-white font-semibold  text-lg">
                      Watch Tutorial
                    </Text>
                    <Text className="tex t-red-100 text-sm">
                      Learn Proper form
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* todo ai guidance */}
            {aiGuidance ||
              (aiLoading && (
                <View className="mb-6">
                  <Ionicons name="fitness" size={24} color="#3b82f6" />
                  <Text className="text-xl font-semibold text-gray-800 ml-2">
                    Ai Coach Says...
                  </Text>

                  {aiLoading ? (
                    <View className="bg-gray-50 rounded-xl p-4 items-center">
                      <ActivityIndicator size="small" color="#3b82f6" />
                      <Text className="text-gray-600 mt-2">
                        Getting personilized Ai guidance...
                      </Text>
                    </View>
                  ) : (
                    <View className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                      <Text className="text-gray-800 leading-6">
                        {aiGuidance}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

            {/* Action Buttons */}
            <View className="mt-8 gap-2">
              {/* ai coach button */}
              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  aiLoading
                    ? "bg-gray-400"
                    : aiGuidance
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
                onPress={getAiGuidance}
                disabled={aiLoading}>
                {aiLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-semibold  text-lg ml-2">
                      Loading...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {aiGuidance
                      ? "Refresh Ai Guidance"
                      : "Get Ai Guidance on Form & Technique"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-200 rounded-xl py-4 items-center"
                onPress={() => router.back()}>
                <Text className="text-gray-800 font-bold text-lg">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
