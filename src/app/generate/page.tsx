'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { GenerationProgress } from '@/components/generate/generation-progress';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Bug, Code, Loader2 } from 'lucide-react';
import { GenerationStep } from '@/types';
import { useTenWeb } from '@/hooks/use-tenweb';

export default function GeneratePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { generationProgress, isLoading } = useTenWeb();
  const [prompt, setPrompt] = useState<string>('');
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [colorAndFontData, setColorAndFontData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number>(120); // 2 minutes in seconds

  // Load required data from localStorage
  useEffect(() => {
    const savedPrompt = localStorage.getItem('webdash_prompt');
    const savedSiteInfo = localStorage.getItem('webdash_site_info');
    const savedColorAndFontData = localStorage.getItem('webdash_colors_fonts');
    const savedJobId = localStorage.getItem('webdash_job_id');

    if (!savedPrompt || !savedSiteInfo) {
      toast({
        title: 'Missing website information',
        description: 'Please complete the website editor steps first.',
        variant: 'destructive',
      });
      router.push('/editor');
      return;
    }

    // Set the data states
    setPrompt(savedPrompt);

    try {
      setSiteInfo(JSON.parse(savedSiteInfo));

      if (savedColorAndFontData) {
        setColorAndFontData(JSON.parse(savedColorAndFontData));
      } else {
        // Use default colors and fonts if not set
        setColorAndFontData({
          colors: {
            primaryColor: '#f58327',
            secondaryColor: '#4a5568',
            backgroundDark: '#212121',
          },
          fonts: {
            primaryFont: 'Montserrat',
          },
        });
      }

      // If we have a job ID, redirect to preview page
      if (savedJobId) {
        router.push('/preview');
        return;
      }

      setIsReady(true);
    } catch (error) {
      console.error('Error parsing saved data:', error);
      toast({
        title: 'Error loading website data',
        description: 'There was a problem with your website configuration.',
        variant: 'destructive',
      });
      router.push('/editor');
    }
  }, [router, toast]);

  // Redirect to preview page when ready
  useEffect(() => {
    if (isReady && !debugMode) {
      router.push('/preview');
    }
  }, [isReady, debugMode, router]);

  // Countdown timer for estimated time
  useEffect(() => {
    if (isReady && generationProgress.step > 0 && estimatedTime > 0) {
      const timer = setTimeout(() => {
        setEstimatedTime((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady, estimatedTime, generationProgress.step]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex flex-1 p-6 bg-gray-50">
        <div className="w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {!debugMode ? (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <Loader2 className="h-5 w-5 text-gray-700 animate-spin" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        Building your website
                      </h2>
                      <p className="text-gray-500 text-sm">
                        Estimated time remaining: {formatTime(estimatedTime)}
                      </p>
                    </div>
                  </div>

                  <GenerationProgress
                    progress={generationProgress.progress}
                    currentStep={generationProgress.currentStep}
                    step={generationProgress.step}
                    totalSteps={generationProgress.totalSteps}
                  />
                </div>
              </>
            ) : (
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="h-4 w-4 text-gray-500" />
                      <h3 className="font-normal text-gray-700">Debug Mode</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Use the buttons below to test specific API endpoints and
                      diagnose issues.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setDebugMode(false);
                    }}
                    className="w-full cursor-pointer"
                  >
                    Return to Generation
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
