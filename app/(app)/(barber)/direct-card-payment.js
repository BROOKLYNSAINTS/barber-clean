import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile, updateUserProfile, auth } from "@/services/firebase";
import { StripeProvider, CardField, useStripe } from "@stripe/stripe-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Constants from "expo-constants";
import theme from "@/styles/theme";
import { ScreenContainer, ScreenHeader } from "@/components/LayoutComponents";
import { Button, Card } from "@/components/UIComponents";
import { stripeConfig, stripeBackendUrl } from "@/services/stripeConfig";

/**
 * Alternative subscription payment screen that uses direct CardField
 * instead of PaymentSheet to avoid payment method display issues
 */
const DirectCardPaymentScreen = () => {
  const router = useRouter();
  const { createPaymentMethod, createToken, confirmPayment } = useStripe();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  
  // States for subscription
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("");

  // Log important configuration details for debugging
  useEffect(() => {
    console.log("🔍 STRIPE CONFIGURATION DEBUG INFO:");
    console.log(`- Build Type: ${Constants.expoConfig?.extra?.buildType || 'unknown'}`);
    console.log(`- Is TestFlight: ${Constants.expoConfig?.extra?.isTestFlight || false}`);
    console.log(`- Stripe Key Type: ${stripeConfig.publishableKey?.startsWith('pk_test_') ? 'TEST' : 'LIVE'}`);
    console.log(`- Backend URL: ${stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app"}`);
  }, []);

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
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load subscription information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(fetchProfileData);

  // Create a payment intent on the server
  const createPaymentIntent = async () => {
    try {
      const backendUrl = stripeConfig.backendUrl || stripeBackendUrl || "https://barber-backend-ten.vercel.app";
      const userId = auth.currentUser?.uid || `test-user-${Date.now()}`;
      
      console.log("Creating payment intent...");
      const response = await fetch(`${backendUrl}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 30, // $30 for subscription
          currency: 'usd',
          description: "Monthly Barber Subscription",
          service_name: "Monthly Barber Subscription",
          barber_name: profile?.name || "Barber User",
          metadata: {
            userId: userId,
            type: 'subscription',
          }
        })
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `HTTP Error: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP Error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      if (!data.clientSecret) {
        throw new Error("Invalid response: Missing client secret");
      }
      
      console.log("Payment intent created successfully");
      return data.clientSecret;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  };

  const handleSubscribe = async () => {
    try {
      // Validate card is complete
      if (!cardComplete) {
        Alert.alert("Error", "Please enter complete card details.");
        return;
      }
      
      setProcessing(true);
      setError("");
      
      // First, create a payment intent on the server
      const clientSecret = await createPaymentIntent();
      
      // Confirm the payment
      const { error: paymentError, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });
      
      if (paymentError) {
        console.error("Payment error:", paymentError);
        
        // Extract error details
        let errorMessage = paymentError.message || "Payment failed. Please try again.";
        
        if (paymentError.code === "Failed") {
          if (paymentError.stripeErrorCode === "card_declined") {
            if (paymentError.declineCode === "insufficient_funds") {
              errorMessage = "Your card has insufficient funds. Please try a different card.";
            } else if (paymentError.declineCode === "lost_card" || paymentError.declineCode === "stolen_card") {
              errorMessage = "This card has been reported lost or stolen and cannot be used.";
            } else if (paymentError.declineCode === "expired_card") {
              errorMessage = "Your card has expired. Please use a different card.";
            } else {
              errorMessage = "Your card was declined. Please try a different payment method.";
            }
          } else if (paymentError.stripeErrorCode === "processing_error") {
            errorMessage = "There was an error processing your card. Please try again or use a different card.";
          } else if (paymentError.stripeErrorCode === "incorrect_cvc") {
            errorMessage = "The security code (CVC) you entered is incorrect. Please check and try again.";
          }
        }
        
        // Include a diagnostic code for customer support
        const diagnosticCode = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        Alert.alert("Payment Failed", `${errorMessage}\n\n(Reference: ${diagnosticCode})`);
        setProcessing(false);
        return;
      }
      
      if (paymentIntent.status === 'Succeeded') {
        console.log("Payment successful!");
        
        // Update subscription status
        const user = auth.currentUser;
        
        // Calculate subscription end date (1 month from now)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        const paymentInfo = {
          subscriptionActive: true,
          subscriptionId: `sub_${Date.now()}`,
          subscriptionEndDate: endDate.toISOString(),
          // Use card details from the completed card input
          cardLast4: cardDetails?.last4 || "****",
          cardBrand: cardDetails?.brand || "Card",
        };
        
        await updateUserProfile(user.uid, { paymentInfo });
        await fetchProfileData();
        
        Alert.alert(
          "Subscription Activated!", 
          "Welcome! Your $30 monthly subscription is now active.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Payment Processing", 
          "Your payment is being processed. You'll receive a confirmation once it's complete."
        );
      }
    } catch (error) {
      console.error("Error in handleSubscribe:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

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
              // Mock cancellation
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

  const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !dateString.includes('-')) return "N/A";
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return "Invalid Date";
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Subscription" leftAction={() => router.back()} />
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </ScreenContainer>
    );
  }

  // Make sure we have a valid Stripe key
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
    >
      <ScreenContainer>
        <ScreenHeader title="My Subscription" leftAction={() => router.back()} />
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          
          {error && <Text style={styles.errorText}>{error}</Text>}

          {subscriptionActive ? (
            <Card style={styles.card}>
              <View style={styles.statusContainer_active}>
                <Ionicons name="checkmark-circle" size={28} color={theme.colors.success} />
                <Text style={styles.statusText_active}>Subscription Active</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Renews On:</Text>
                <Text style={styles.infoValue}>{formatDate(subscriptionEndDate)}</Text>
              </View>
              {cardLast4 && cardBrand && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment Method:</Text>
                  <Text style={styles.infoValue}>{cardBrand} ending in {cardLast4}</Text>
                </View>
              )}
              <Button 
                title="Cancel Subscription"
                onPress={handleCancelSubscription}
                disabled={processing}
                style={styles.cancelButton}
                textStyle={styles.cancelButtonText}
                icon={processing ? <ActivityIndicator size="small" color={theme.colors.white} /> : <Ionicons name="close-circle-outline" size={20} color={theme.colors.white} />}
              />
            </Card>
          ) : (
            <Card style={styles.card}>
              <View style={styles.statusContainer_inactive}>
                <Ionicons name="alert-circle" size={28} color={theme.colors.warning} />
                <Text style={styles.statusText_inactive}>Subscription Inactive</Text>
              </View>
              <Text style={styles.planDetailsTitle}>Unlock Premium Features</Text>
              <Text style={styles.planDetailsText}>
                Subscribe for $30/month to appear in customer searches, manage appointments seamlessly, and access all barber tools.
              </Text>
              
              {/* Direct Card Input Field - replaces the PaymentSheet */}
              <Text style={styles.cardLabel}>Card Information</Text>
              <CardField
                postalCodeEnabled={true}
                placeholder={{
                  number: "4242 4242 4242 4242",
                }}
                cardStyle={styles.cardStyle}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardComplete(cardDetails.complete);
                  setCardDetails(cardDetails);
                }}
              />
              
              <Button 
                title={processing ? "Processing..." : "Subscribe Now ($30/month)"}
                onPress={handleSubscribe}
                disabled={processing || !cardComplete}
                style={[styles.subscribeButton, !cardComplete && styles.disabledButton]}
                icon={processing ? <ActivityIndicator size="small" color={theme.colors.white} /> : <Ionicons name="sparkles-outline" size={20} color={theme.colors.white} />}
              />
              
              <Text style={styles.securePaymentText}>
                <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} />
                {" Secure payment powered by Stripe"}
              </Text>
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
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff3b30",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusContainer_active: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: "#e6f7ef",
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusText_active: {
    fontSize: 18, 
    fontWeight: "bold",
    color: "#34c759",
    marginLeft: 8,
  },
  statusContainer_inactive: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 10,
    backgroundColor: "#fff9e6",
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  statusText_inactive: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff9500",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6c6c6c",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
  },
  planDetailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  planDetailsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 8,
  },
  cardField: {
    width: "100%",
    height: 50,
    marginBottom: 20,
  },
  cardStyle: {
    backgroundColor: "#f8f8f8",
    textColor: "#333333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  subscribeButton: {
    marginTop: 16,
    backgroundColor: "#007aff",
    borderRadius: 8,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: "#ff3b30",
  },
  cancelButtonText: {
    color: "#ffffff",
  },
  securePaymentText: {
    fontSize: 12,
    color: "#6c6c6c",
    textAlign: "center",
    marginTop: 16,
  },
});

export default DirectCardPaymentScreen;