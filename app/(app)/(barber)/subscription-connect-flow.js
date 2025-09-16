/**
 * subscription-connect-flow.js
 * 
 * This file provides a complete implementation of the subscription flow
 * with Stripe Connect onboarding integration for barber accounts.
 */
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile, updateUserProfile, auth } from "@/services/firebase";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import theme from "@/styles/theme";
import { ScreenContainer, ScreenHeader } from "@/components/LayoutComponents";
import { Button, Card } from "@/components/UIComponents";
import { stripeConfig, stripeBackendUrl } from "@/services/stripeConfig";

const SubscriptionConnectFlow = () => {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // State for subscription and Connect account
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [connectStatus, setConnectStatus] = useState(null);
  const [showConnectButton, setShowConnectButton] = useState(false);
  
  // Log configuration details
  useEffect(() => {
    console.log("🔍 STRIPE CONFIGURATION DEBUG INFO:");
    console.log(`- Build Type: ${Constants.expoConfig?.extra?.buildType || 'unknown'}`);
    console.log(`- Is TestFlight: ${Constants.expoConfig?.extra?.isTestFlight || false}`);
    console.log(`- Stripe Key Type: ${stripeConfig.publishableKey?.startsWith('pk_test_') ? 'TEST' : 'LIVE'}`);
    console.log(`- Backend URL: ${stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app"}`);
    
    // Validate backend health
    checkBackendHealth();
  }, []);
  
  // Check backend health
  const checkBackendHealth = async () => {
    try {
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      const response = await fetch(`${backendUrl}/health`);
      const data = await response.json();
      console.log(`- Backend Health Check: ${response.ok ? 'OK' : 'Failed'}`);
      console.log(`- Backend Response: ${JSON.stringify(data)}`);
    } catch (e) {
      console.error(`- Backend Health Check Error: ${e.message}`);
    }
  };

  // Fetch payment sheet parameters from backend
  const fetchPaymentSheetParams = async () => {
    try {
      console.log("Fetching payment sheet params from backend...");
      
      // Use stripeBackendUrl from stripeConfig.js
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      console.log("Using backend URL:", backendUrl);
      
      // Get current user ID
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      console.log("User ID for payment:", userId);
      
      // Create a payment intent for subscription
      const response = await fetch(`${backendUrl}/api/create-subscription-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          email: auth.currentUser?.email,
          name: profile?.name || "Barber User",
          price: "price_1NWfGP4MureyHjXxYMdeBCtX", // Your subscription price ID
          metadata: {
            userId: userId,
            type: 'subscription',
            flow: 'connect'  // Important! Tells backend this is a Connect flow
          }
        })
      });
      
      // Log the raw response status
      console.log("Backend response status:", response.status);
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP Error: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP Error: ${response.status}`;
        }
        console.error("Payment intent creation failed:", errorMessage);
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const data = await response.json();
      console.log("Raw API response data:", JSON.stringify(data).substring(0, 100) + "...");
      
      // Validate the response data
      if (!data.clientSecret) {
        console.error("Missing client secret in response:", data);
        throw new Error("Invalid response: Missing client secret");
      }
      
      console.log("Payment sheet params fetched successfully");
      
      return {
        clientSecret: data.clientSecret,
        ephemeralKey: data.ephemeralKey,
        customer: data.customer,
        publishableKey: stripeConfig.publishableKey
      };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      throw error;
    }
  };
  
  // Initialize payment sheet
  const initializePaymentSheet = async () => {
    try {
      // Fetch payment intent data from backend
      const paymentData = await fetchPaymentSheetParams();
      
      // Use the exact field names that come from the server
      const { clientSecret, ephemeralKey, customer } = paymentData;
      
      // Detailed logging
      console.log("Payment Sheet Initialization Parameters:", {
        hasClientSecret: !!clientSecret,
        hasEphemeralKey: !!ephemeralKey,
        hasCustomerId: !!customer
      });
      
      if (!clientSecret) {
        console.error("Missing client secret in payment sheet params");
        Alert.alert("Error", "Could not initialize payment. Missing payment intent.");
        return false;
      }

      // Initialize with proper parameters
      console.log("Initializing payment sheet with Stripe SDK...");
      
      const paymentSheetParams = {
        merchantDisplayName: "ScheduleSync AI LLC",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        paymentMethodTypes: ['card', 'ideal', 'bancontact', 'sofort', 'sepa_debit', 'afterpay_clearpay', 'klarna'],
        allowsDelayedPaymentMethods: true,
        returnURL: "barberapp://payment-return",
        defaultBillingDetails: {
          name: profile?.name || "Valued Customer",
        },
        appearance: {
          colors: {
            primary: theme.colors.primary,
            background: '#FFFFFF',
            componentBackground: '#F5F5F5',
            componentBorder: '#E0E0E0',
            componentDivider: '#E0E0E0',
            primaryText: '#000000',
            secondaryText: '#767676',
            componentText: '#000000',
          }
        }
      };
      
      // Initialize the payment sheet
      const { error } = await initPaymentSheet(paymentSheetParams);
      
      if (error) {
        console.error("initPaymentSheet error:", {
          code: error.code,
          message: error.message,
          stripeErrorCode: error.stripeErrorCode || 'none',
          declineCode: error.declineCode || 'none',
          type: error.type || 'unknown'
        });
        
        let errorTitle = "Payment Setup Error";
        let errorMessage = error.message;
        
        switch (error.code) {
          case "Failed":
            errorMessage = "We couldn't set up the payment. Please check your internet connection and try again.";
            break;
          case "InvalidRequestError":
            errorMessage = "There was an issue with our payment system configuration.";
            break;
          case "AuthenticationError":
            errorMessage = "Payment authentication failed. Please try again or contact support.";
            break;
          default:
            errorMessage = `Payment setup failed: ${error.message}`;
        }
        
        Alert.alert(errorTitle, errorMessage);
        return false;
      }
      return true;
    } catch (e) {
      console.error("initializePaymentSheet exception:", e);
      Alert.alert("Payment Error", "Could not initialize payment sheet. Please try again.");
      return false;
    }
  };
  
  // Handle subscription button press
  const handleSubscribe = async () => {
    setProcessing(true);
    setError("");
    
    try {
      console.log("Starting subscription process");
      console.log("Using Stripe key:", stripeConfig.publishableKey.substring(0, 7) + "...");
      console.log("Using backend URL:", stripeConfig.backendUrl || stripeBackendUrl);
      
      // Initialize the payment sheet
      const initialized = await initializePaymentSheet();
      if (!initialized) {
        console.error("Failed to initialize payment sheet");
        
        Alert.alert(
          "Payment Setup Issue", 
          "We're having trouble setting up the payment screen. This might be due to network issues or payment method availability in your region. Please try again or contact support.",
          [{ text: "OK" }]
        );
        
        setProcessing(false);
        return;
      }
      
      console.log("Payment sheet initialized successfully, presenting to user");
      
      // Present payment sheet to user
      const { error: presentError } = await presentPaymentSheet();
  
      if (presentError) {
        if (presentError.code === "Canceled") {
          console.log("Payment sheet canceled by user");
          setProcessing(false);
          return;
        }
        
        // Log error details
        console.error("Payment sheet presentation error:", {
          code: presentError.code,
          message: presentError.message,
          type: presentError.type,
          stripeErrorCode: presentError.stripeErrorCode,
          declineCode: presentError.declineCode
        });
        
        // User-friendly error message
        let errorMessage = presentError.message;
        let errorTitle = "Payment Error";
        
        if (presentError.code === "Failed") {
          errorTitle = "Payment Failed";
          
          if (presentError.stripeErrorCode === "card_declined") {
            if (presentError.declineCode === "insufficient_funds") {
              errorMessage = "Your card has insufficient funds. Please try a different card.";
            } else if (presentError.declineCode === "lost_card" || presentError.declineCode === "stolen_card") {
              errorMessage = "This card has been reported lost or stolen and cannot be used.";
            } else if (presentError.declineCode === "expired_card") {
              errorMessage = "Your card has expired. Please use a different card.";
            } else {
              errorMessage = "Your card was declined. Please try a different payment method.";
            }
          } else if (presentError.stripeErrorCode === "processing_error") {
            errorMessage = "There was an error processing your card. Please try again or use a different card.";
          } else if (presentError.stripeErrorCode === "incorrect_cvc") {
            errorMessage = "The security code (CVC) you entered is incorrect. Please check and try again.";
          } else if (presentError.stripeErrorCode === "no_payment_method_types_found") {
            errorMessage = "No payment methods are available. Please try again later or contact support.";
          } else if (!presentError.stripeErrorCode && presentError.message?.includes("No payment method")) {
            errorMessage = "Please select a payment method to continue.";
          } else {
            errorMessage = "The payment could not be processed. Please check your payment details and try again.";
          }
        }
        
        const diagnosticCode = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        
        Alert.alert(
          errorTitle, 
          `${errorMessage}\n\n(Reference: ${diagnosticCode})`,
          [{ text: "OK" }]
        );
        setProcessing(false);
        return;
      }
      
      console.log("Payment successful! Starting Connect onboarding...");
      
      // If we reach here, payment was successful - start Connect onboarding
      await startConnectOnboarding();
      
    } catch (error) {
      console.error("Error in handleSubscribe:", error);
      setError(error.message || "An unexpected error occurred");
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };
  
  // Start Connect onboarding process
  const startConnectOnboarding = async () => {
    try {
      setProcessing(true);
      
      // Call the backend to create a Connect account and get onboarding URL
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      const response = await fetch(`${backendUrl}/api/connect/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          name: profile?.name || "Barber User"
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create Connect account");
      }
      
      const { accountLinkUrl } = await response.json();
      
      if (!accountLinkUrl) {
        throw new Error("No account link URL returned from server");
      }
      
      console.log("Got Connect onboarding URL:", accountLinkUrl.substring(0, 30) + "...");
      
      // Update user profile to indicate payment was successful
      const user = auth.currentUser;
      const paymentInfo = {
        subscriptionActive: true,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
      
      await updateUserProfile(user.uid, { 
        paymentInfo,
        stripeConnectStatus: 'pending_verification'
      });
      
      // Show success message before redirecting
      Alert.alert(
        "Subscription Activated!",
        "Your subscription is now active. Next, you'll need to complete the verification process to receive payments.",
        [
          { 
            text: "Continue to Verification", 
            onPress: () => {
              // Open the Connect onboarding URL
              Linking.openURL(accountLinkUrl);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("Error starting Connect onboarding:", error);
      Alert.alert(
        "Verification Setup Error",
        "Your subscription was activated, but we couldn't start the verification process. Please try again from the profile page."
      );
    } finally {
      setProcessing(false);
    }
  };
  
  // Resume Connect onboarding if it was interrupted
  const resumeConnectOnboarding = async () => {
    try {
      setProcessing(true);
      
      // Call the backend to get a new onboarding URL
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      const response = await fetch(`${backendUrl}/api/connect/resume-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: auth.currentUser?.uid
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resume Connect onboarding");
      }
      
      const { accountLinkUrl } = await response.json();
      
      if (!accountLinkUrl) {
        throw new Error("No account link URL returned from server");
      }
      
      // Open the Connect onboarding URL
      Linking.openURL(accountLinkUrl);
      
    } catch (error) {
      console.error("Error resuming Connect onboarding:", error);
      Alert.alert(
        "Verification Error",
        "We couldn't resume the verification process. Please try again later or contact support."
      );
    } finally {
      setProcessing(false);
    }
  };
  
  // Fetch Connect account status
  const fetchConnectStatus = async () => {
    try {
      // Call the backend to get Connect account status
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      const response = await fetch(`${backendUrl}/api/connect/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to get Connect status");
      }
      
      const statusData = await response.json();
      setConnectStatus(statusData.status);
      
      // Show Connect button if verification is incomplete or not started
      setShowConnectButton(
        statusData.status === 'incomplete' || 
        statusData.status === 'not_started'
      );
      
      return statusData;
    } catch (error) {
      console.error("Error fetching Connect status:", error);
      return null;
    }
  };
  
  // Fetch user profile data
  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/login");
        setLoading(false);
        return;
      }
      
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      
      if (userProfile.paymentInfo) {
        setSubscriptionActive(userProfile.paymentInfo.subscriptionActive || false);
        setSubscriptionEndDate(userProfile.paymentInfo.subscriptionEndDate || "");
        setCardLast4(userProfile.paymentInfo.cardLast4 || "");
        setCardBrand(userProfile.paymentInfo.cardBrand || "");
      }
      
      // Fetch Connect status
      await fetchConnectStatus();
      
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load subscription information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(fetchProfileData);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return "Invalid Date";
    }
  };
  
  // Cancel subscription
  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? You will lose access to premium features and will no longer appear in customer searches.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setProcessing(true);
            try {
              // Call backend to cancel subscription
              const backendUrl = stripeConfig.backendUrl || stripeBackendUrl;
              const response = await fetch(`${backendUrl}/api/cancel-subscription`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`
                }
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to cancel subscription");
              }
              
              // Update local state
              const user = auth.currentUser;
              const paymentInfo = {
                ...profile.paymentInfo,
                subscriptionActive: false,
                subscriptionEndDate: new Date().toISOString(),
              };
              
              await updateUserProfile(user.uid, { paymentInfo });
              await fetchProfileData();
              
              Alert.alert("Subscription Cancelled", "Your subscription has been cancelled successfully.");
              
            } catch (err) {
              console.error("Error cancelling subscription:", err);
              Alert.alert("Cancellation Error", err.message || "Failed to cancel subscription.");
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Subscription" leftAction={() => router.back()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Check for valid Stripe configuration
  if (!stripeConfig.publishableKey) {
    console.error("Missing Stripe publishable key!");
    return (
      <ScreenContainer>
        <ScreenHeader title="Subscription" leftAction={() => router.back()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Payment system configuration error. Please contact support.</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <StripeProvider
      publishableKey={stripeConfig.publishableKey}
      merchantIdentifier={stripeConfig.merchantIdentifier || "merchant.com.barberapp"}
      urlScheme="barberapp"
    >
      <ScreenContainer>
        <ScreenHeader title="My Subscription" leftAction={() => router.back()} />
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          
          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Active subscription UI */}
          {subscriptionActive && (
            <Card style={styles.card}>
              <View style={styles.statusContainer_active}>
                <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
                <Text style={styles.statusText_active}>Subscription Active</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Renews On:</Text>
                <Text style={styles.infoValue}>{formatDate(subscriptionEndDate)}</Text>
              </View>
              
              {/* Connect account verification status */}
              <View style={styles.verificationSection}>
                <Text style={styles.sectionTitle}>Payment Account Verification</Text>
                
                {connectStatus === 'verified' && (
                  <View style={styles.verificationStatus_success}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                    <Text style={styles.verificationText_success}>
                      Verification Complete. You can receive payments.
                    </Text>
                  </View>
                )}
                
                {connectStatus === 'pending' && (
                  <View style={styles.verificationStatus_pending}>
                    <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
                    <Text style={styles.verificationText_pending}>
                      Verification in progress. This may take 1-2 business days.
                    </Text>
                  </View>
                )}
                
                {(connectStatus === 'incomplete' || connectStatus === 'not_started') && (
                  <View style={styles.verificationStatus_incomplete}>
                    <Ionicons name="alert-circle-outline" size={24} color={theme.colors.danger} />
                    <Text style={styles.verificationText_incomplete}>
                      Verification incomplete. You must complete verification to receive payments.
                    </Text>
                    <Button
                      title="Complete Verification"
                      onPress={resumeConnectOnboarding}
                      disabled={processing}
                      style={styles.verifyButton}
                      icon={processing ? <ActivityIndicator size="small" color={theme.colors.white} /> : null}
                    />
                  </View>
                )}
              </View>
              
              {/* Cancel subscription button */}
              <Button 
                title="Cancel Subscription"
                onPress={handleCancelSubscription}
                disabled={processing}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
                icon={processing ? <ActivityIndicator size="small" color={theme.colors.white} /> : <Ionicons name="close-circle-outline" size={20} color={theme.colors.white} />}
              />
            </Card>
          )}
          
          {/* Inactive subscription UI */}
          {!subscriptionActive && (
            <Card style={styles.card}>
              <View style={styles.statusContainer_inactive}>
                <Ionicons name="alert-circle" size={28} color={theme.colors.warning} />
                <Text style={styles.statusText_inactive}>Subscription Inactive</Text>
              </View>
              
              <Text style={styles.planDetailsTitle}>Unlock Premium Features</Text>
              
              <Text style={styles.planDetailsText}>
                Subscribe for $30/month to appear in customer searches, manage appointments seamlessly, and access all barber tools.
              </Text>
              
              {/* Important: Explain the verification process to barbers */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
                <Text style={styles.infoBoxText}>
                  After subscribing, you'll need to complete a verification process to receive payments.
                  Please have your ID and banking information ready.
                </Text>
              </View>
              
              {/* Subscribe button */}
              <Button 
                title={processing ? "Processing..." : "Subscribe Now ($30/month)"}
                onPress={handleSubscribe}
                disabled={processing}
                style={styles.subscribeButton}
                icon={processing ? <ActivityIndicator size="small" color={theme.colors.white} /> : <Ionicons name="sparkles-outline" size={20} color={theme.colors.white} />}
              />
            </Card>
          )}
        </ScrollView>
      </ScreenContainer>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.regular,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: "center",
    marginBottom: theme.spacing.medium,
    fontSize: theme.typography.fontSize.medium,
  },
  card: {
    padding: theme.spacing.medium,
  },
  statusContainer_active: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.large,
    paddingVertical: theme.spacing.small,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
  },
  statusText_active: {
    fontSize: theme.typography.fontSize.large,
    fontWeight: "bold",
    color: theme.colors.success,
    marginLeft: theme.spacing.small,
  },
  statusContainer_inactive: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
  },
  statusText_inactive: {
    fontSize: theme.typography.fontSize.large,
    fontWeight: "bold",
    color: theme.colors.warning,
    marginLeft: theme.spacing.small,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.small,
    paddingVertical: theme.spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textPrimary,
  },
  planDetailsTitle: {
    fontSize: theme.typography.fontSize.xlarge - 2,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.small,
  },
  planDetailsText: {
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: theme.typography.lineHeight.medium,
    marginBottom: theme.spacing.large,
  },
  subscribeButton: {
    marginTop: theme.spacing.medium,
  },
  cancelButton: {
    marginTop: theme.spacing.large,
    backgroundColor: theme.colors.danger,
  },
  cancelButtonText: {
    color: theme.colors.white,
  },
  verificationSection: {
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.medium,
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.medium,
  },
  verificationStatus_success: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
  },
  verificationText_success: {
    marginLeft: theme.spacing.small,
    color: theme.colors.success,
    fontWeight: "500",
    flex: 1,
  },
  verificationStatus_pending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.warningLight,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
  },
  verificationText_pending: {
    marginLeft: theme.spacing.small,
    color: theme.colors.warning,
    fontWeight: "500",
    flex: 1,
  },
  verificationStatus_incomplete: {
    backgroundColor: theme.colors.dangerLight,
    padding: theme.spacing.small,
    borderRadius: theme.borderRadius.small,
  },
  verificationText_incomplete: {
    marginLeft: theme.spacing.small + 24,
    marginBottom: theme.spacing.medium,
    color: theme.colors.danger,
    fontWeight: "500",
  },
  verifyButton: {
    marginTop: theme.spacing.small,
    backgroundColor: theme.colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.infoLight,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.large,
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    marginLeft: theme.spacing.small,
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.info,
  },
});

export default SubscriptionConnectFlow;