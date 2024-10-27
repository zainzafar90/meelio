import { cn } from "@/lib/utils";

export const Background = () => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-transparent bg-center bg-no-repeat bg-cover",
        "m-0 p-0 transition-transform duration-300 ease-out"
      )}
    >
      <div
        className="absolute inset-0 bg-transparent bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: "url('./img/bg-03.webp')",
        }}
      />
    </div>
  );
};

export const BackgroundOverlay = () => {
  return (
    <div
      className={cn(
        "fixed inset-0 z-10",
        "transition-transform duration-300 ease-out"
      )}
      style={{
        backgroundImage: "url('./img/overlay.png')",
      }}
    />
  );
};
