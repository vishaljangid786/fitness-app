import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { WORKOUTS_API } from "../../lib/api";

// ---------------- TYPES ---------------------
type WorkoutSet = {
  reps: number;
  weight: number;
  completed: boolean;
};

type Exercise = {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  difficulty?: string;
  sets: WorkoutSet[];
};
// --------------------------------------------

export default function ActiveWorkout() {
  const [seconds, setSeconds] = useState(0);
  const [unit, setUnit] = useState<"kg" | "lbs">("kg");
  const [workout, setWorkout] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  const { exercise } = useLocalSearchParams<{ exercise?: string }>();

  // TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = () => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // IF EXERCISE SELECTED FROM ALL EXERCISES
  useEffect(() => {
    if (exercise) {
      try {
        const ex = JSON.parse(exercise);

        setWorkout((prev) => {
          // check if exercise already exists in workout
          const exists = prev.some((w) => w._id === ex._id);
          if (exists) return prev; // don’t add duplicates

          const newExercise: Exercise = {
            ...ex,
            sets: [{ reps: 0, weight: 0, completed: false }],
          };

          return [...prev, newExercise];
        });
      } catch (err) {
        console.error("Invalid exercise param:", err);
      }
    }
  }, [exercise]);

  // HANDLE SET FIELD CHANGE
  const updateSetField = (
    exIndex: number,
    setIndex: number,
    field: "reps" | "weight",
    value: string
  ) => {
    const numericValue = Math.max(Number(value), 0); // prevent negative
    setWorkout((prev) => {
      const copy = [...prev];
      copy[exIndex].sets[setIndex][field] = numericValue;
      return copy;
    });
  };

  const toggleCompleteSet = (exIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      const copy = [...prev];
      const set = copy[exIndex].sets[setIndex];
      set.completed = !set.completed;
      return copy;
    });
  };

  const addSet = (exIndex: number) => {
    setWorkout((prev) => {
      const copy = [...prev];
      copy[exIndex].sets.push({
        reps: 0,
        weight: 0,
        completed: false,
      });
      return copy;
    });
  };

  const deleteSet = (exIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      const copy = [...prev];
      copy[exIndex].sets.splice(setIndex, 1);
      return copy;
    });
  };
  const EndworkoutFunction = () => {
    Alert.alert("End Workout", "Save and finish this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: saving ? "Saving..." : "Save & Finish",
        style: "destructive",
        onPress: () => {
          if (!saving) {
            completeWorkout();
          }
        },
      },
    ]);
  };

  const completeWorkout = async () => {
    if (workout.length === 0) {
      Alert.alert("Add exercises", "Please add at least one exercise first.");
      return;
    }

    const hasData = workout.some((ex) =>
      ex.sets.some((s) => (s.reps ?? 0) > 0 || (s.weight ?? 0) > 0)
    );

    if (!hasData) {
      Alert.alert(
        "Add set data",
        "Enter reps and weights for at least one set before completing."
      );
      return;
    }

    const payload = {
      dateTime: new Date().toISOString(),
      duration: seconds,
      exercises: workout.map((ex) => ({
        exerciseId: ex._id,
        name: ex.name,
        sets: ex.sets.map((s) => ({
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
          weightUnit: unit,
        })),
      })),
    };

    try {
      setSaving(true);
      const response = await fetch(WORKOUTS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert("Workout saved", "View it in your history.", [
          {
            text: "Go to History",
            onPress: () => router.replace("/(app)/(tabs)/history"),
          },
        ]);
        setWorkout([]);
        setSeconds(0);
      } else {
        throw new Error(result.error || "Failed to save workout");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Could not save workout. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = (exIndex: number) => {
    setWorkout((prev) => prev.filter((_, i) => i !== exIndex));
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <StatusBar barStyle="dark-content" />

      {/* TOP HEADER */}
      <View className="flex-row items-center justify-between mt-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-lg font-semibold">Active Workout</Text>
          <Text className="text-gray-500 text-sm">{formattedTime()}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-row border mr-5 rounded border-blue-400 overflow-hidden">
            <TouchableOpacity
              className={`px-3 py-1 ${
                unit === "lbs" ? "bg-blue-400" : "bg-white"
              }`}
              onPress={() => setUnit("lbs")}>
              <Text
                className={
                  unit === "lbs"
                    ? "text-white font-medium"
                    : "text-gray-600 font-medium"
                }>
                lbs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-3 py-1 ${
                unit === "kg" ? "bg-blue-400" : "bg-white"
              }`}
              onPress={() => setUnit("kg")}>
              <Text
                className={
                  unit === "kg"
                    ? "text-white font-medium"
                    : "text-gray-600 font-medium"
                }>
                kg
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`px-3 py-1 rounded-xl ${
              saving ? "bg-red-300" : "bg-red-600"
            }`}
            disabled={saving}
            onPress={EndworkoutFunction}>
            <Text className="text-white font-semibold">End Workout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
        {workout.length === 0 && (
          <View className="flex-1 items-center mt-10">
            <Text className="text-gray-500">{workout.length} exercises</Text>

            <View className="bg-[#eef3ff] w-full p-6 rounded-2xl mt-4 items-center border border-gray-200">
              <Ionicons name="barbell-outline" size={40} color="gray" />
              <Text className="text-lg font-semibold mt-2">
                No exercises yet
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                Get started by adding your first exercise below
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("all-exercises")}
              className="bg-blue-600 p-4 rounded-xl items-center mt-6 w-full">
              <Text className="text-white font-semibold text-base">
                + Add Exercise
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={completeWorkout}
              disabled={saving}
              className={`p-4 rounded-xl items-center mt-3 w-full ${
                saving ? "bg-gray-300" : "bg-blue-600"
              }`}>
              <Text className="text-white font-semibold text-base">
                {saving ? "Saving..." : "Complete Workout"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {workout.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
            {workout.map((exercise, exIndex) => (
              <View
                key={exercise._id + exIndex}
                className="bg-[#f4f7ff] p-4 rounded-2xl mb-6 border border-gray-200">
                {/* HEADER */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xl font-semibold text-gray-900">
                    {exercise.name}
                  </Text>

                  <TouchableOpacity
                    onPress={() => deleteExercise(exIndex)}
                    className="p-2">
                    <Ionicons name="trash" size={26} color="#e63946" />
                  </TouchableOpacity>
                </View>

                {/* SETS COUNT */}
                <Text className="text-gray-600 mb-3">
                  {exercise.sets.length} sets •{" "}
                  {exercise.sets.filter((s) => s.completed).length} completed
                </Text>

                {/* SETS BOX */}
                <View className="bg-white p-4 rounded-2xl border border-gray-300">
                  {exercise.sets.map((set, setIndex) => (
                    <View
                      key={setIndex}
                      className={`flex-row items-center justify-between p-3 rounded-xl mb-3 ${
                        set.completed ? "bg-green-100" : "bg-gray-100"
                      }`}>
                      {/* LEFT NUMBER */}
                      <Text className="w-6 text-gray-800 font-semibold text-lg">
                        {setIndex + 1}
                      </Text>

                      {/* INPUT ROW */}
                      <View className="flex-1 flex-row gap-3 px-2">
                        {/* REPS */}
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 mb-1">
                            Reps
                          </Text>
                          <TextInput
                            keyboardType="numeric"
                            value={set.reps > 0 ? String(set.reps) : ""}
                            placeholder="Reps"
                            onChangeText={(t) =>
                              updateSetField(exIndex, setIndex, "reps", t)
                            }
                            className="bg-white border border-gray-300 rounded-lg px-2 py-2"
                          />
                        </View>

                        {/* WEIGHT */}
                        <View className="flex-1">
                          <Text className="text-xs text-gray-500 mb-1">
                            Weight ({unit})
                          </Text>
                          <TextInput
                            keyboardType="numeric"
                            value={set.weight > 0 ? String(set.weight) : ""}
                            placeholder={`Weight (${unit})`}
                            onChangeText={(t) =>
                              updateSetField(exIndex, setIndex, "weight", t)
                            }
                            className="bg-white border border-gray-300 rounded-lg px-2 py-2"
                          />
                        </View>
                      </View>

                      {/* DELETE BTN */}
                      {!set.completed && (
                        <TouchableOpacity
                          onPress={() => toggleCompleteSet(exIndex, setIndex)}
                          disabled={!(set.reps > 0 && set.weight > 0)}
                          className="p-2 mt-4">
                          <Ionicons
                            className={`p-1 border rounded-xl border-gray-300 ${
                              set.completed
                                ? "bg-green-500"
                                : set.reps > 0 && set.weight > 0
                                  ? "bg-white"
                                  : "bg-gray-200"
                            }`}
                            name={
                              set.completed ? "checkmark" : "checkmark-outline"
                            }
                            size={28}
                            color={
                              set.completed
                                ? "white"
                                : set.reps > 0 && set.weight > 0
                                  ? "gray"
                                  : "lightgray"
                            }
                          />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => deleteSet(exIndex, setIndex)}
                        className={`p-1 mt-4 rounded-xl border-gray-300 ${
                          set.completed ? "border border-red-500" : "bg-white"
                        }`}>
                        <Ionicons name="trash" size={28} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* ADD SET BUTTON */}
                  <TouchableOpacity
                    onPress={() => addSet(exIndex)}
                    className="border border-dashed border-blue-500 py-3 rounded-xl mt-1">
                    <Text className="text-center text-blue-600 font-semibold">
                      + Add Set
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {workout.length !== 0 && (
        <>
          <TouchableOpacity
            onPress={() => router.push("all-exercises")}
            className="bg-blue-100 p-4 rounded-xl items-center mt-4 mb-3 border border-blue-200">
            <Text className="text-blue-700 font-semibold text-base">
              + Add Exercise
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={completeWorkout}
            disabled={saving}
            className={`p-4 rounded-xl items-center mb-6 ${
              saving ? "bg-gray-400" : "bg-blue-600"
            }`}>
            <Text className="text-white font-semibold text-base">
              {saving ? "Saving..." : "Complete Workout"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}
