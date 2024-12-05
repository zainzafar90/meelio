import { Sound } from "@/types/sound";

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
  "/public/sounds/keyboard/key-01.mp3",
  "/public/sounds/keyboard/key-02.mp3",
  "/public/sounds/keyboard/key-03.mp3",
  "/public/sounds/keyboard/key-04.mp3",
  "/public/sounds/keyboard/key-05.mp3",
];

export const playTypewriterSound = (key: string) => {
  if (key === "Space") {
    const audio = new Audio("/public/sounds/keyboard/space.mp3");
    audio.play();
  } else if (key === "Enter") {
    const audio = new Audio("/public/sounds/keyboard/return.mp3");
    audio.play();
  } else if (key === "Backspace") {
    const audio = new Audio("/public/sounds/keyboard/backspace.mp3");
    audio.play();
  } else if (
    // eslint-disable-next-line no-useless-escape
    /[a-zA-Z0-9\s\.,-\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/.test(key)
  ) {
    const randomIndex = Math.floor(Math.random() * KEY_SOUNDS.length);
    const audio = new Audio(KEY_SOUNDS[randomIndex]);
    audio.play();
  }
};

export const playBreathingSound = (mode: string) => {
  if (mode === "inhale" || mode === "exhale") {
    const audio = new Audio("/public/sounds/breathing/inhale-exhale.mp3");
    audio.play();
  } else if (mode === "hold1" || mode === "hold2") {
    const audio = new Audio("/public/sounds/breathing/hold.mp3");
    audio.play();
  }
};

const pomodorAudioDing = new Audio(
  "/public/sounds/pomodoro/timeout-3-forward-single-chime.mp3"
);

export const playPomodoroSound = (sound: "timeout" | "ticking") => {
  if (sound === "timeout") {
    pomodorAudioDing.play();
  }

  return;
};
