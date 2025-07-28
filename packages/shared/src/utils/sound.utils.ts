import { Sound } from "../types";
import { getAssetPath } from "./path.utils";
import { isChromeExtension } from "./common.utils";
import { soundCacheManager } from "./sound-cache.utils";

export const OSCILLATION_INTERVAL_MS = 60_000; // 1 minute
export const SHUFFLE_SOUNDS_INTERVAL_MS = 120_000; // 2 minutes

/*
|--------------------------------------------------------------------------
| Next Oscillation Volume
|--------------------------------------------------------------------------
|
| This method is used to generate a new volume for the sound to
| oscillate. The volume is generated within the [0.25, 0.75] range.
|
| @param soundToOscillate Sound to oscillate
|
*/
export const generateNextVolumeForOscillation = (soundToOscillate: Sound) => {
  // Calculate the min and max possible volume based on current volume
  let minVolume = 0,
    maxVolume = 1;
  if (soundToOscillate.volume < 0.75) {
    minVolume = soundToOscillate.volume + 0.25;
    maxVolume = 1;
  } else {
    minVolume = 0;
    maxVolume = soundToOscillate.volume - 0.25;
  }

  // Generate a new volume within the [minVolume, maxVolume] range
  const newVolume = Math.random() * (maxVolume - minVolume) + minVolume;

  return newVolume;
};

/*
|--------------------------------------------------------------------------
| Next Shuffle Volume
|--------------------------------------------------------------------------
|
| This method is used to generate a new volume for the sound to
| shuffle. The volume is generated within the [0.1, 0.9] range.
|
*/
export const generateNextVolumeForShuffle = () => {
  const minVolume = 0.1;
  const maxVolume = 0.9;

  // Generate a new volume within the [minVolume, maxVolume] range
  const newVolume = Math.random() * (maxVolume - minVolume) + minVolume;

  return newVolume;
};

/*
|--------------------------------------------------------------------------
| Play Typewriter Sound
|--------------------------------------------------------------------------
|
| `playTypewriterSound` is used to play a typewriter sound when a key is pressed.
| The sound is played based on the key pressed. For example, if the key pressed
| is `Space`, then the `space.mp3` sound is played. And in case of a letter, a
| random key sound is played.
|
| @param key Key pressed
|
*/
const KEY_SOUNDS = [
  getAssetPath("/public/sounds/keyboard/key-01.mp3"),
  getAssetPath("/public/sounds/keyboard/key-02.mp3"),
  getAssetPath("/public/sounds/keyboard/key-03.mp3"),
  getAssetPath("/public/sounds/keyboard/key-04.mp3"),
  getAssetPath("/public/sounds/keyboard/key-05.mp3"),
];

export const playTypewriterSound = async (key: string) => {
  let soundUrl: string | null = null;
  let soundId: string | null = null;

  if (key === "Space") {
    soundId = "keyboard-space";
    soundUrl = getAssetPath("/public/sounds/keyboard/space.mp3");
  } else if (key === "Enter") {
    soundId = "keyboard-return";
    soundUrl = getAssetPath("/public/sounds/keyboard/return.mp3");
  } else if (key === "Backspace") {
    soundId = "keyboard-backspace";
    soundUrl = getAssetPath("/public/sounds/keyboard/backspace.mp3");
  } else if (
    // eslint-disable-next-line no-useless-escape
    /[a-zA-Z0-9\s\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/.test(key)
  ) {
    const randomIndex = Math.floor(Math.random() * KEY_SOUNDS.length);
    soundId = `keyboard-key-${randomIndex + 1}`;
    soundUrl = KEY_SOUNDS[randomIndex];
  }

  if (soundUrl && soundId) {
    try {
      const cachedUrl = await soundCacheManager.getSoundUrl(soundId, soundUrl);
      const audio = new Audio(cachedUrl);
      audio.play();
    } catch (error) {
      // Fallback to original URL
      const audio = new Audio(soundUrl);
      audio.play();
    }
  }
};

export const playBreathingSound = async (mode: string) => {
  let path: string | null = null;
  let soundId: string | null = null;

  if (mode === "inhale" || mode === "exhale") {
    path = "/public/sounds/breathing/inhale-exhale.mp3";
    soundId = "breathing-inhale-exhale";
  } else if (mode === "hold1" || mode === "hold2") {
    path = "/public/sounds/breathing/hold.mp3";
    soundId = "breathing-hold";
  }

  if (!path || !soundId) return;

  try {
    const audioPath = getAssetPath(path);
    const cachedUrl = await soundCacheManager.getSoundUrl(soundId, audioPath);
    const audio = new Audio(cachedUrl);
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    // Fallback to original URL
    const audioPath = getAssetPath(path);
    const audio = new Audio(audioPath);
    audio.volume = 0.5;
    audio.play();
  }
};

let pomodorAudioDing: HTMLAudioElement | null = null;

const getPomodoroAudio = async () => {
  if (!pomodorAudioDing) {
    const url = getAssetPath("/public/sounds/pomodoro/timeout-3-forward-single-chime.mp3");
    try {
      const cachedUrl = await soundCacheManager.getSoundUrl("timeout-3-forward-single-chime", url);
      pomodorAudioDing = new Audio(cachedUrl);
    } catch (error) {
      pomodorAudioDing = new Audio(url);
    }
  }
  return pomodorAudioDing;
};

export const playPomodoroSound = async (sound: "timeout" | "ticking") => {
  if (sound === "timeout") {
    const audio = await getPomodoroAudio();
    audio.play();
  }

  return;
};
