// src/components/payment/payment-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";
import {
  PLANS,
  getPlanById,
  ADDITIONAL_WEBSITE_PRICING,
} from "@/config/stripe";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Pencil, Check, X, LockIcon } from "lucide-react";

interface PaymentFormProps {
  productId: string;
  interval?: "monthly" | "annual";
  customerData: {
    email: string;
    name: string;
  };
  onSuccess: (productId: string) => void;
  isAdditionalWebsite?: boolean;
  planType?: string;
}

export function PaymentForm({
  productId,
  interval = "monthly",
  customerData,
  onSuccess,
  isAdditionalWebsite = false,
  planType,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [cardError, setCardError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(customerData.email || "");
  const [originalEmail] = useState(customerData.email || "");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  useEffect(() => {
    // Ensure email is set correctly from props
    if (customerData.email && !email) {
      setEmail(customerData.email);
    }
  }, [customerData.email]);

  // Get plan/pricing details with improved logic
  let plan, priceInfo, basePrice, displayName;

  if (isAdditionalWebsite && planType) {
    // Additional website purchase - use the ADDITIONAL_WEBSITE_PRICING
    const additionalPricing =
      ADDITIONAL_WEBSITE_PRICING[
        planType as keyof typeof ADDITIONAL_WEBSITE_PRICING
      ];

    if (additionalPricing) {
      basePrice = additionalPricing.amount;
      displayName = additionalPricing.name;
      priceInfo = {
        id: additionalPricing.priceId,
        amount: additionalPricing.amount,
      };
    } else {
      console.error(
        `No additional website pricing found for plan type: ${planType}`
      );
      // Fallback to business plan pricing
      const fallbackPricing = ADDITIONAL_WEBSITE_PRICING.business;
      basePrice = fallbackPricing.amount;
      displayName = fallbackPricing.name;
      priceInfo = {
        id: fallbackPricing.priceId,
        amount: fallbackPricing.amount,
      };
    }
  } else {
    // Regular plan purchase
    plan = getPlanById(productId);

    if (plan) {
      priceInfo = plan.prices[interval];
      basePrice = priceInfo
        ? interval === "annual"
          ? priceInfo.yearlyTotal
          : priceInfo.amount
        : 0;
      displayName = plan?.name;
    } else {
      console.error(`No plan found for productId: ${productId}`);
      // This should not happen, but provide a fallback
      priceInfo = null;
      basePrice = 0;
      displayName = "Unknown Plan";
    }
  }

  // Early return if we don't have valid pricing info
  if (!priceInfo) {
    return (
      <div className="text-center p-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Invalid Plan Configuration
        </h3>
        <p className="text-gray-600 mb-4">
          {isAdditionalWebsite
            ? `Unable to find pricing for additional website on ${planType} plan.`
            : `Unable to find pricing for the selected plan: ${productId}`}
        </p>
        <div className="text-sm text-gray-500">
          <p>Debug Info:</p>
          <p>Product ID: {productId}</p>
          <p>Plan Type: {planType || "N/A"}</p>
          <p>Is Additional Website: {isAdditionalWebsite ? "Yes" : "No"}</p>
          <p>Interval: {interval}</p>
        </div>
      </div>
    );
  }

  // Calculate discounted price (now works for both regular plans AND additional websites)
  const discountedPrice = isPromoApplied
    ? basePrice - basePrice * (promoDiscount / 100)
    : basePrice;

  const handleApplyPromo = async () => {
    // REMOVED the condition that prevented promo codes on additional websites
    if (!promoCode.trim() || !priceInfo) return;

    setIsValidatingPromo(true);

    try {
      // Call the API to validate the promo code with Stripe
      const response = await fetch("/api/stripe/validate-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promoCode,
          priceId: priceInfo.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid promo code");
      }

      const result = await response.json();

      if (result.valid) {
        setIsPromoApplied(true);
        setPromoDiscount(result.discount);
        toast({
          title: "Promo code applied",
          description: `You've received ${result.discount}% off your ${
            isAdditionalWebsite ? "additional website" : "subscription"
          }!`,
        });
      } else {
        throw new Error(result.message || "Invalid promo code");
      }
    } catch (error: any) {
      toast({
        title: "Invalid promo code",
        description: error.message || "Please enter a valid promo code",
        variant: "destructive",
      });
      setIsPromoApplied(false);
      setPromoDiscount(0);
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Handle email edit
  const handleEditEmail = () => {
    setIsEditingEmail(true);
  };

  // Handle email update
  const handleUpdateEmail = async () => {
    if (!email || !user) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingEmail(true);

    try {
      // Update email in both Firebase and Stripe
      const response = await fetch("/api/user/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          oldEmail: originalEmail,
          newEmail: email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update email");
      }

      // Update the local Firebase document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        email: email,
      });

      setIsEditingEmail(false);
      toast({
        title: "Email updated",
        description: "Your email has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating email",
        description: error.message || "Failed to update your email",
        variant: "destructive",
      });
      // Reset to original email
      setEmail(originalEmail);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Handle cancel email edit
  const handleCancelEmailEdit = () => {
    setEmail(originalEmail);
    setIsEditingEmail(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !priceInfo) {
      return;
    }

    setIsLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          email: email,
          name: customerData.name,
        },
      });

      if (error) {
        throw error;
      }

      let response;

      if (isAdditionalWebsite && planType) {
        // Purchase additional website - NOW WITH PROMO CODE SUPPORT
        response = await fetch("/api/stripe/purchase-additional-website", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            planType: planType,
            customerEmail: email,
            customerName: customerData.name,
            userId: user?.uid,
            promoCode: isPromoApplied ? promoCode : undefined, // Added promo code support
          }),
        });
      } else {
        // Create regular subscription
        response = await fetch("/api/stripe/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            priceId: priceInfo.id,
            productId: productId,
            interval: interval,
            customerEmail: email,
            customerName: customerData.name,
            promoCode: isPromoApplied ? promoCode : undefined,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }

      // Success - call onSuccess callback
      onSuccess(productId);
    } catch (error: any) {
      setCardError(error.message || "An error occurred");
      toast({
        title: "Payment failed",
        description:
          error.message || "Please check your card details and try again",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">
        {isAdditionalWebsite
          ? "Purchase Additional Website"
          : "Complete your subscription"}
      </h2>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">
            {isAdditionalWebsite ? "Product:" : "Selected plan:"}
          </span>
          <span className="font-semibold">
            {displayName} {!isAdditionalWebsite && `(${interval})`}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Amount:</span>
          <span>
            {formatCurrency(basePrice)}/
            {isAdditionalWebsite
              ? "month"
              : interval === "monthly"
              ? "month"
              : "year"}
          </span>
        </div>
        {/* Show discount for both regular plans AND additional websites */}
        {isPromoApplied && (
          <div className="flex justify-between items-center text-green-600 mb-2">
            <span>Discount ({promoCode.toUpperCase()}):</span>
            <span>-{formatCurrency(basePrice * (promoDiscount / 100))}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-medium border-t pt-2 mt-2">
          <span>Total:</span>
          <span>
            {formatCurrency(discountedPrice)}/
            {isAdditionalWebsite
              ? "month"
              : interval === "monthly"
              ? "month"
              : "year"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {isEditingEmail ? (
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
                disabled={isUpdatingEmail}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail}
                className="h-9 w-9 cursor-pointer"
              >
                {isUpdatingEmail ? (
                  <div className="h-4 w-4 border-2 border-t-transparent border-[#f58327] rounded-full animate-spin"></div>
                ) : (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCancelEmailEdit}
                disabled={isUpdatingEmail}
                className="h-9 w-9 cursor-pointer"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between border rounded-md p-2">
              <span className="text-sm text-gray-700">
                {email || "No email available - please edit"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleEditEmail}
                className="h-7 px-2 text-gray-500 hover:text-[#f58327] cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Edit</span>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="card">Card Information</Label>
          <div className="border rounded-md p-3">
            <CardElement
              id="card"
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
              onChange={(e) => {
                setCardError(e.error ? e.error.message : "");
              }}
            />
          </div>
          {cardError && (
            <p className="text-sm text-red-500 mt-1">{cardError}</p>
          )}
        </div>

        {/* Promo code section - NOW AVAILABLE FOR BOTH REGULAR AND ADDITIONAL WEBSITES */}
        <div className="space-y-2">
          <Label htmlFor="promo">
            Promo Code
            {isAdditionalWebsite && (
              <span className="text-xs text-gray-500 ml-1">
                (Available for additional websites too!)
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <Input
              id="promo"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value);
                if (isPromoApplied) {
                  setIsPromoApplied(false);
                  setPromoDiscount(0);
                }
              }}
              disabled={isPromoApplied}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyPromo}
              disabled={!promoCode || isPromoApplied || isValidatingPromo}
              className="cursor-pointer"
            >
              {isValidatingPromo
                ? "Checking..."
                : isPromoApplied
                ? "Applied"
                : "Apply"}
            </Button>
          </div>
        </div>

        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={!stripe || isLoading || isEditingEmail}
        >
          {isLoading
            ? "Processing..."
            : `Pay ${formatCurrency(discountedPrice)}`}
        </PrimaryButton>

        <div className="flex items-center justify-center border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center text-xs text-gray-500">
            <LockIcon className="h-3 w-3 mr-1 text-gray-400" />
            <span className="mr-1">Securely processed by</span>
            <img src="stripe.png" width={40} height={40} alt="" />
          </div>
        </div>

        <p className="text-xs text-center text-gray-500">
          By continuing, you agree to our{" "}
          <a
            href="https://help.webdash.io/terms"
            className="text-[#f58327] hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://help.webdash.io/privacy-policy"
            className="text-[#f58327] hover:underline"
          >
            Privacy Policy
          </a>
        </p>
      </form>
    </div>
  );
}
