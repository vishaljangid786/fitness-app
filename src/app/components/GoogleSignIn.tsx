import React, { useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO } from "@clerk/clerk-expo";
import { View, Button, Platform, TouchableOpacity, Text, Image, Alert } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignIn() {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Create redirect URL with proper scheme from app.json
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "acme", // Must match the scheme in app.json
        path: "oauth-callback",
      });

      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl,
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({
          session: createdSessionId,
          // Check for session tasks and navigate to custom UI to help users resolve them
          // See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              router.push("/sign-in/tasks");
              return;
            }

            router.push("/");
          },
        });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
      }
    } catch (err: any) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error("Google Sign-In Error:", JSON.stringify(err, null, 2));
      
      // Handle specific OAuth errors
      let errorMessage = "Failed to sign in with Google. Please try again.";
      
      if (err?.errors && err.errors.length > 0) {
        const firstError = err.errors[0];
        if (firstError.message?.includes("disallowed_useragent") || 
            firstError.code === "oauth_access_denied" ||
            firstError.message?.includes("403")) {
          errorMessage = "Google sign-in is not available in this browser. Please try:\n\n1. Using email/password sign-in instead\n2. Opening in Chrome/Safari browser\n3. Checking your Google OAuth settings";
        } else if (firstError.message) {
          errorMessage = firstError.message;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Show error to user
      Alert.alert("Google Sign-In Failed", errorMessage);
      console.error("Google Sign-In Error:", errorMessage);
    }
  }, []);
  {/* <Image
    source={{
      uri: "https://imgs.search.brave.com/1NjKNCJLYkxjPLrKnWVPWI9kpKaExy3iB_VnIqxTbJc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNDYv/ODYxLzY0Ny9zbWFs/bC9nb29nbGUtbG9n/by10cmFuc3BhcmVu/dC1iYWNrZ3JvdW5k/LWZyZWUtcG5nLnBu/Zw",
    }}
    style={{ width: 28, height: 28 }}
  /> */}

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white border-2 border-gray-200 rounded-xl py-4 shadow-sm">
      <View className="flex-row items-center justify-center">
        <Ionicons name="logo-google" size={22} color="#EA4335" />
        <Text className="ml-3 text-gray-900 font-semibold text-lg">
          Continue with Google
        </Text>
      </View>
    </TouchableOpacity>
  );

}
