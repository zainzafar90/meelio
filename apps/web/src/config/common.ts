import { env } from "@/utils/common.utils";

const getSoundFileUrl = () => {
  if (env.DEV) {
    return "/sounds/yT3sxTz";
  }

  // if not in development, return the path to the sound files on cloud
  return "https://cdn.meelio.io/file/meelio/sounds";
};

export const SOUND_FILES_BASE_URL = getSoundFileUrl();
