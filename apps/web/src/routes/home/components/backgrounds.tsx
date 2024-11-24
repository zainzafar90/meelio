import { cn } from "@/lib/utils";

export const Background = () => {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-transparent bg-cover bg-center bg-no-repeat",
        "m-0 p-0 transition-transform duration-300 ease-out"
      )}
    >
      <div
        className="absolute inset-0 bg-transparent bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1505699261378-c372af38134c?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      />
    </div>
  );
};

export const BackgroundOverlay = () => {
  return (
    <div
      className={cn(
        "fixed inset-0",
        "transition-transform duration-300 ease-out"
      )}
      style={{
        backgroundImage: "url('./img/overlay.png')",
      }}
    />
  );
};
