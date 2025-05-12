import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface WelcomeMessageProps {
  userName: string;
}

export function WelcomeMessage({ userName }: WelcomeMessageProps) {
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
          <h1 className="text-2xl md:text-3xl font-bold">
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
