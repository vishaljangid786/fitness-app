import * as React from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showCode, setShowCode] = React.useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    console.log(emailAddress, password);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert("Error", "Please enter a verification code");
      return;
    }
    setIsLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    } finally {
      // Set loading state to false
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled">
            <View className="flex-1 px-6 justify-center">
              {/* HEADER */}
              <View className="items-center mb-10">
                <View className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 ">
                  <Ionicons name="mail" size={40} color="black" />
                </View>

                <Text className="text-3xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </Text>

                <Text className="text-lg text-gray-600 text-center">
                  We've sent a verification code to {"\n"}
                  <Text className="font-semibold">{emailAddress}</Text>
                </Text>
              </View>

              {/* FORM */}
              <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Enter Verification Code
                </Text>

                {/* Code Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </Text>

                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                    <Ionicons name="key-outline" size={20} color="#6B7280" />
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      className="flex-1 ml-3 text-gray-900 text-center text-lg tracking-widest"
                      editable={!isLoading}
                      secureTextEntry={!showCode}
                    />
                    <TouchableOpacity
                      onPress={() => setShowCode(!showCode)}
                      activeOpacity={0.6}>
                      <Ionicons
                        name={showCode ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={onVerifyPress}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  className={`rounded-xl py-4 shadow-sm mb-4 
                  ${isLoading ? "bg-gray-400" : "bg-green-500"}`}>
                  <View className="flex-row items-center justify-center">
                    {isLoading ? (
                      <Ionicons name="refresh" size={20} color="white" />
                    ) : (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="white"
                      />
                    )}
                    <Text className="text-white font-semibold text-lg ml-2">
                      {isLoading ? "Verifying..." : "Verify Email"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Resend */}
                <TouchableOpacity className="py-2">
                  <Text className="font-medium text-center">
                    Didn't receive the code?{" "}
                    <Text className="text-blue-600">Resend</Text>
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Footer */}
              <View className="mt-6">
                <Text className="text-center text-gray-500 text-sm">
                  Almost there! Just one more step.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          {/* Main */}
          <View className="flex-1">
            {/* header section */}
            <View className="h-[450px]">
              <ImageBackground
                source={{
                  uri: "https://media.istockphoto.com/id/610431768/photo/fitness-club-in-luxury-hotel-interior.jpg?s=612x612&w=0&k=20&c=IkusSsZFq1kauP2FhSSw0Jmx92WuSSvlksesEZGw0ik=",
                }}
                style={{ flex: 1 }}
                resizeMode="cover">
                <View className="absolute inset-0 bg-black/50" />

                <View className="flex-1 justify-center items-center">
                  <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4">
                      <View className="shadow-2xl shadow-black">
                        <Ionicons name="fitness" size={40} color="white" />
                      </View>
                    </View>

                    <Text className="text-3xl font-bold text-white mb-2">
                      Join Fitness App
                    </Text>
                    <Text className="text-lg text-gray-100 text-center">
                      Track your fitness journey{"\n"} and reach your goals
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* FORM */}
            <View className="flex-1 px-6">
              <View className="bg-white rounded-2xl px-6 shadow-sm border border-gray-100 mt-4 mb-4 py-6">
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Create an Account
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border-gray-200">
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <TextInput
                      autoCapitalize="none"
                      value={emailAddress}
                      placeholder="Enter email"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={setEmailAddress}
                      className="flex-1 ml-3 text-gray-900"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border-gray-200">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <TextInput
                      value={password}
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={setPassword}
                      className="flex-1 ml-3 text-gray-900"
                      editable={!isLoading}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.6}>
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-sm text-gray-400 mt-1">
                    Must be at least 8 characters long
                  </Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={onSignUpPress}
                  disabled={isLoading}
                  className={`rounded-xl py-4 shadow-sm mb-4 ${
                    isLoading ? "bg-gray-400" : "bg-blue-600"
                  }`}
                  activeOpacity={0.8}>
                  <View className="flex-row items-center justify-center">
                    {isLoading ? (
                      <Ionicons name="refresh" size={20} color="white" />
                    ) : (
                      <Ionicons
                        name="person-add-outline"
                        size={20}
                        color="white"
                      />
                    )}
                    <Text className="text-white font-semibold text-lg ml-2">
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Terms */}
                <View className="flex-row items-center justify-center">
                  <Text className="text-sm text-gray-500">
                    By signing, you agree to our{" "}
                    <Text className="text-blue-600">Terms of Service</Text> &{" "}
                    <Text className="text-blue-600">Privacy Policy</Text>
                  </Text>
                </View>
              </View>

              {/* Already have an account? */}
              <View className="flex-row py-4 justify-center items-center mb-2">
                <Text className="text-gray-600 ">
                  Already have an account?{" "}
                </Text>
                <Link href="/sign-in" asChild>
                  <TouchableOpacity>
                    <Text className="text-blue-600 font-semibold">Sign in</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
          {/* Start your fitness journey today */}
          <View className="py-6 ">
            <Text className="text-center text-gray-500 text-sm ">
              Ready to take your fitness journey to the next level?
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
