export const TimerSessionIndicators = ({
  sessionCount,
}: {
  sessionCount: number;
}) => {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-200/50 p-3 dark:bg-gray-800/50">
      <div className="flex gap-2">Focus Sessions Streak</div>
      <div className="ml-auto flex items-center gap-1">
        🔥
        <span className="ml-1 text-sm font-medium">{sessionCount}</span>
      </div>
    </div>
  );
};
