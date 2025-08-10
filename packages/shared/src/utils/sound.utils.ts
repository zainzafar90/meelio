import { Sound } from "../types";
import { soundSyncService } from "../services/sound-sync.service";
import { keyboardSounds, breathingSounds, pomodoroSounds } from "../data/sounds-data";

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

export const playTypewriterSound = async (key: string) => {
  let soundPath: string | null = null;

  if (key === "Shift" || key === "Control" || key === "Alt" || key === "Meta" || key === "Tab" || key === "CapsLock") {
    return;
  }

  if (key === "Space") {
    soundPath = keyboardSounds.space;
  } else if (key === "Enter") {
    soundPath = keyboardSounds.return;
  } else if (key === "Backspace") {
    soundPath = keyboardSounds.backspace;
  } else if (
    // eslint-disable-next-line no-useless-escape
    /[a-zA-Z0-9\s\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/.test(key)
  ) {
    const randomIndex = Math.floor(Math.random() * keyboardSounds.keys.length);
    soundPath = keyboardSounds.keys[randomIndex];
  }

  if (soundPath) {
    try {
      const url = await soundSyncService.getSoundUrl(soundPath);
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("Failed to play typewriter sound:", error);
    }
  }
};

export const playBreathingSound = async (mode: string) => {
  let path: string | null = null;

  if (mode === "inhale" || mode === "exhale") {
    path = breathingSounds.inhaleExhale;
  } else if (mode === "hold1" || mode === "hold2") {
    path = breathingSounds.hold;
  }

  if (!path) return;

  try {
    const url = await soundSyncService.getSoundUrl(path);
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    console.error("Failed to play breathing sound:", error);
  }
};



export const playPomodoroSound = async (sound: "timeout" | "ticking") => {
  let pomodoroAudio: HTMLAudioElement | null = null;
  let pomodoroAudioUrl: string | null = null;
  if (sound === "timeout") {
    try {
      const [,,pomodoroSound] = pomodoroSounds;
      const url = await soundSyncService.getSoundUrl(pomodoroSound.url);
      
      if (!pomodoroAudio || pomodoroAudioUrl !== url) {
        pomodoroAudio = new Audio(url);
        pomodoroAudioUrl = url;
      }
      
      pomodoroAudio.play();
    } catch (error) {
      console.error("Failed to play pomodoro sound:", error);
    }
  }

  return;
};
