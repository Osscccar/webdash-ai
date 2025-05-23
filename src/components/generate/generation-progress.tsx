"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2 } from "lucide-react";
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
  // Define all steps without substeps for simpler display
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
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex justify-between text-sm font-normal mb-1">
          <span className="text-gray-700">Generation Progress</span>
          <span className="text-gray-900 font-semibold">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2 w-full bg-gray-100" />
      </div>

      <div className="space-y-6">
        {steps.map((s, index) => {
          const isCompleted = index < step;
          const isActive = index === step;
          const isPending = index > step;

          return (
            <div
              key={s.name}
              className={`flex items-center space-x-4 ${
                isPending ? "opacity-50" : ""
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isCompleted ? (
                  <div className="bg-green-50 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ) : isActive ? (
                  <div className="bg-blue-50 rounded-full p-1">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-full h-7 w-7"></div>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isActive
                      ? "text-gray-900"
                      : isCompleted
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  {s.name}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    isActive ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  {s.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
