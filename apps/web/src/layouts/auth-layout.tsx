import { useId } from "react";
import { Link } from "react-router-dom";

import { StarField } from "@/components/auth/star-field";
import { Logomark } from "@/components/logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-full justify-center md:px-12 lg:px-0">
      <main className="relative z-10 flex flex-col justify-center flex-1  px-4 py-10 shadow-2xl min-h-screen">
        {children}
      </main>

      <div className="hidden flex-1 lg:relative lg:block lg:min-h-screen">
        <AuthSidebar />
      </div>
    </div>
  );
}

function AuthSidebar() {
  return (
    <div className="relative flex-none overflow-hidden px-6 min-h-screen h-full sm:border-l sm:border-foreground/10">
      <Glow />
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        <div className="mx-auto max-w-lg ">
          <div className="pb-16 pt-20 sm:pb-20 sm:pt-32 lg:py-20">
            <div className="relative">
              <StarField />
              <Intro />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Glow() {
  const id = useId();

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-gray-950">
      <svg
        className="absolute -bottom-48 left-[-40%] h-[80rem] w-[180%] lg:-right-40 lg:bottom-auto lg:left-auto lg:top-[-40%] lg:h-[180%] lg:w-[80rem]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${id}-desktop`} cx="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(0, 71, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
          <radialGradient id={`${id}-mobile`} cy="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.3)" />
            <stop offset="53.95%" stopColor="rgba(0, 71, 255, 0.09)" />
            <stop offset="100%" stopColor="rgba(10, 14, 23, 0)" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-desktop)`}
          className="hidden lg:block"
        />
        <rect
          width="100%"
          height="100%"
          fill={`url(#${id}-mobile)`}
          className="lg:hidden"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 right-0 h-px bg-white mix-blend-overlay lg:left-auto lg:top-0 lg:h-auto lg:w-px" />
    </div>
  );
}

function Intro() {
  return (
    <>
      <div>
        <Link to="/" aria-label="Meelio">
          <Logomark className="text-background dark:text-foreground inline-block w-32" />
        </Link>
      </div>
      <h1 className="mt-4 font-heading text-4xl/relaxed font-light text-white">
        <span className="text-indigo-400">Meelio</span> &ndash; Elevate Focus,
        Boost Productivity
      </h1>
      <p className="mt-4 text-sm/6 text-gray-300">
        Experience Meelio, a minimalist app designed to enhance your focus and
        productivity. Immerse yourself in a calming environment and effortlessly
        commit to your work. Discover its speed, stunning aesthetics, and unlock
        new levels of productivity.
      </p>
    </>
  );
}
