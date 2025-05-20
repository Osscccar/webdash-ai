// src/components/payment/payment-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PrimaryButton } from "@/components/ui/custom-button";
import { PLANS, getPlanById } from "@/config/stripe";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Pencil, Check, X } from "lucide-react";

interface PaymentFormProps {
  productId: string;
  interval: "monthly" | "annual";
  customerData: {
    email: string;
    name: string;
  };
  onSuccess: (productId: string) => void;
}

export function PaymentForm({
  productId,
  interval,
  customerData,
  onSuccess,
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

  // Get plan details
  const plan = getPlanById(productId);
  const priceInfo = plan ? plan.prices[interval] : null;

  // Calculate discounted price
  const basePrice = priceInfo
    ? interval === "annual"
      ? priceInfo.yearlyTotal
      : priceInfo.amount
    : 0;
  const discountedPrice = isPromoApplied
    ? basePrice - basePrice * (promoDiscount / 100)
    : basePrice;

  const handleApplyPromo = async () => {
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
          description: `You've received ${result.discount}% off your subscription!`,
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

      // In a real implementation, we would create a payment method
      // and attach it to the customer using the Stripe API
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          email: email, // Use the potentially updated email
          name: customerData.name,
        },
      });

      if (error) {
        throw error;
      }

      // Create subscription
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          priceId: priceInfo.id,
          productId: productId,
          interval: interval,
          customerEmail: email, // Use the potentially updated email
          customerName: customerData.name,
          promoCode: isPromoApplied ? promoCode : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subscription");
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

  if (!plan || !priceInfo) {
    return <div>Invalid plan selected</div>;
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">Complete your subscription</h2>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Selected plan:</span>
          <span className="font-semibold">
            {plan.name} ({interval})
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Amount:</span>
          <span>
            {formatCurrency(basePrice)}/
            {interval === "monthly" ? "month" : "year"}
          </span>
        </div>
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
            {interval === "monthly" ? "month" : "year"}
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
                className="h-9 w-9"
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
                className="h-9 w-9"
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
                className="h-7 px-2 text-gray-500 hover:text-[#f58327]"
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

        <div className="space-y-2">
          <Label htmlFor="promo">Promo Code</Label>
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

        <p className="text-xs text-center text-gray-500">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-[#f58327] hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-[#f58327] hover:underline">
            Privacy Policy
          </a>
        </p>
      </form>
    </div>
  );
}
