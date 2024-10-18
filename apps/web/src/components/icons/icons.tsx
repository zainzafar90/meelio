import { FC, SVGProps } from "react";

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Book,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CloudRainWind,
  Coffee,
  Command,
  File,
  FileText,
  Flower,
  Headphones,
  HelpCircle,
  History,
  Image,
  Laptop,
  Layers,
  Loader2,
  LogOut,
  Menu,
  MessageCircleIcon,
  Moon,
  MoreVertical,
  Palmtree,
  PenTool,
  Pizza,
  Plus,
  Shuffle,
  Sparkle,
  Star,
  Sticker,
  SunMedium,
  Target,
  Train,
  Trash,
  Twitter,
  User,
  Volume2,
  Waves,
  X,
} from "lucide-react";

export interface LucideProps extends Partial<SVGProps<SVGSVGElement>> {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}

export type Icon = FC<LucideProps>;

export const Icons = {
  logo: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  menu: Menu,
  trash: Trash,
  post: FileText,
  page: File,
  media: Image,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  twitter: Twitter,
  check: Check,
  diverseSounds: Volume2,
  oscillations: Waves,
  comboCreations: Layers,
  integratedTextEditor: FileText,
  moodTracker: Sticker,
  star: Star,
  bell: Bell,
  productivity: Target,
  random: Shuffle,
  relax: Flower,
  noiseBlocker: Headphones,
  motivation: Star,
  sleep: Moon,
  studying: Book,
  creativeThinking: Sparkle,
  writing: PenTool,
  beautifulAmbeints: Waves,
  cloudRainWind: CloudRainWind,
  coffee: Coffee,
  train: Train,
  tropical: Palmtree,
  logout: LogOut,
  chat: MessageCircleIcon,
  history: History,
  billing: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path opacity=".5" fill="currentColor" d="M2 9h20v2H2z" />
      <path
        fill="currentColor"
        d="M19 5H5a3.009 3.009 0 0 0-3 3v1h20V8a3.009 3.009 0 0 0-3-3zM2 17a3.009 3.009 0 0 0 3 3h14a3.009 3.009 0 0 0 3-3v-6H2v6z"
      />
      <path fill="currentColor" d="M10 15H7a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2z" />
    </svg>
  ),
  billingActive: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M19 5H5a3.009 3.009 0 0 0-3 3v1h20V8a3.009 3.009 0 0 0-3-3zM2 17a3.009 3.009 0 0 0 3 3h14a3.009 3.009 0 0 0 3-3v-6H2v6z"
      />
      <path fill="currentColor" d="M10 15H7a1 1 0 1 1 0-2h3a1 1 0 1 1 0 2z" />
    </svg>
  ),

  settings: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        opacity=".5"
        fill="currentColor"
        d="m21.316 9.552-1.886-.63.89-1.777a1 1 0 0 0-.188-1.155L18.01 3.868a1 1 0 0 0-1.154-.187l-1.778.89-.63-1.887A1 1 0 0 0 13.5 2h-3a1 1 0 0 0-.949.684L8.922 4.57l-1.778-.89a.996.996 0 0 0-1.154.188L3.868 5.99a1 1 0 0 0-.187 1.155l.89 1.778-1.887.629A.999.999 0 0 0 2 10.5v3a.999.999 0 0 0 .684.948l1.886.63-.89 1.777a1 1 0 0 0 .188 1.155l2.122 2.122a.998.998 0 0 0 1.154.187l1.778-.89.63 1.887A1 1 0 0 0 10.5 22h3a1 1 0 0 0 .949-.684l.629-1.886 1.778.89a1 1 0 0 0 1.154-.188l2.122-2.122a1 1 0 0 0 .187-1.155l-.889-1.778 1.886-.629A.999.999 0 0 0 22 13.5v-3a.999.999 0 0 0-.684-.948ZM12 15a3 3 0 1 1 3-3 3.003 3.003 0 0 1-3 3Z"
      />
      <path
        fill="currentColor"
        d="M12 16a4 4 0 1 1 4-4 4.004 4.004 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2Z"
      />
    </svg>
  ),
  settingsActive: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        opacity=".8"
        fill="currentColor"
        d="m21.316 9.552-1.886-.63.89-1.777a1 1 0 0 0-.188-1.155L18.01 3.868a1 1 0 0 0-1.154-.187l-1.778.89-.63-1.887A1 1 0 0 0 13.5 2h-3a1 1 0 0 0-.949.684L8.922 4.57l-1.778-.89a.996.996 0 0 0-1.154.188L3.868 5.99a1 1 0 0 0-.187 1.155l.89 1.778-1.887.629A.999.999 0 0 0 2 10.5v3a.999.999 0 0 0 .684.948l1.886.63-.89 1.777a1 1 0 0 0 .188 1.155l2.122 2.122a.998.998 0 0 0 1.154.187l1.778-.89.63 1.887A1 1 0 0 0 10.5 22h3a1 1 0 0 0 .949-.684l.629-1.886 1.778.89a1 1 0 0 0 1.154-.188l2.122-2.122a1 1 0 0 0 .187-1.155l-.889-1.778 1.886-.629A.999.999 0 0 0 22 13.5v-3a.999.999 0 0 0-.684-.948ZM12 15a3 3 0 1 1 3-3 3.003 3.003 0 0 1-3 3Z"
      />
      <path
        fill="currentColor"
        d="M12 16a4 4 0 1 1 4-4 4.004 4.004 0 0 1-4 4Zm0-6a2 2 0 1 0 2 2 2.002 2.002 0 0 0-2-2Z"
      />
    </svg>
  ),
  soundscapes: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path fill="currentColor" d="M22 11H10V2H8v20h2v-9h12z" opacity=".25" />
      <path
        fill="currentColor"
        d="M3 2h5v20H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
      />
      <path
        fill="currentColor"
        d="M10 2h11a1 1 0 0 1 1 1v8H10V2zm0 11h12v8a1 1 0 0 1-1 1H10v-9z"
        opacity=".5"
      />
    </svg>
  ),
  soundscapesActive: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M2 3v18c0 .6.4 1 1 1h5V2H3c-.6 0-1 .4-1 1zm19-1H10v9h12V3c0-.6-.4-1-1-1zM10 22h11c.6 0 1-.4 1-1v-8H10v9z"
      />
    </svg>
  ),
  pomodoro: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 6a1 1 0 0 1 1 1v4.422l2.098 1.212a1 1 0 0 1-1 1.732l-2.598-1.5A1.005 1.005 0 0 1 11 12V7a1 1 0 0 1 1-1Z"
      />
      <path
        fill="currentColor"
        d="M2 12A10 10 0 1 0 12 2A10 10 0 0 0 2 12Zm9-5a1 1 0 0 1 2 0v4.422l2.098 1.212a1 1 0 0 1-1 1.732l-2.598-1.5A1.005 1.005 0 0 1 11 12Z"
        opacity=".5"
      />
    </svg>
  ),
  pomodoroActive: ({ ...props }: LucideProps) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2zm3.5 12c-.3.5-.9.6-1.4.4l-2.6-1.5c-.3-.2-.5-.5-.5-.9V7c0-.6.4-1 1-1s1 .4 1 1v4.4l2.1 1.2c.5.3.6.9.4 1.4z"
      />
    </svg>
  ),
  writer: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="currentColor"
        d="m13.498.795l.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057l3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z"
      />
    </svg>
  ),
  writerActive: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="currentColor"
        d="m13.498.795l.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"
      />
    </svg>
  ),
  play: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" fillRule="evenodd">
        <path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z" />
        <path
          fill="currentColor"
          d="M5.669 4.76a1.469 1.469 0 0 1 2.04-1.177c1.062.454 3.442 1.533 6.462 3.276c3.021 1.744 5.146 3.267 6.069 3.958c.788.591.79 1.763.001 2.356c-.914.687-3.013 2.19-6.07 3.956c-3.06 1.766-5.412 2.832-6.464 3.28c-.906.387-1.92-.2-2.038-1.177c-.138-1.142-.396-3.735-.396-7.237c0-3.5.257-6.092.396-7.235Z"
        />
      </g>
    </svg>
  ),
  pause: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none">
        <path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z" />
        <path
          fill="currentColor"
          d="M9 3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        />
      </g>
    </svg>
  ),
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 600"
      {...props}
    >
      <path
        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
        fill="#4285f4"
      />
      <path
        d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
        fill="#34a853"
      />
      <path
        d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
        fill="#fbbc04"
      />
      <path
        d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
        fill="#ea4335"
      />
    </svg>
  ),
  volume: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none">
        <path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01l-.184-.092Z" />
        <path
          fill="currentColor"
          d="M13.26 3.3a1.1 1.1 0 0 1 1.734.78l.006.114v15.612a1.1 1.1 0 0 1-1.643.957l-.096-.062L6.68 16H4a2 2 0 0 1-1.995-1.85L2 14v-4a2 2 0 0 1 1.85-1.995L4 8h2.68l6.58-4.7Zm6.407 3.483A6.985 6.985 0 0 1 22 12a6.985 6.985 0 0 1-2.333 5.217a1 1 0 1 1-1.334-1.49A4.985 4.985 0 0 0 20 12c0-1.48-.642-2.81-1.667-3.727a1 1 0 1 1 1.334-1.49Zm-2 2.236A3.992 3.992 0 0 1 19 11.999a3.991 3.991 0 0 1-1.333 2.982a1 1 0 0 1-1.422-1.4l.088-.09c.41-.368.667-.899.667-1.491a1.99 1.99 0 0 0-.548-1.376l-.119-.115a1 1 0 1 1 1.334-1.49Z"
        />
      </g>
    </svg>
  ),
  save: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11.146 11.023c.38-.682.57-1.023.854-1.023c.284 0 .474.34.854 1.023l.098.176c.108.194.162.29.246.354c.085.064.19.088.4.135l.19.044c.738.167 1.107.25 1.195.532c.088.283-.164.577-.667 1.165l-.13.152c-.143.167-.215.25-.247.354c-.032.104-.021.215 0 .438l.02.203c.076.785.114 1.178-.115 1.352c-.23.174-.576.015-1.267-.303l-.178-.082c-.197-.09-.295-.135-.399-.135c-.104 0-.202.045-.399.135l-.178.082c-.691.319-1.037.477-1.267.303c-.23-.174-.191-.567-.115-1.352l.02-.203c.021-.223.032-.334 0-.438c-.032-.103-.104-.187-.247-.354l-.13-.152c-.503-.588-.755-.882-.667-1.165c.088-.282.457-.365 1.195-.532l.19-.044c.21-.047.315-.07.4-.135c.084-.064.138-.16.246-.354l.098-.176Z" />
        <path
          strokeLinecap="round"
          d="M22 11.798c0-2.632 0-3.949-.77-4.804a2.984 2.984 0 0 0-.224-.225C20.151 6 18.834 6 16.202 6h-.374c-1.153 0-1.73 0-2.268-.153a4 4 0 0 1-.848-.352C12.224 5.224 11.816 4.815 11 4l-.55-.55c-.274-.274-.41-.41-.554-.53a4 4 0 0 0-2.18-.903C7.53 2 7.336 2 6.95 2c-.883 0-1.324 0-1.692.07A4 4 0 0 0 2.07 5.257C2 5.626 2 6.068 2 6.95M21.991 16c-.036 2.48-.22 3.885-1.163 4.828C19.657 22 17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172C2 19.657 2 17.771 2 14v-3"
        />
      </g>
    </svg>
  ),
  reset: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M4.854 2.146a.5.5 0 0 1 0 .708L3.707 4H9a4.5 4.5 0 1 1 0 9H5a.5.5 0 0 1 0-1h4a3.5 3.5 0 1 0 0-7H3.707l1.147 1.146a.5.5 0 1 1-.708.708l-2-2a.5.5 0 0 1 0-.708l2-2a.5.5 0 0 1 .708 0Z"
        clipRule="evenodd"
      />
    </svg>
  ),
  oscillation: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g>
        <path
          d="M42.245 23.222a17.63 17.63 0 0 0-8.74.88l-.577.22a22.676 22.676 0 0 1-11.933 1.4c-1.73-.267-3.533-.697-5.113-1.485a2.5 2.5 0 0 1 2.003-4.575l.22.096c1.137.534 2.417.832 3.65 1.022 2.24.343 5.305.367 8.74-.882l.577-.22a22.676 22.676 0 0 1 11.933-1.4c1.73.267 3.532.699 5.11 1.484a2.523 2.523 0 0 1 1.12 3.356c-.615 1.23-1.87 1.512-3.342 1.124l-3.648-1.02Zm0 10a17.63 17.63 0 0 0-8.74.88l-.577.22a22.676 22.676 0 0 1-11.933 1.4c-1.73-.267-3.533-.697-5.113-1.485a2.5 2.5 0 0 1 2.003-4.575l.22.096c1.137.534 2.417.832 3.65 1.022 2.24.343 5.305.367 8.74-.882l.577-.22a22.676 22.676 0 0 1 11.933-1.4c1.73.267 3.532.699 5.11 1.484a2.523 2.523 0 0 1 1.12 3.356c-.615 1.232-1.87 1.512-3.342 1.124l-3.648-1.02Zm-9.923 11.333.606-.233a17.679 17.679 0 0 1 9.317-1.1l3.65 1.02c1.47.388 2.725.108 3.342-1.124a2.524 2.524 0 0 0-1.122-3.355c-1.578-.786-3.38-1.216-5.11-1.483a22.64 22.64 0 0 0-11.328 1.167l-.605.233c-3.67 1.467-6.954 1.463-9.317 1.1-1.057-.163-2.15-.405-3.155-.807l-.495-.216a2.5 2.5 0 0 0-2.223 4.48c1.578.788 3.383 1.218 5.113 1.483 2.92.45 6.905.467 11.327-1.167v.002Z"
          fill="currentColor"
        />
      </g>
    </svg>
  ),
  oscillationSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#oscillation)">
        <rect
          width={64}
          height={64}
          rx={11}
          fill="url(#gradient-oscillation)"
        />
        <path
          d="M42.245 23.222a17.63 17.63 0 0 0-8.74.88l-.577.22a22.676 22.676 0 0 1-11.933 1.4c-1.73-.267-3.533-.697-5.113-1.485a2.5 2.5 0 0 1 2.003-4.575l.22.096c1.137.534 2.417.832 3.65 1.022 2.24.343 5.305.367 8.74-.882l.577-.22a22.676 22.676 0 0 1 11.933-1.4c1.73.267 3.532.699 5.11 1.484a2.523 2.523 0 0 1 1.12 3.356c-.615 1.23-1.87 1.512-3.342 1.124l-3.648-1.02Zm0 10a17.63 17.63 0 0 0-8.74.88l-.577.22a22.676 22.676 0 0 1-11.933 1.4c-1.73-.267-3.533-.697-5.113-1.485a2.5 2.5 0 0 1 2.003-4.575l.22.096c1.137.534 2.417.832 3.65 1.022 2.24.343 5.305.367 8.74-.882l.577-.22a22.676 22.676 0 0 1 11.933-1.4c1.73.267 3.532.699 5.11 1.484a2.523 2.523 0 0 1 1.12 3.356c-.615 1.232-1.87 1.512-3.342 1.124l-3.648-1.02Zm-9.923 11.333.606-.233a17.679 17.679 0 0 1 9.317-1.1l3.65 1.02c1.47.388 2.725.108 3.342-1.124a2.524 2.524 0 0 0-1.122-3.355c-1.578-.786-3.38-1.216-5.11-1.483a22.64 22.64 0 0 0-11.328 1.167l-.605.233c-3.67 1.467-6.954 1.463-9.317 1.1-1.057-.163-2.15-.405-3.155-.807l-.495-.216a2.5 2.5 0 0 0-2.223 4.48c1.578.788 3.383 1.218 5.113 1.483 2.92.45 6.905.467 11.327-1.167v.002Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient
          id="gradient-oscillation"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8D5EEB" />
          <stop offset={1} stopColor="#2A0B68" />
        </linearGradient>
        <clipPath id="oscillation">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  shuffle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g>
        <path
          d="M49.577 39.423a1.875 1.875 0 0 1 0 2.657l-3.75 3.75a1.879 1.879 0 0 1-2.657-2.657l.549-.548h-.327a11.901 11.901 0 0 1-9.664-4.974l-6.512-9.123a8.14 8.14 0 0 0-6.613-3.403H17a1.875 1.875 0 0 1 0-3.75h3.603a11.902 11.902 0 0 1 9.664 4.973l6.517 9.124a8.14 8.14 0 0 0 6.613 3.403h.322l-.55-.548a1.878 1.878 0 1 1 2.656-2.657l3.752 3.753ZM34.636 28.076a1.875 1.875 0 0 0 2.645-.176 8.124 8.124 0 0 1 6.116-2.775h.322l-.55.548a1.878 1.878 0 1 0 2.656 2.657l3.75-3.75a1.875 1.875 0 0 0 0-2.657l-3.75-3.75a1.878 1.878 0 0 0-2.656 2.657l.55.545h-.327a11.874 11.874 0 0 0-8.937 4.063 1.875 1.875 0 0 0 .18 2.639Zm-5.272 7.847a1.875 1.875 0 0 0-2.645.177 8.126 8.126 0 0 1-6.116 2.775H17a1.875 1.875 0 1 0 0 3.75h3.603a11.875 11.875 0 0 0 8.938-4.063 1.875 1.875 0 0 0-.177-2.639Z"
          fill="currentColor"
        />
      </g>
    </svg>
  ),
  shuffleSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#shuffle)">
        <rect width={64} height={64} rx={11} fill="url(#gradient-shuffle)" />
        <path
          d="M49.577 39.423a1.875 1.875 0 0 1 0 2.657l-3.75 3.75a1.879 1.879 0 0 1-2.657-2.657l.549-.548h-.327a11.901 11.901 0 0 1-9.664-4.974l-6.512-9.123a8.14 8.14 0 0 0-6.613-3.403H17a1.875 1.875 0 0 1 0-3.75h3.603a11.902 11.902 0 0 1 9.664 4.973l6.517 9.124a8.14 8.14 0 0 0 6.613 3.403h.322l-.55-.548a1.878 1.878 0 1 1 2.656-2.657l3.752 3.753ZM34.636 28.076a1.875 1.875 0 0 0 2.645-.176 8.124 8.124 0 0 1 6.116-2.775h.322l-.55.548a1.878 1.878 0 1 0 2.656 2.657l3.75-3.75a1.875 1.875 0 0 0 0-2.657l-3.75-3.75a1.878 1.878 0 0 0-2.656 2.657l.55.545h-.327a11.874 11.874 0 0 0-8.937 4.063 1.875 1.875 0 0 0 .18 2.639Zm-5.272 7.847a1.875 1.875 0 0 0-2.645.177 8.126 8.126 0 0 1-6.116 2.775H17a1.875 1.875 0 1 0 0 3.75h3.603a11.875 11.875 0 0 0 8.938-4.063 1.875 1.875 0 0 0-.177-2.639Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient
          id="gradient-shuffle"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EC895E" />
          <stop offset={1} stopColor="#DF312A" />
        </linearGradient>
        <clipPath id="shuffle">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  fireSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#a)">
        <rect width={64} height={64} rx={11} fill="url(#b)" />
        <path
          d="M18.001 45.961c0-.551.184-1.01.533-1.396.349-.386.79-.57 1.286-.57v-.036l24.174.073a2.57 2.57 0 0 0 .184-.037c.496.019.937.22 1.286.607.349.385.533.863.514 1.414 0 .551-.183 1.01-.532 1.396-.35.386-.79.57-1.286.57V48l-23.936-.074c-.184.019-.312.037-.404.037a1.732 1.732 0 0 1-1.286-.588 1.894 1.894 0 0 1-.533-1.414Zm1.507-10.03c-.019-.79.073-1.708.294-2.792.11-.551.367-1.396.808-2.517.037-.092.128-.257.239-.514.018.037.055.055.073.092.018.037.037.037.037.055a7.83 7.83 0 0 0 .9 2.204c.386.588.882 1.029 1.506 1.268.478.202 1.158.312 2.02.33h.295a9.763 9.763 0 0 1-1.451-1.837c-.552-.955-.9-2.057-1.047-3.325-.11-.991-.056-2.186.165-3.6.037-.276.22-.9.533-1.855a8.065 8.065 0 0 1 1.175-2.352c.588-.9 1.433-1.818 2.554-2.773.68-.57 1.634-1.231 2.865-1.966.129-.073.33-.202.643-.349v.202c-.44 1.047-.753 2.113-.9 3.178-.11.974.037 1.874.441 2.719.312.661.882 1.378 1.69 2.112.165.166.533.533 1.102 1.066.551.532.992.955 1.286 1.249l.46.46c.477-.699.752-1.526.808-2.48.073-1.011 0-2.113-.258-3.307 0-.019 0-.074.019-.202.036.036.239.183.55.44 1.03.919 1.801 1.745 2.352 2.462.882 1.139 1.525 2.223 1.947 3.196.35.845.57 1.69.698 2.572.11.772.147 1.414.129 1.929-.018 1.433-.184 2.627-.46 3.6-.128.386-.238.698-.348.956a5.59 5.59 0 0 0 1.194-.478 3.07 3.07 0 0 0 1.102-1.212 7.498 7.498 0 0 0 .698-1.8c0-.02.018-.056.055-.093.018.037.037.092.092.166.037.073.073.128.092.184.239.569.404 1.157.496 1.781.147.698.183 1.378.147 2.076a5.486 5.486 0 0 1-.294 1.488c-.147.44-.294.79-.404 1.066-.35.698-.717 1.304-1.14 1.8-.11.128-.201.238-.256.294H22.208a.907.907 0 0 0-.129-.11 1.187 1.187 0 0 1-.147-.13c-.477-.458-.992-1.156-1.506-2.075a9.752 9.752 0 0 1-.533-1.267 6.193 6.193 0 0 1-.385-1.91Z"
          fill="#fef3c7"
        />
      </g>
      <defs>
        <linearGradient
          id="b"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EC895E" />
          <stop offset={1} stopColor="#DF312A" />
        </linearGradient>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  rainSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#rain)">
        <rect width={64} height={64} rx={11} fill="url(#rain-gradient)" />
        <path
          d="M24.306 39.055a1 1 0 0 1 .632 1.266l-1 3a1 1 0 1 1-1.896-.632l1-3a1 1 0 0 1 1.264-.634Zm6 0a.999.999 0 0 1 .633 1.266l-2 6a1 1 0 1 1-1.896-.632l2-6a1 1 0 0 1 1.264-.634Zm6.002 0a1 1 0 0 1 .632 1.266l-1 3a1 1 0 1 1-1.897-.632l1-3a1 1 0 0 1 1.265-.634Zm6 0a.999.999 0 0 1 .633 1.266l-2 6a1 1 0 1 1-1.897-.632l2-6a1 1 0 0 1 1.264-.634Zm.495-13.998a10.004 10.004 0 0 0-19-2.008 7 7 0 0 0-7.382 9.347 7 7 0 0 0 6.569 4.608h19.002a6 6 0 0 0 .81-11.947Z"
          fill="#cffafe"
        />
      </g>
      <defs>
        <linearGradient
          id="rain-gradient"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#076583" />
          <stop offset={1} stopColor="#041E29" />
        </linearGradient>
        <clipPath id="rain">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  leavesSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#leaves)">
        <rect width={64} height={64} rx={11} fill="url(#leaves-gradient)" />
        <path
          d="M25.8 16c.683.728 1.134 1.606 1.393 2.553.42 1.54.394 3.265.253 5.025-.284 3.519-.99 7.222-.166 9.52.773 2.158 2.012 3.44 3.387 4.07a5.171 5.171 0 0 0 1.843.46c1.505-4.414 1.184-10.046-1.292-13.853 3.278 3.27 4.827 8.21 3.826 13.386l-.595.24a6.09 6.09 0 0 0 .549-.194c2.833-1.143 5.152-4.492 4.187-9.402-.443-2.255-1.964-5.436-4.51-7.9-2.201-2.13-5.141-3.743-8.876-3.905Zm19.255 12.445a5.383 5.383 0 0 1-.716 2.3c-.702 1.23-1.794 2.289-2.976 3.295-2.363 2.011-5.09 3.875-5.988 5.778-.851 1.803-.874 3.34-.42 4.563.195.523.485 1.005.857 1.421 3.642-1.816 6.898-5.486 7.717-9.36.005 4.045-2.077 8.049-5.874 10.64 2.428.987 5.85.342 8.254-3.238 1.113-1.658 2.14-4.563 2.09-7.654-.044-2.623-.832-5.372-2.944-7.744Zm-28.81 4.982c-.644 3.111.047 5.888 1.322 8.182 1.5 2.701 3.843 4.704 5.636 5.584 3.87 1.897 7.155.743 8.765-1.325-4.584-.346-8.388-2.771-10.405-6.276 2.646 2.944 7.3 4.495 11.362 4.246a4.462 4.462 0 0 0 .032-1.659c-.218-1.286-1.008-2.607-2.646-3.742-1.73-1.198-5.021-1.449-8.074-2.01-1.526-.28-3-.65-4.223-1.364a5.387 5.387 0 0 1-1.77-1.636Z"
          fill="#0AD239"
        />
      </g>
      <defs>
        <linearGradient
          id="leaves-gradient"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#023A12" />
          <stop offset={1} stopColor="#021906" />
        </linearGradient>
        <clipPath id="leaves">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  share: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-4-6l-4-4l-4 4m4-4v13"
      />
    </svg>
  ),
  shareSquircle: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#share)">
        <rect width={64} height={64} rx={11} fill="url(#share-gradient)" />
        <path
          d="M35.188 18.176A2.003 2.003 0 0 0 34 20.001v4h-7c-6.075 0-11 4.925-11 11 0 7.081 5.094 10.244 6.262 10.881.157.088.332.12.507.12.681 0 1.231-.557 1.231-1.232 0-.469-.269-.9-.613-1.219-.587-.556-1.387-1.65-1.387-3.55 0-3.312 2.688-6 6-6h6v4a1.99 1.99 0 0 0 1.188 1.825 2.007 2.007 0 0 0 2.15-.337l10-9c.418-.382.662-.92.662-1.488a1.99 1.99 0 0 0-.663-1.487l-10-9a1.986 1.986 0 0 0-2.15-.338Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient
          id="share-gradient"
          x1={32}
          y1={0}
          x2={32}
          y2={64}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#404341" />
          <stop offset={1} stopColor="#101828" />
        </linearGradient>
        <clipPath id="share">
          <path fill="#fff" d="M0 0h64v64H0z" />
        </clipPath>
      </defs>
    </svg>
  ),
  proMember: ({ ...props }: LucideProps) => (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M12.4 12.77l-1.81 4.99a.63.63 0 0 1-1.18 0l-1.8-4.99a.63.63 0 0 0-.38-.37l-4.99-1.81a.62.62 0 0 1 0-1.18l4.99-1.8a.63.63 0 0 0 .37-.38l1.81-4.99a.63.63 0 0 1 1.18 0l1.8 4.99a.63.63 0 0 0 .38.37l4.99 1.81a.63.63 0 0 1 0 1.18l-4.99 1.8a.63.63 0 0 0-.37.38z"
        fill="#FFC017"
        stroke="currentColor"
        strokeWidth={4}
        paintOrder="stroke"
      />
    </svg>
  ),
  borderRounded: ({ ...props }: LucideProps) => (
    <svg viewBox="0 0 96 96" fill="none" aria-hidden="true" {...props}>
      <path
        d="M1 17V9a8 8 0 0 1 8-8h8M95 17V9a8 8 0 0 0-8-8h-8M1 79v8a8 8 0 0 0 8 8h8M95 79v8a8 8 0 0 1-8 8h-8"
        strokeWidth="2"
        strokeLinecap="round"
        color="currentColor"
      />
    </svg>
  ),
  qrCode: ({ ...props }: LucideProps) => (
    <svg
      viewBox="0 0 300 300"
      xmlns="http://www.w3.org/2000/svg"
      width={80}
      height={80}
      {...props}
    >
      <path d="M5 105h10v10H5zm0 10h10v10H5zm0 20h10v10H5zm0 10h10v10H5zm0 30h10v10H5zm0 10h10v10H5zm0 20h10v10H5zM15 85h10v10H15zm0 60h10v10H15zm0 30h10v10H15zm0 10h10v10H15zm0 10h10v10H15zm0 10h10v10H15zM25 85h10v10H25zm0 20h10v10H25zm0 30h10v10H25zm0 20h10v10H25zm0 10h10v10H25zm0 20h10v10H25zm0 20h10v10H25zm10-100h10v10H35zm0 20h10v10H35zm0 30h10v10H35zm0 10h10v10H35zm0 10h10v10H35zm0 20h10v10H35zm10-90h10v10H45zm0 10h10v10H45zm0 10h10v10H45zm0 40h10v10H45zm0 10h10v10H45zm0 10h10v10H45zm0 10h10v10H45zm0 10h10v10H45zM55 95h10v10H55zm0 10h10v10H55zm0 30h10v10H55zm0 60h10v10H55zm0 10h10v10H55zM65 85h10v10H65zm0 20h10v10H65zm0 20h10v10H65zm0 20h10v10H65zm0 20h10v10H65zm0 20h10v10H65zm0 20h10v10H65zM75 95h10v10H75zm0 10h10v10H75zm0 20h10v10H75zm0 10h10v10H75zm0 20h10v10H75zm0 10h10v10H75zm0 10h10v10H75zm0 10h10v10H75zM85 15h10v10H85zm0 10h10v10H85zm0 10h10v10H85zm0 20h10v10H85zm0 10h10v10H85zm0 80h10v10H85zm0 20h10v10H85zm0 30h10v10H85zm0 70h10v10H85zm0 10h10v10H85zM95 45h10v10H95zm0 30h10v10H95zm0 30h10v10H95zm0 10h10v10H95zm0 10h10v10H95zm0 40h10v10H95zm0 70h10v10H95zm0 10h10v10H95zm0 10h10v10H95zm0 10h10v10H95zm0 20h10v10H95zM105 5h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 50h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm10-250h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 30h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm10-270h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 40h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm10-240h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 40h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm10-260h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm10-270h10v10h-10zm0 30h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm10-240h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm10-270h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zM185 5h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm10-180h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm10-270h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 50h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm10-160h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm10-190h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 40h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm10-190h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 30h10v10h-10zm10-170h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm10-200h10v10h-10zm0 20h10v10h-10zm0 40h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 50h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm10-190h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 30h10v10h-10zm0 30h10v10h-10zm0 20h10v10h-10zm10-200h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 30h10v10h-10zm10-180h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 30h10v10h-10zm0 30h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 20h10v10h-10zm0 20h10v10h-10z" />
      <path d="M5 5h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zM15 5h10v10H15zm0 60h10v10H15zM25 5h10v10H25zm0 60h10v10H25zM35 5h10v10H35zm0 60h10v10H35zM45 5h10v10H45zm0 60h10v10H45zM55 5h10v10H55zm0 60h10v10H55zM65 5h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65z" />
      <path d="M25 25h10v10H25zm0 10h10v10H25zm0 10h10v10H25zm10-20h10v10H35zm0 10h10v10H35zm0 10h10v10H35zm10-20h10v10H45zm0 10h10v10H45zm0 10h10v10H45z" />
      <path d="M225 5h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm10-60h10v10h-10zm0 60h10v10h-10zm10-60h10v10h-10zm0 60h10v10h-10zm10-60h10v10h-10zm0 60h10v10h-10zm10-60h10v10h-10zm0 60h10v10h-10zm10-60h10v10h-10zm0 60h10v10h-10zm10-60h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10z" />
      <path d="M245 25h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm10-20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10zm10-20h10v10h-10zm0 10h10v10h-10zm0 10h10v10h-10z" />
      <path d="M5 225h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm0 10h10v10H5zm10-60h10v10H15zm0 60h10v10H15zm10-60h10v10H25zm0 60h10v10H25zm10-60h10v10H35zm0 60h10v10H35zm10-60h10v10H45zm0 60h10v10H45zm10-60h10v10H55zm0 60h10v10H55zm10-60h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65zm0 10h10v10H65z" />
      <path d="M25 245h10v10H25zm0 10h10v10H25zm0 10h10v10H25zm10-20h10v10H35zm0 10h10v10H35zm0 10h10v10H35zm10-20h10v10H45zm0 10h10v10H45zm0 10h10v10H45z" />
    </svg>
  ),
  checkFilled: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.844-8.791a.75.75 0 0 0-1.187-.918l-3.7 4.79l-1.65-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043z"
        clipRule="evenodd"
      ></path>
    </svg>
  ),
};
