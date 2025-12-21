import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { EXERCISES_API } from "../../lib/api";
import {
  getDifficultyColor,
  getDifficultyText,
} from "../components/ExerciseCard";

export default function ExerciseDetail() {
  const router = useRouter();

  // ✅ get id from params
  const { id } = useLocalSearchParams<{ id: string }>();

  const [exerciseData, setExerciseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiGuidance, setAiGuidance] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ✅ Fetch exercise by ID
  useEffect(() => {
    if (!id) return;

    const fetchExercise = async () => {
      try {
        const res = await fetch(`${EXERCISES_API}/${id}`);
        const data = await res.json();
        setExerciseData(data.data);
        
      } catch (error) {
        console.error("Failed to fetch exercise:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  // 🤖 AI Guidance (mock)
  const getAiGuidance = () => {
    setAiLoading(true);

    setTimeout(() => {
      setAiGuidance(
        "Keep your core tight, breathe steadily, and focus on controlled movement for best results."
      );
      setAiLoading(false);
    }, 1200);
  };

  // ⏳ Loading
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-2">Loading exercise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ❌ No data
  if (!exerciseData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={40} color="red" />
          <Text className="text-gray-600 mt-2">
            Exercise not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0)",
        justifyContent: "flex-end",
      }}
    >
      <View
        style={{
          height: "95%",
          backgroundColor: "white",
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          padding: 20,
        }}
      >
        {/* Close Button */}
        <View className="absolute top-12 left-0 right-0 z-10 px-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View className="h-80 mb-6">
            {exerciseData.imageUrl ? (
              <Image
                source={{ uri: exerciseData.imageUrl }}
                className="w-full h-full rounded-xl"
                resizeMode="stretch"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-100 rounded-xl">
                <Ionicons name="fitness" size={80} color="#9ca3af" />
              </View>
            )}
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            {exerciseData.name}
          </Text>

          {/* Difficulty */}
          <View
            className={`self-start px-4 py-2 rounded-full mb-6 ${getDifficultyColor(
              exerciseData.difficulty
            )}`}
          >
            <Text className="text-white font-semibold">
              {getDifficultyText(exerciseData.difficulty)}
            </Text>
          </View>

          {/* Description */}
          <Text className="text-xl font-semibold mb-2">Description</Text>
          <Text className="text-gray-600 leading-6 mb-6">
            {exerciseData.description}
          </Text>

          {/* Video */}
          {exerciseData.videoUrl && (
            <TouchableOpacity
              className="bg-red-500 rounded-xl p-4 flex-row items-center mb-6"
              onPress={() => Linking.openURL(exerciseData.videoUrl)}
            >
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
                <Ionicons name="play" size={20} color="#ef4444" />
              </View>
              <Text className="text-white font-semibold text-lg">
                Watch Tutorial
              </Text>
            </TouchableOpacity>
          )}

          {/* AI Coach */}
          {(aiGuidance || aiLoading) && (
            <View className="mb-6">
              <Text className="text-xl font-semibold mb-2">
                AI Coach Says
              </Text>

              {aiLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <View className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                  <Text>{aiGuidance}</Text>
                </View>
              )}
            </View>
          )}

          {/* Buttons */}
          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-4 items-center mb-3"
            onPress={getAiGuidance}
            disabled={aiLoading}
          >
            <Text className="text-white font-bold text-lg">
              {aiGuidance ? "Refresh AI Guidance" : "Get AI Guidance"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 rounded-xl py-4 items-center"
            onPress={() => router.back()}
          >
            <Text className="font-bold">Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
