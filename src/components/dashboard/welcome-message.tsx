import { motion } from "framer-motion";
import { Star, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeMessageProps {
  userName: string;
  onUpgradeClick?: () => void;
}

export function WelcomeMessage({
  userName,
  onUpgradeClick,
}: WelcomeMessageProps) {
  // Get the time of day to personalize the greeting
  const currentHour = new Date().getHours();
  let greeting = "Good day";

  if (currentHour < 12) {
    greeting = "Good morning";
  } else if (currentHour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="space-y-2 mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-medium">
            {greeting}, {userName}!
          </h1>
          <p className="text-gray-500">
            Welcome to your WebDash dashboard. Here you can manage your
            AI-generated websites.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function UpgradeCard({
  onUpgradeClick,
}: {
  onUpgradeClick?: () => void;
}) {
  return (
    <div className="mt-6 relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/90 to-indigo-600/90 opacity-90"></div>
      <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-10"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 translate-y-1/2 opacity-10"></div>

      <div className="relative p-6 flex items-start justify-between">
        <div className="text-white">
          <div className="flex items-center space-x-2 mb-2">
            <Star className="h-5 w-5 text-yellow-300" />
            <h3 className="font-medium text-lg">Upgrade to Pro</h3>
          </div>
          <p className="text-white/80 max-w-xl">
            Get unlimited websites, premium templates, and advanced analytics
            with our Pro plan.
          </p>
        </div>
        <Button
          onClick={onUpgradeClick}
          className="bg-white text-purple-700 hover:bg-white/90 cursor-pointer"
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
