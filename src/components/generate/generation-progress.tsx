"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, CircleIcon } from "lucide-react";
import { motion } from "framer-motion";
import { GenerationStep } from "@/types";

interface GenerationProgressProps {
  progress: number;
  currentStep: string;
  step: number;
  totalSteps: number;
}

export function GenerationProgress({
  progress,
  currentStep,
  step,
  totalSteps,
}: GenerationProgressProps) {
  // Define all steps
  const steps = [
    {
      name: GenerationStep.CREATING_SITE,
      description: "Setting up your website infrastructure",
    },
    {
      name: GenerationStep.GENERATING_SITEMAP,
      description: "Planning the structure of your website",
    },
    {
      name: GenerationStep.DESIGNING_PAGES,
      description: "Creating beautiful page layouts",
    },
    {
      name: GenerationStep.SETTING_UP_NAVIGATION,
      description: "Ensuring visitors easily find what they need",
    },
    {
      name: GenerationStep.OPTIMIZING_FOR_DEVICES,
      description: "Making your site look great on all devices",
    },
    {
      name: GenerationStep.BOOSTING_SPEED,
      description: "Optimizing performance for fast loading",
    },
    {
      name: GenerationStep.FINALIZING,
      description: "Putting the finishing touches on your website",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Progress value={progress} className="h-2 w-full" />
        <div className="flex justify-between text-sm text-gray-500">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((s, index) => {
          const isCompleted = index < step;
          const isActive = index === step;

          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 ${
                isActive
                  ? "text-[#f58327]"
                  : isCompleted
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              <div className="mt-0.5">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <CircleIcon className="h-5 w-5 fill-current" />
                  </motion.div>
                ) : (
                  <CircleIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <p
                  className={`font-medium ${
                    isActive
                      ? "text-[#f58327]"
                      : isCompleted
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {s.name}
                </p>
                <p
                  className={`text-sm ${
                    isActive
                      ? "text-[#f58327]/80"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {s.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
