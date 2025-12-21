import { useAuth } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

const Layout = () => {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, statusBarStyle: "dark" }}
        />
        <Stack.Screen
          name="exercise-detail"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
            presentation: "transparentModal",
            gestureEnabled: true,
            gestureDirection: "vertical", // <-- important
            statusBarStyle: "dark",
          }}
        />

        <Stack.Screen
          name="active-workout"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="all-exercises"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="history-detail"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="new-exercise"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Terms & Conditions - accessible to all */}
      <Stack.Screen
        name="terms-and-conditions"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
};

export default Layout;
