import "../global.css";
import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";

// Guard WebBrowser operations in a safe IIFE so any rejection is swallowed
(function safeInitWebBrowser() {
  try {
    if (typeof WebBrowser?.warmUpAsync === "function") {
      WebBrowser.warmUpAsync().catch(() => {});
    }

    if (typeof WebBrowser?.maybeCompleteAuthSession === "function") {
      try {
        // call and ignore result; some platforms may provide a non-promise result
        // which is why we don't rely on .catch here.
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        WebBrowser.maybeCompleteAuthSession();
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore failures to avoid uncaught promise rejections at startup
  }
})();

const tokenCache = {
  getToken: (key) => SecureStore.getItemAsync(key),
  saveToken: (key, value) => SecureStore.setItemAsync(key, value),
};
// already invoked inside safeInitWebBrowser above; keep for compatibility only if available
if (typeof WebBrowser?.maybeCompleteAuthSession === "function") {
  try {
    // call and ignore return value
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    WebBrowser.maybeCompleteAuthSession();
  } catch (e) {
    // ignore
  }
}

export default function Layout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
