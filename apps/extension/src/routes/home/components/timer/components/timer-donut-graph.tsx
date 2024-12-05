import { motion } from "framer-motion";

export const TimerDonutGraph = (props: {
  percentage: number;
  children: React.ReactNode;
}) => {
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (props.percentage / 100) * circumference;

  return (
    <motion.div
      className="relative h-12 w-12"
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg className="h-full w-full -rotate-90 transform">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="#555"
          strokeOpacity="0.5"
          strokeWidth="5"
          fill="transparent"
          className="text-gray-700"
        />
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </svg>

      {props.children}
    </motion.div>
  );
};
