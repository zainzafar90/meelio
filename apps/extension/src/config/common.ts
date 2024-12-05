import { env } from "@/utils/common.utils";

const getSoundFileUrl = () => {
  if (env.DEV) {
    return "/sounds/yT3sxTz";
  }

  // if not in development, return the path to the sound files on cloud
  return "https://cdn.meelio.io/file/meelio/sounds";
};

const getSoundFileExtension = () => {
  if (env.DEV) {
    return ".mp3";
  }

  // if not in development, return the path to the sound files on cloud
  return ".m3u8";
};

export const SOUND_FILES_BASE_URL = getSoundFileUrl();
export const SOUND_FILES_EXTENSION = getSoundFileExtension();
