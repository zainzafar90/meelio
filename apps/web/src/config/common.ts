import { env } from "@/utils/env.utils";

const getSoundFileUrl = () => {
  if (env.dev) {
    return "/sounds/yT3sxTz";
  }

  // if not in development, return the path to the sound files on cloud
  return "https://cdn.meelio.io/file/meelio/sounds";
};

const getSoundFileExtension = () => {
  if (env.dev) {
    return ".mp3";
  }

  // if not in development, return the path to the sound files on cloud
  return ".m3u8";
};

export const SOUND_FILES_BASE_URL = getSoundFileUrl();
export const SOUND_FILES_EXTENSION = getSoundFileExtension();
