import { cn } from "@/lib/utils";
import { useBackgroundStore } from "@/stores/background.store";

export const Background = () => {
  const { currentBackground } = useBackgroundStore();

  if (!currentBackground) return null;

  return (
    <div
      key={currentBackground.id}
      className={cn(
        "absolute inset-0 bg-transparent",
        "m-0 p-0 transition-transform duration-300 ease-out"
      )}
    >
      <picture>
        {/* Small screens */}
        <source
          media="(max-width: 640px)"
          srcSet={`${currentBackground.url}?w=640&q=80&auto=format`}
        />
        {/* Medium screens */}
        <source
          media="(max-width: 1024px)"
          srcSet={`${currentBackground.url}?w=1024&q=80&auto=format`}
        />
        {/* Large screens */}
        <source
          media="(max-width: 1920px)"
          srcSet={`${currentBackground.url}?w=1920&q=80&auto=format `}
        />
        {/* 4K and above */}
        <source
          media="(min-width: 1921px)"
          srcSet={`${currentBackground.url}?w=3840&auto=format`}
        />
        {/* Fallback */}
        <img
          src={`${currentBackground.url}?w=1920&auto=format`}
          alt={currentBackground.title}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </picture>
    </div>
  );
};
