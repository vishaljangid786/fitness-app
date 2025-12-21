import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "expo-router";
import { WORKOUTS_API } from "../../../../lib/api";
import { useRouter } from "expo-router";

type UserMeta = {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bio?: string;
};

type Workout = {
  _id: string;
  dateTime: string;
  duration: number; // in seconds
  exercises: any[];
};

export default function Profile() {
  const { signOut } = useAuth();
  const { user, isLoaded } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const router = useRouter();
  const m = (user?.unsafeMetadata || {}) as UserMeta;

  // WORKOUTS STATE
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

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

  // FETCH WORKOUTS
  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await fetch(WORKOUTS_API);
      const result = await response.json();
      if (response.ok && result.success) {
        setWorkouts(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load workouts:", err);
    } finally {
      setLoadingWorkouts(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetchWorkouts();
    }
  }, [isLoaded, fetchWorkouts]);

  useFocusEffect(
    useCallback(() => {
      if (isLoaded) {
        fetchWorkouts();
      }
    }, [isLoaded, fetchWorkouts])
  );

  if (!isLoaded) return null;

  // BMI
  const heightM = m.height ? m.height / 100 : 0;
  const bmi =
    m.weight && m.height
      ? (m.weight / (heightM * heightM)).toFixed(1)
      : "Enter your height & weight";

  // CALCULATE FITNESS STATS
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const averageDuration =
    totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

  // Calculate unique days active
  const uniqueDates = new Set(
    workouts.map((w) => {
      const date = new Date(w.dateTime);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );
  const daysActive = uniqueDates.size;

  // Format duration helper
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

  // Format member since date
  const formatMemberSince = () => {
    if (!user?.createdAt) return "Member since recently";
    const date = new Date(user.createdAt);
    return `Member since ${date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  };

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

  if (email === "vickyjangid3456@gmail.com" || email === "vishaljangid80550786@gmail.com" || email === "noonecaresme81@gmail.com") {
    menuItems.push({
      label: "New Exercise",
      icon: "add-circle-outline",
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      onPress: () => router.push("/new-exercise"),
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
                {formatMemberSince()}
              </Text>
            </View>
          </View>
        </View>

        {/* FITNESS STATS */}
        <View className="mx-4 mt-6 bg-white rounded-3xl p-6 shadow">
          {loadingWorkouts ? (
            <View className="items-center py-4">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-gray-500 mt-2 text-sm">Loading stats...</Text>
            </View>
          ) : (
            <>
              <View className="flex-row justify-between mb-4">
                <View className="items-center">
                  <Text className="text-gray-500 text-sm">Total Workouts</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {totalWorkouts}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-gray-500 text-sm">Total Time</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {formatDuration(totalDuration)}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-gray-500 text-sm">Days Active</Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {daysActive}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-500 text-center">
                Average workout duration:{" "}
                <Text className="font-semibold text-gray-900">
                  {formatDuration(averageDuration)}
                </Text>
              </Text>
            </>
          )}
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
