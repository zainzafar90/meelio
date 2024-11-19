import { LinkedAvatars } from "./linked-avatars";

export const BreathingControl = () => {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative z-50 h-auto shrink-0">
        <LinkedAvatars />
      </div>
    </div>
  );
};
