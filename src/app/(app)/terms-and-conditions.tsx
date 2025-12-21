import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-white px-4 py-4 flex-row items-center shadow-sm">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 flex-row gap-4 items-center"
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />

          <Text className="text-xl font-bold text-gray-900">
            Terms & Conditions
          </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}>
          <View className="px-5 py-6">
            {/* Title */}
            <Text className="text-3xl font-extrabold text-gray-900 mb-1">
              Terms of Service
            </Text>
            <Text className="text-sm text-gray-500 mb-6">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>

            {/* Sections */}
            {[
              {
                title: "1. Acceptance of Terms",
                content:
                  "By accessing and using the Fitness App, you agree to be bound by these terms. If you do not agree, please discontinue use of the service.",
              },
              {
                title: "2. Use License",
                content: [
                  "Modify or copy the materials",
                  "Use the materials for commercial purposes",
                  "Attempt to reverse engineer any software",
                  "Remove copyright or proprietary notices",
                ],
              },
              {
                title: "3. Health & Safety Disclaimer",
                content: [
                  "Exercise involves inherent risk of injury",
                  "Consult a physician before starting any program",
                  "You assume all risks associated with use",
                  "Not a substitute for medical advice",
                ],
              },
              {
                title: "4. User Account",
                content: [
                  "Maintain confidentiality of your password",
                  "All activity under your account is your responsibility",
                  "Notify us immediately of unauthorized use",
                ],
              },
              {
                title: "5. Privacy Policy",
                content:
                  "Your use of the App is also governed by our Privacy Policy regarding collection and use of personal data.",
              },
              {
                title: "6. Limitation of Liability",
                content:
                  "We are not liable for any damages resulting from use or inability to use the App, including loss of data or profits.",
              },
              {
                title: "7. Accuracy of Materials",
                content:
                  "Content may contain errors. We do not guarantee accuracy or completeness and may update materials at any time.",
              },
              {
                title: "8. Modifications",
                content:
                  "We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.",
              },
              {
                title: "9. Governing Law",
                content:
                  "These terms are governed by applicable laws, and disputes fall under exclusive jurisdiction of local courts.",
              },
            ].map((section, index) => (
              <View
                key={index}
                className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  {section.title}
                </Text>

                {Array.isArray(section.content) ? (
                  <View className="ml-1">
                    {section.content.map((item, i) => (
                      <View key={i} className="flex-row mb-2">
                        <Text className="text-blue-600 mr-2">•</Text>
                        <Text className="text-gray-700 leading-6 flex-1">
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-700 leading-6">
                    {section.content}
                  </Text>
                )}
              </View>
            ))}

            {/* Contact Card */}
            <View className="bg-blue-600 rounded-2xl p-5 mt-6 shadow-lg">
              <View className="flex-row items-center mb-2">
                <Ionicons name="mail-outline" size={22} color="white" />
                <Text className="text-lg font-semibold text-white ml-2">
                  Contact Us
                </Text>
              </View>
              <Text className="text-blue-100 leading-6">
                Questions about these terms? Reach out to us anytime at{" "}
                <Text className="font-semibold text-white">
                  support@fitnessapp.com
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
