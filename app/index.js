import { Redirect } from "expo-router";

export default function Index() {
  // This is the root entry point of the app.
  // It should ideally check authentication status and redirect accordingly.
  // For now, we redirect to the authentication flow.
  // The (auth) group will handle its own initial screen (e.g., login).
  return <Redirect href="/(auth)/login" />;
}

