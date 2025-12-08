import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { EXERCISES_API } from "../../lib/api";

const NewExercise = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Strength",
    difficulty: "Beginner",
    muscleGroups: "",
    equipment: "",
    instructions: "",
    caloriesPerMinute: "",
    videoUrl: "",
  });

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Request image picker permissions
  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need camera roll permissions to upload images."
      );
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  // Show image source options
  const showImageOptions = () => {
    Alert.alert("Select Image", "Choose an option", [
      { text: "Camera", onPress: takePhoto },
      { text: "Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Create FormData for multipart/form-data upload
  const createFormData = () => {
    const data = new FormData();

    // Add text fields
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("difficulty", formData.difficulty);

    if (formData.muscleGroups) {
      data.append("muscleGroups", formData.muscleGroups);
    }
    if (formData.equipment) {
      data.append("equipment", formData.equipment);
    }
    if (formData.instructions) {
      data.append("instructions", formData.instructions);
    }
    if (formData.caloriesPerMinute) {
      data.append("caloriesPerMinute", formData.caloriesPerMinute);
    }
    if (formData.videoUrl) {
      data.append("videoUrl", formData.videoUrl);
    }

    // Add image if selected
    if (image) {
      const filename = image.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      data.append("image", {
        uri: image,
        name: filename,
        type: type,
      } as any);
    }

    return data;
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = createFormData();

      const response = await fetch(EXERCISES_API, {
        method: "POST",
        body: formDataToSend,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert("Success", "Exercise created successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setFormData({
                name: "",
                description: "",
                category: "Strength",
                difficulty: "Beginner",
                muscleGroups: "",
                equipment: "",
                instructions: "",
                caloriesPerMinute: "",
                videoUrl: "",
              });
              setImage(null);
            },
          },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to create exercise");
      }
    } catch (error: any) {
      console.error("Error creating exercise:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to connect to server. Make sure your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">
            Create New Exercise
          </Text>
          <Text className="text-gray-600 mt-2">
            Add a new exercise to your library
          </Text>
        </View>

        {/* Image Upload Section */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Exercise Image
          </Text>
          {image ? (
            <View className="relative">
              <Image
                source={{ uri: image }}
                className="w-full h-64 rounded-2xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setImage(null)}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-2">
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showImageOptions}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center justify-center bg-gray-100">
              <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2 text-center">
                Tap to add image
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Camera or Gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View className="space-y-4">
          {/* Name */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Exercise Name *
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="e.g., Push-ups"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Description *
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="Describe the exercise..."
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Category *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {["Strength", "Cardio", "Flexibility", "Balance", "Sports"].map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setFormData({ ...formData, category: cat })}
                    className={`px-4 py-2 rounded-lg ${
                      formData.category === cat
                        ? "bg-blue-500"
                        : "bg-white border border-gray-200"
                    }`}>
                    <Text
                      className={`font-medium ${
                        formData.category === cat
                          ? "text-white"
                          : "text-gray-700"
                      }`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Difficulty */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Difficulty *
            </Text>
            <View className="flex-row gap-2">
              {["Beginner", "Intermediate", "Advanced"].map((diff) => (
                <TouchableOpacity
                  key={diff}
                  onPress={() => setFormData({ ...formData, difficulty: diff })}
                  className={`flex-1 px-4 py-3 rounded-xl ${
                    formData.difficulty === diff
                      ? "bg-blue-500"
                      : "bg-white border border-gray-200"
                  }`}>
                  <Text
                    className={`text-center font-medium ${
                      formData.difficulty === diff
                        ? "text-white"
                        : "text-gray-700"
                    }`}>
                    {diff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Muscle Groups */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Muscle Groups
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="e.g., Chest, Shoulders, Triceps (comma-separated)"
              value={formData.muscleGroups}
              onChangeText={(text) =>
                setFormData({ ...formData, muscleGroups: text })
              }
            />
          </View>

          {/* Equipment */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Equipment
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="e.g., None, Dumbbells, Barbell (comma-separated)"
              value={formData.equipment}
              onChangeText={(text) =>
                setFormData({ ...formData, equipment: text })
              }
            />
          </View>

          {/* Instructions */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Instructions
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="Step 1, Step 2, Step 3... (comma-separated)"
              value={formData.instructions}
              onChangeText={(text) =>
                setFormData({ ...formData, instructions: text })
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Calories Per Minute */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Calories Per Minute
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="e.g., 8"
              value={formData.caloriesPerMinute}
              onChangeText={(text) =>
                setFormData({ ...formData, caloriesPerMinute: text })
              }
              keyboardType="numeric"
            />
          </View>

          {/* Video URL */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Video URL (Optional)
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 border border-gray-200 text-gray-900"
              placeholder="https://example.com/video"
              value={formData.videoUrl}
              onChangeText={(text) =>
                setFormData({ ...formData, videoUrl: text })
              }
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`mt-6 mb-8 py-4 rounded-xl items-center ${
            loading ? "bg-gray-400" : "bg-blue-500"
          }`}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-semibold">
              Create Exercise
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NewExercise;
