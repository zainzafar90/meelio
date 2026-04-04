const SOUND_FILES_EXTENSION = ".mp3";
const SOUND_FILES_BASE_PATH =
  // @ts-ignore - Vite-specific runtime env access
  import.meta.env?.VITE_CDN_URL || "";

export const pomodoroSounds: { id: string; name: string; url: string }[] = [
  {
    id: "timeout-1-back-chime",
    name: "Back Chime",
    url: `${SOUND_FILES_BASE_PATH}/pomodoro/timeout-1-back-chime${SOUND_FILES_EXTENSION}`,
  },
  {
    id: "timeout-2-bell-chime",
    name: "Bell Chime",
    url: `${SOUND_FILES_BASE_PATH}/pomodoro/timeout-2-bell-chime${SOUND_FILES_EXTENSION}`,
  },
  {
    id: "timeout-3-forward-single-chime",
    name: "Forward Single Chime",
    url: `${SOUND_FILES_BASE_PATH}/pomodoro/timeout-3-forward-single-chime${SOUND_FILES_EXTENSION}`,
  },
  {
    id: "timeout-4-beep",
    name: "Beep",
    url: `${SOUND_FILES_BASE_PATH}/pomodoro/timeout-4-beep${SOUND_FILES_EXTENSION}`,
  },
];
