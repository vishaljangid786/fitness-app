import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";

type UserMeta = {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bio?: string;
};

export default function Profile() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  const m = (user?.unsafeMetadata || {}) as UserMeta;

  // NEW FULL PROFILE MODAL
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || "",
    age: m.age?.toString() || "",
    gender: m.gender || "",
    height: m.height?.toString() || "",
    weight: m.weight?.toString() || "",
    bio: m.bio || "",
  });

  // MODAL STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [inputValue, setInputValue] = useState("");

  const insets = useSafeAreaInsets();

  if (!isLoaded) return null;

  // BMI
  const heightM = m.height ? m.height / 100 : 0;
  const bmi =
    m.weight && m.height
      ? (m.weight / (heightM * heightM)).toFixed(1)
      : "Enter your height & weight";

  const handleEdit = (field: string, existingValue: any) => {
    setCurrentField(field);

    // FORCE placeholder to appear when no valid number exists
    if (
      existingValue === undefined ||
      existingValue === null ||
      existingValue === "" ||
      Number.isNaN(existingValue)
    ) {
      setInputValue(""); // <-- THIS MAKES THE PLACEHOLDER SHOW
    } else {
      setInputValue(existingValue.toString());
    }

    setModalVisible(true);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need access to your photos to change the profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      // Store image URI in unsafeMetadata
      try {
        await user?.update({
          unsafeMetadata: {
            ...(user.unsafeMetadata as any),
            image: uri,
          },
        });
        Alert.alert("Success", "Profile picture updated!");
      } catch (error: any) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      fullName: user?.fullName || "",
      age: m.age?.toString() || "",
      gender: m.gender || "",
      height: m.height?.toString() || "",
      weight: m.weight?.toString() || "",
      bio: m.bio || "",
    });

    setEditProfileModalVisible(true);
  };

  const handleNotifications = () => {
    Alert.alert("Notifications", "Open notification settings screen");
  };

  const handlePreferences = () => {
    Alert.alert("Preferences", "Open preferences screen");
  };

  const handleHelpSupport = () => {
    Alert.alert("Help & Support", "Open help center or support chat");
  };

  const menuItems = [
    {
      label: "Edit Profile",
      icon: "person-outline",
      bg: "bg-blue-100",
      text: "text-blue-600",
      onPress: handleEditProfile,
    },
    {
      label: "Notifications",
      icon: "notifications-outline",
      bg: "bg-green-100",
      text: "text-green-600",
      onPress: handleNotifications,
    },
    {
      label: "Preferences",
      icon: "settings-outline",
      bg: "bg-purple-100",
      text: "text-purple-600",
      onPress: handlePreferences,
    },
    {
      label: "Help & Support",
      icon: "help-circle-outline",
      bg: "bg-orange-100",
      text: "text-orange-600",
      onPress: handleHelpSupport,
    },
  ];

  if (email === "vickyjangid3456@gmail.com") {
    menuItems.push({
      label: "New Exercise",
      icon: "add-circle-outline",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      onPress: () => Alert.alert("New Exercise", "Open new exercise builder"),
    });
  }

  const saveFullProfile = async () => {
    try {
      await user?.update({
        firstName: editForm.fullName.split(" ")[0],
        lastName: editForm.fullName.split(" ")[1] || "",
        unsafeMetadata: {
          ...(user.unsafeMetadata as any),
          age: Number(editForm.age),
          gender: editForm.gender,
          height: Number(editForm.height),
          weight: Number(editForm.weight),
          bio: editForm.bio,
        },
      });

      setEditProfileModalVisible(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER SECTION */}
        <View className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow">
          <View className="gap-4 items-center">
            <Image
              source={{
                uri:
                  (user?.unsafeMetadata?.image as string) ||
                  (user?.imageUrl as string) ||
                  "https://via.placeholder.com/150",
              }}
              className="w-32 h-32 rounded-full"
            />

            <View className="ml-4 items-center">
              <Text className="text-xl font-semibold text-gray-900">
                {user?.fullName || user?.primaryEmailAddress?.emailAddress}
              </Text>

              <Text className="text-gray-500">
                {user?.primaryEmailAddress?.emailAddress}
              </Text>

              <Text className="text-gray-400 text-sm">
                Member since June 2025
              </Text>
            </View>
          </View>
        </View>

        {/* FITNESS STATS */}
        <View className="mx-4 mt-6 bg-white rounded-3xl p-6 shadow">
          <View className="flex-row justify-between mb-4">
            <View className="items-center">
              <Text className="text-gray-500 text-sm">Total Workouts</Text>
              <Text className="text-xl font-bold text-gray-900">2</Text>
            </View>

            <View className="items-center">
              <Text className="text-gray-500 text-sm">Total Time</Text>
              <Text className="text-xl font-bold text-gray-900">2m 4s</Text>
            </View>

            <View className="items-center">
              <Text className="text-gray-500 text-sm">Days Active</Text>
              <Text className="text-xl font-bold text-gray-900">5</Text>
            </View>
          </View>

          <Text className="text-gray-500 text-center">
            Average workout duration:{" "}
            <Text className="font-semibold text-gray-900">1m 2s</Text>
          </Text>
        </View>

        {/* ACCOUNT SETTINGS */}
        <View className="gap-4 mt-6 mx-4">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="bg-white p-4 rounded-2xl shadow flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 rounded-full ${item.bg} items-center justify-center`}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.text.replace("text-", "")}
                  />
                </View>

                <Text className={`ml-3 text-lg font-semibold ${item.text}`}>
                  {item.label}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={24} color={"#999"} />
            </TouchableOpacity>
          ))}
        </View>

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mx-4 mt-10 bg-red-500 p-4 rounded-2xl shadow flex-row items-center justify-center">
          <Ionicons name="log-out-outline" size={22} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* FULL EDIT PROFILE MODAL */}
        <Modal
          visible={editProfileModalVisible}
          transparent
          animationType="slide">
          <View className="flex-1 justify-center items-center bg-black/40 px-6">
            <View className="bg-white p-6 w-full rounded-2xl max-h-[80%]">
              <Text className="text-2xl font-bold mb-4 text-center">
                Edit Profile
              </Text>

              <View className="gap-4 ">
                <TextInput
                  value={editForm.fullName}
                  onChangeText={(v) =>
                    setEditForm({ ...editForm, fullName: v })
                  }
                  placeholder="Full Name"
                  className="border border-gray-300 rounded-xl p-3"
                />

                <TextInput
                  value={editForm.gender}
                  onChangeText={(v) => setEditForm({ ...editForm, gender: v })}
                  placeholder="Gender"
                  className="border border-gray-300 rounded-xl p-3"
                />

                <TextInput
                  value={editForm.age}
                  onChangeText={(v) => setEditForm({ ...editForm, age: v })}
                  placeholder="Age"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-xl p-3"
                />

                <TextInput
                  value={editForm.height}
                  onChangeText={(v) => setEditForm({ ...editForm, height: v })}
                  placeholder="Height (cm)"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-xl p-3"
                />

                <TextInput
                  value={editForm.weight}
                  onChangeText={(v) => setEditForm({ ...editForm, weight: v })}
                  placeholder="Weight (kg)"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded-xl p-3"
                />

                <TextInput
                  value={editForm.bio}
                  onChangeText={(v) => setEditForm({ ...editForm, bio: v })}
                  placeholder="Bio"
                  multiline
                  className="border border-gray-300 rounded-xl p-3 h-20"
                />
              </View>

              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setEditProfileModalVisible(false)}
                  className="border-2 border-red-500 px-4 py-2 rounded-xl mt-5">
                  <Text className="text-red-500 text-center font-semibold text-lg">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveFullProfile}
                  className="bg-blue-600 border-2 border-blue-600 px-4 py-2 rounded-xl mt-5">
                  <Text className="text-white text-center font-semibold text-lg">
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
