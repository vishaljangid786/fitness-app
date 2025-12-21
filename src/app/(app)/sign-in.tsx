import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
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
  Modal,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import GoogleSignIn from "../components/GoogleSignIn";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  // Redirect if already signed in
  React.useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  
  // Password reset flow states
  const [resetStep, setResetStep] = React.useState<"email" | "otp" | "newPassword">("email");
  const [resetCode, setResetCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isSettingPassword, setIsSettingPassword] = React.useState(false);
  const [signInResource, setSignInResource] = React.useState<any>(null);

  // Helper function to extract user-friendly error messages
  const getErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred. Please try again.";

    // Clerk errors typically have errors array or message
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      
      // Check for specific error codes
      if (firstError.code === "form_identifier_not_found") {
        return "No account found with this email address. Please check your email or sign up.";
      }
      if (firstError.code === "form_password_incorrect") {
        return "Incorrect password. Please try again or reset your password.";
      }
      if (firstError.code === "form_identifier_exists") {
        return "An account with this email already exists. Please sign in instead.";
      }
      if (firstError.code === "form_password_pwned") {
        return "This password has been found in a data breach. Please choose a different password.";
      }
      if (firstError.code === "form_password_length_too_short") {
        return "Password is too short. Please use at least 8 characters.";
      }
      if (firstError.code === "form_password_not_strong_enough") {
        return "Password is not strong enough. Please use a combination of letters, numbers, and symbols.";
      }
      if (firstError.code === "form_param_format_invalid") {
        return "Invalid email format. Please enter a valid email address.";
      }
      if (firstError.code === "rate_limit_exceeded" || firstError.code === "too_many_requests") {
        const retryAfter =
          firstError?.meta?.retry_after_seconds ??
          firstError?.meta?.retryAfterSeconds ??
          firstError?.meta?.retryAfter ??
          firstError?.retry_after ??
          firstError?.retryAfter ??
          null;

        if (retryAfter && typeof retryAfter === "number") {
          const mins = Math.floor(retryAfter / 60);
          const secs = retryAfter % 60;
          const timeText =
            mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
          return `Too many attempts. Please try again in ${timeText}.`;
        }
        return "Too many attempts. Please try again later.";
      }
      if (firstError.code === "session_exists" || firstError.message?.includes("session already exists")) {
        return "You are already signed in. Redirecting to home...";
      }
      
      // Return the message if available
      return firstError.message || firstError.longMessage || "An error occurred. Please try again.";
    }

    // Handle global rate limit
    if (error.status === 429 || error.code === "rate_limit_exceeded") {
      const retryAfter =
        error?.meta?.retry_after_seconds ??
        error?.meta?.retryAfterSeconds ??
        error?.meta?.retryAfter ??
        error?.retry_after ??
        error?.retryAfter ??
        null;

      if (retryAfter && typeof retryAfter === "number") {
        const mins = Math.floor(retryAfter / 60);
        const secs = retryAfter % 60;
        const timeText =
          mins > 0 ? `${mins}m ${secs.toString().padStart(2, "0")}s` : `${secs}s`;
        return `Too many attempts. Please try again in ${timeText}.`;
      }
      return "Too many attempts. Please try again later.";
    }

    // Check for direct message property
    if (error.message) {
      return error.message;
    }

    // Check for status text (network errors)
    if (error.statusText) {
      return `Network error: ${error.statusText}. Please check your connection and try again.`;
    }

    return "An unexpected error occurred. Please try again.";
  };

  // Ensure any existing session is cleared before signing in
  const ensureSignedOut = async () => {
    if (isSignedIn) {
      try {
        await signOut();
      } catch (err) {
        console.error("Error signing out existing session:", err);
      }
    }
  };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Email & password required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: result.createdSessionId });
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Login failed", err.errors?.[0]?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };


  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!isLoaded) return;

    if (!resetEmail) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    setIsResettingPassword(true);

    try {
      // Create a sign-in attempt to initiate password reset
      const signInAttempt = await signIn.create({
        identifier: resetEmail,
      });

      // Get the email address ID from supported first factors
      const emailFactor = signInAttempt.supportedFirstFactors.find(
        (factor: any) => factor.strategy === "reset_password_email_code"
      ) as any;

      if (!emailFactor || !emailFactor.emailAddressId) {
        throw new Error(
          "Password reset is not available for this account. Please contact support."
        );
      }

      // Prepare password reset using the correct Clerk API
      // This sends a password reset code to the user's email
      await signInAttempt.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: emailFactor.emailAddressId,
      });

      // Store the signIn resource for later use
      setSignInResource(signInAttempt);
      // Move to OTP step
      setResetStep("otp");
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      Alert.alert("Password Reset Failed", errorMessage);
      console.error("Password reset error:", JSON.stringify(err, null, 2));
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!isLoaded || !signInResource) return;

    if (!resetCode || resetCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit code");
      return;
    }

    setIsVerifyingCode(true);

    try {
      // Attempt to verify the reset code
      const result = await signInResource.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
      });

      // If verification successful, move to new password step
      if (result.status === "needs_new_password") {
        setResetStep("newPassword");
      } else {
        throw new Error("Unexpected response from verification");
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      Alert.alert("Verification Failed", errorMessage);
      console.error("OTP verification error:", JSON.stringify(err, null, 2));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Handle new password setting
  const handleSetNewPassword = async () => {
    if (!isLoaded || !signInResource) return;

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Invalid Password", "Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }

    setIsSettingPassword(true);

    try {
      // Reset the password
      const result = await signInResource.resetPassword({
        password: newPassword,
      });

      if (result.status === "complete") {
        Alert.alert(
          "Password Reset Successful",
          "Your password has been reset successfully. You can now sign in with your new password.",
          [
            {
              text: "OK",
              onPress: () => {
                // Reset all states and close modal
                setForgotPasswordModalVisible(false);
                setResetStep("email");
                setResetEmail("");
                setResetCode("");
                setNewPassword("");
                setConfirmPassword("");
                setSignInResource(null);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      Alert.alert("Password Reset Failed", errorMessage);
      console.error("Password reset error:", JSON.stringify(err, null, 2));
    } finally {
      setIsSettingPassword(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (!isLoaded || !signInResource) return;

    setIsResettingPassword(true);

    try {
      // Get the email address ID again
      const emailFactor = signInResource.supportedFirstFactors.find(
        (factor: any) => factor.strategy === "reset_password_email_code"
      ) as any;

      if (emailFactor && emailFactor.emailAddressId) {
        await signInResource.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: emailFactor.emailAddressId,
        });

        Alert.alert("Code Resent", "A new code has been sent to your email.");
        setResetCode("");
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      Alert.alert("Failed to Resend", errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <View className="flex-1">
      {/* SIGN-IN FORM (NO FLEX!) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          {/* HEADER SECTION */}
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
                      <Ionicons name="fitness" size={40} color="white" className="" />
                  </View>

                  <Text className="text-3xl font-bold text-white mb-2">
                    Fitness App
                  </Text>
                  <Text className="text-lg text-gray-100 text-center">
                    Track your fitness journey{"\n"} and reach your goals
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="flex-1 px-6">
            <View className="bg-white rounded-2xl px-6 shadow-sm border border-gray-100 mt-4 mb-6 pt-6">
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Welcome Back
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
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-700">
                    Password
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setResetEmail(emailAddress);
                      setForgotPasswordModalVisible(true);
                    }}
                    activeOpacity={0.7}>
                    <Text className="text-sm text-blue-600 font-medium">
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border-gray-200">
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    value={password}
                    placeholder="Enter password"
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
              </View>
            </View>

            {/* SIGN IN BUTTON */}
            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className={`rounded-xl py-4 shadow-sm mb-4 ${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              }`}
              activeOpacity={0.8}>
              <View className="flex-row items-center justify-center">
                {isLoading ? (
                  <Ionicons name="refresh" size={20} color="white" />
                ) : (
                  <Ionicons name="log-in-outline" size={20} color="white" />
                )}
                <Text className="text-white font-semibold text-lg ml-2">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-gray-500 text-sm">Or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* SIGN IN WITH GOOGLE BUTTON */}
            <GoogleSignIn />

            {/* SIGN UP LINK */}
            <View className="flex-row py-6 justify-center items-center mb-2">
              <Text className="text-gray-600 ">Don't have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* START YOUR FITNESS JOURNEY TODAY */}
            <View className="py-3">
              <Text className="text-center text-gray-500 text-sm ">
                Start your Fitness Journey Today
              </Text>
            </View>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setForgotPasswordModalVisible(false);
          setResetStep("email");
          setResetEmail("");
          setResetCode("");
          setNewPassword("");
          setConfirmPassword("");
          setSignInResource(null);
        }}>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="w-full">
            <View className="bg-white rounded-2xl p-6 shadow-lg">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-bold text-gray-900">
                  {resetStep === "email" && "Reset Password"}
                  {resetStep === "otp" && "Enter Verification Code"}
                  {resetStep === "newPassword" && "Set New Password"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setForgotPasswordModalVisible(false);
                    setResetStep("email");
                    setResetEmail("");
                    setResetCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setSignInResource(null);
                  }}
                  activeOpacity={0.7}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Step 1: Email Input */}
              {resetStep === "email" && (
                <>
                  <Text className="text-gray-600 mb-6">
                    Enter your email address and we'll send you a code to reset
                    your password.
                  </Text>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Email
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                      <Ionicons name="mail-outline" size={20} color="#6B7280" />
                      <TextInput
                        autoCapitalize="none"
                        value={resetEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={setResetEmail}
                        className="flex-1 ml-3 text-gray-900"
                        editable={!isResettingPassword}
                        keyboardType="email-address"
                        autoFocus
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setForgotPasswordModalVisible(false);
                        setResetEmail("");
                      }}
                      disabled={isResettingPassword}
                      className="flex-1 border-2 border-gray-300 rounded-xl py-4">
                      <Text className="text-gray-700 font-semibold text-center">
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      disabled={isResettingPassword}
                      className={`flex-1 rounded-xl py-4 ${
                        isResettingPassword ? "bg-gray-400" : "bg-blue-600"
                      }`}>
                      <View className="flex-row items-center justify-center">
                        {isResettingPassword ? (
                          <>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">
                              Sending...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="mail-outline" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">
                              Send Reset Code
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 2: OTP Input */}
              {resetStep === "otp" && (
                <>
                  <Text className="text-gray-600 mb-6">
                    We've sent a 6-digit code to{" "}
                    <Text className="font-semibold text-gray-900">
                      {resetEmail}
                    </Text>
                    . Please enter it below.
                  </Text>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                      <Ionicons name="key-outline" size={20} color="#6B7280" />
                      <TextInput
                        value={resetCode}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={(text) => setResetCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                        className="flex-1 ml-3 text-gray-900 text-center text-lg tracking-widest"
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!isVerifyingCode}
                        autoFocus
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={isResettingPassword}
                    className="mb-4">
                    <Text className="text-blue-600 text-center text-sm">
                      Didn't receive the code?{" "}
                      <Text className="font-semibold">Resend</Text>
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setResetStep("email");
                        setResetCode("");
                      }}
                      disabled={isVerifyingCode}
                      className="flex-1 border-2 border-gray-300 rounded-xl py-4">
                      <Text className="text-gray-700 font-semibold text-center">
                        Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleVerifyOTP}
                      disabled={isVerifyingCode || resetCode.length !== 6}
                      className={`flex-1 rounded-xl py-4 ${
                        isVerifyingCode || resetCode.length !== 6
                          ? "bg-gray-400"
                          : "bg-blue-600"
                      }`}>
                      <View className="flex-row items-center justify-center">
                        {isVerifyingCode ? (
                          <>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">
                              Verifying...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color="white"
                            />
                            <Text className="text-white font-semibold ml-2">
                              Verify Code
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: New Password */}
              {resetStep === "newPassword" && (
                <>
                  <Text className="text-gray-600 mb-6">
                    Please enter your new password below.
                  </Text>

                  <View className="mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#6B7280"
                      />
                      <TextInput
                        value={newPassword}
                        placeholder="Enter new password"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={setNewPassword}
                        className="flex-1 ml-3 text-gray-900"
                        editable={!isSettingPassword}
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        activeOpacity={0.6}>
                        <Ionicons
                          name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-gray-400 mt-1">
                      Must be at least 8 characters long
                    </Text>
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#6B7280"
                      />
                      <TextInput
                        value={confirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor="#9CA3AF"
                        onChangeText={setConfirmPassword}
                        className="flex-1 ml-3 text-gray-900"
                        editable={!isSettingPassword}
                        secureTextEntry={!showConfirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        activeOpacity={0.6}>
                        <Ionicons
                          name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                          size={20}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => {
                        setResetStep("otp");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={isSettingPassword}
                      className="flex-1 border-2 border-gray-300 rounded-xl py-4">
                      <Text className="text-gray-700 font-semibold text-center">
                        Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSetNewPassword}
                      disabled={isSettingPassword}
                      className={`flex-1 rounded-xl py-4 ${
                        isSettingPassword ? "bg-gray-400" : "bg-green-600"
                      }`}>
                      <View className="flex-row items-center justify-center">
                        {isSettingPassword ? (
                          <>
                            <Ionicons name="refresh" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">
                              Resetting...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color="white"
                            />
                            <Text className="text-white font-semibold ml-2">
                              Reset Password
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
