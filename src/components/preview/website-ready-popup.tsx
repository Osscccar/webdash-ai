// src/components/preview/website-ready-popup.tsx

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { PrimaryButton } from "@/components/ui/custom-button";

export function WebsiteReadyPopup() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get window dimensions for confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Stop confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.1}
        />
      )}

      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Card className="w-full max-w-md shadow-lg bg-white">
            <CardContent className="p-8">
              <motion.div
                className="text-center"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-3">
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Sparkles className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium mb-3">
                  Your website is ready! 🎉
                </h2>
                <p className="text-gray-600 mb-6">
                  Successfully created with AI. You can now preview and edit
                  your website.
                </p>

                <PrimaryButton>Let's Go!</PrimaryButton>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
