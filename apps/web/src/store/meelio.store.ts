import { create } from "zustand";

import { soundCategories } from "@/config/category-data";
import { allSounds } from "@/config/sounds-data";
import { Category } from "@/types/category";
import { Combo } from "@/types/combo";
import { PomodoroStage, PomodoroTimer } from "@/types/pomodoro";
import { Sound, SoundState } from "@/types/sound";
import { MINUTE_IN_SECONDS } from "@/utils/common.utils";
import { getNextStage, getSessionCount } from "@/utils/timer.utils";

type State = {
  /*
  |--------------------------------------------------------------------------
  | Holds all available sounds
  |--------------------------------------------------------------------------
  */
  sounds: Sound[];
  /*
  |--------------------------------------------------------------------------
  | Holds all the sound combinations created by the user
  |--------------------------------------------------------------------------
  */
  combos: Combo[];
  /*
  |--------------------------------------------------------------------------
  | Global volume for all sounds
  |--------------------------------------------------------------------------
  */
  globalVolume: number;
  /*
  |--------------------------------------------------------------------------
  | Sounds that are currently paused - each number is Sound ID
  |--------------------------------------------------------------------------
  */
  pausedSounds: number[];
  /*
  |--------------------------------------------------------------------------
  | Boolean value determining whether the sound oscillation feature is enabled or not
  |--------------------------------------------------------------------------
  */
  isOscillating: boolean;
  /*
  |--------------------------------------------------------------------------
  | Determines which category is currently playing
  |--------------------------------------------------------------------------
  */
  activeCategoryId: Category | null;

  /*
  |--------------------------------------------------------------------------
  | Enable sound shuffling
  |--------------------------------------------------------------------------
  */
  isShuffling: boolean;

  /*
  |--------------------------------------------------------------------------
  | Holds the state of the sounds shared by a friend
  |--------------------------------------------------------------------------
  */
  sharedSoundState: SoundState[];

  /*
  |--------------------------------------------------------------------------
  | Determines whether the editor typing sound is enabled or not
  |--------------------------------------------------------------------------
  */
  editorTypingSoundEnabled: boolean;

  /*
  |--------------------------------------------------------------------------
  | Pomodoro Timer
  |--------------------------------------------------------------------------
  |
  | Timer holds the following properties:
  |
  | - running: a boolean value determining whether the timer is running or not
  | - remaining: the remaining time of the timer in seconds
  | - paused: a boolean value determining whether the timer is paused or not
  | - sessionCount: the number of sessions completed
  | - stageSeconds: an array of the number of seconds for each stage
  | - activeStage: the current stage of the timer
  | - autoStartBreaks: a boolean value determining whether breaks should be auto-started
  | - longBreakInterval: the number of sessions before a long break
  | - completed: a boolean value determining whether all sessions for the pomodoro timer has completed or not
  | - enableSound: a boolean value determining whether the sound should be enabled or not
  |
  */
  timer: PomodoroTimer;

  /*
  |--------------------------------------------------------------------------
  | Sets the loading state of a sound
  |--------------------------------------------------------------------------
  */
  setSoundLoading: (id: number, isBuffering?: boolean) => void;
  /*
  |--------------------------------------------------------------------------
  | Adjusts the volume of a specific sound, either within a combo or in the sounds array
  |--------------------------------------------------------------------------
  */
  setVolumeForSound: (id: number, volume: number, comboId?: string) => void;
  /*
  |--------------------------------------------------------------------------
  | Sets the global volume
  |--------------------------------------------------------------------------
  */
  setGlobalVolume: (volume: number) => void;
  /*
  |--------------------------------------------------------------------------
  | Starts playing a sound
  |--------------------------------------------------------------------------
  */
  playSound: (id: number) => void;
  /*
  |--------------------------------------------------------------------------
  | Pauses a sound
  |--------------------------------------------------------------------------
  */
  pauseSound: (id: number) => void;
  /*
  |--------------------------------------------------------------------------
  | Toggles the playing state of a sound
  |--------------------------------------------------------------------------
  */
  toggleSoundState: (id: number) => void;
  /*
  |--------------------------------------------------------------------------
  | Pauses all currently playing sounds
  |--------------------------------------------------------------------------
  */
  pausePlayingSounds: () => void;
  /*
  |--------------------------------------------------------------------------
  | Resumes all currently paused sounds
  |--------------------------------------------------------------------------
  */
  resumePausedSounds: () => void;
  /*
  |--------------------------------------------------------------------------
  | Plays all sounds within a given category
  |--------------------------------------------------------------------------
  */
  playCategory: (category: Category) => void;
  /*
  |--------------------------------------------------------------------------
  | Generates and plays a new random combination of sounds
  |--------------------------------------------------------------------------
  */
  playRandom: () => void;
  /*
  |--------------------------------------------------------------------------
  | Toggles the oscillation state
  |--------------------------------------------------------------------------
  */
  toggleOscillation: () => void;
  /*
  |--------------------------------------------------------------------------
  | Deletes a sound combo
  |--------------------------------------------------------------------------
  */
  deleteCombo: (id: string) => void;
  /*
  |--------------------------------------------------------------------------
  | Plays a specific sound combo
  |--------------------------------------------------------------------------
  */
  playCombo: (id: string) => void;
  /*
  |--------------------------------------------------------------------------
  | Adds a new sound combo
  |--------------------------------------------------------------------------
  */
  addCombo: (comboSound: Combo) => void;

  /*
  |--------------------------------------------------------------------------
  | Shuffle Sounds
  |--------------------------------------------------------------------------
  |
  | This function enables sound shuffle 
  | pausing currently playing sounds gradually & playing new sounds in their place.
  |
  */
  toggleShuffle: () => void;

  /*
  |--------------------------------------------------------------------------
  | Plays sound shared by a friend
  |--------------------------------------------------------------------------
  */
  playSharedSound: (soundState: SoundState[]) => void;

  /*
  |--------------------------------------------------------------------------
  | Sets sounds to playing state when shared by a friend
  |--------------------------------------------------------------------------
  */
  setSharedSoundState: (sharedSoundState: SoundState[]) => void;

  /*
  |--------------------------------------------------------------------------
  | Starts the timer
  |--------------------------------------------------------------------------
  */
  startTimer: () => void;

  /*
  |--------------------------------------------------------------------------
  | Updates the timer
  |--------------------------------------------------------------------------
  */
  updateTimer: (remaining: number) => void;

  /*
  |--------------------------------------------------------------------------
  | Pauses the timer
  |--------------------------------------------------------------------------
  */
  pauseTimer: () => void;

  /*
  |--------------------------------------------------------------------------
  | Resumes the timer
  |--------------------------------------------------------------------------
  */
  resumeTimer: () => void;

  /*
  |--------------------------------------------------------------------------
  | Resets the timer
  |--------------------------------------------------------------------------
  */
  resetTimer: () => void;

  /*
  |--------------------------------------------------------------------------
  | Next Stage 
  |--------------------------------------------------------------------------
  */
  nextStage: () => void;

  /*
  |--------------------------------------------------------------------------
  | Change Stage 
  |--------------------------------------------------------------------------
  */
  changeStage: (stage: PomodoroStage) => void;

  /*
  |--------------------------------------------------------------------------
  | Change Timer Seconds 
  |--------------------------------------------------------------------------
  */
  changeTimerSettings: (stage: PomodoroStage, minutes: number) => void;

  /*
  |--------------------------------------------------------------------------
  | Advance Timer 
  |--------------------------------------------------------------------------
  */
  advanceTimer: () => void;

  /*
  |--------------------------------------------------------------------------
  | Marks a session in pomodoro as completed
  |--------------------------------------------------------------------------
  */
  sessionCompleted: () => void;

  /*
  |--------------------------------------------------------------------------
  | Toggles Auto Start Breaks
  |--------------------------------------------------------------------------
  */
  toggleAutoStartBreaks: () => void;

  /*
  |--------------------------------------------------------------------------
  | Sets the global timer duration
  |--------------------------------------------------------------------------
  */
  setTimerDuration: (duration: number) => void;

  /*
  |--------------------------------------------------------------------------
  | Toggles the times sound
  |--------------------------------------------------------------------------
  */
  toggleTimerSound: () => void;

  /*
  |--------------------------------------------------------------------------
  | Resets the state to its initial values
  |--------------------------------------------------------------------------
  */
  reset: () => void;
};

export const useMeelioStore = create<State>((set) => ({
  sounds: allSounds,
  globalVolume: 1,
  pausedSounds: [],
  isOscillating: false,
  combos: [],
  activeCategoryId: null,
  isShuffling: false,
  sharedSoundState: [],
  editorTypingSoundEnabled: true,

  timer: {
    activeStage: PomodoroStage.WorkTime,
    running: false,
    remaining: 25 * MINUTE_IN_SECONDS,
    sessionCount: 0,
    stageSeconds: {
      [PomodoroStage.WorkTime]: 25 * MINUTE_IN_SECONDS,
      [PomodoroStage.ShortBreak]: 5 * MINUTE_IN_SECONDS,
      [PomodoroStage.LongBreak]: 15 * MINUTE_IN_SECONDS,
    },
    longBreakInterval: 4,
    autoStartBreaks: true,
    enableSound: true,
  },

  /*
  |--------------------------------------------------------------------------
  | Sound Loading State
  |--------------------------------------------------------------------------
  |
  | Sets the loading state of a sound when buffering
  |
  */
  setSoundLoading: (id, isBuffering) =>
    set((state) => {
      if (isBuffering) {
        // if the sound is buffering, set the loading state to true
        return {
          sounds: state.sounds.map((sound) =>
            sound.id === id ? { ...sound, loading: true } : sound
          ),
        };
      } else {
        // if the sound is not buffering, set the loading state to false
        return {
          sounds: state.sounds.map((sound) =>
            sound.id === id ? { ...sound, loading: false } : sound
          ),
        };
      }
    }),

  /*
  |--------------------------------------------------------------------------
  | Sound Combinations State
  |--------------------------------------------------------------------------
  |
  | Adjusts the volume of a sound. If a comboId is provided, the volume of the 
  | sound in the combo is adjusted. Otherwise, the volume of the sound in the 
  | sounds array is adjusted.
  |
  */
  setVolumeForSound: (id, volume, comboId) =>
    set((state) => {
      if (comboId) {
        // if a comboId is provided, adjust the volume of the sound in the combo
        return {
          combos: state.combos.map((combo) =>
            combo.id === comboId
              ? {
                  ...combo,
                  sounds: combo.sounds.map((sound) =>
                    sound.id === id ? { ...sound, volume } : sound
                  ),
                }
              : combo
          ),
        };
      } else {
        // if no comboId is provided, adjust the volume of the sound in the sounds array
        return {
          sounds: state.sounds.map((sound) =>
            sound.id === id ? { ...sound, volume } : sound
          ),
        };
      }
    }),

  /*
  |--------------------------------------------------------------------------
  | Individual Sounds State
  |--------------------------------------------------------------------------
  |
  | These functions are used to adjust the state of individual sounds. They
  | are used when the user clicks on a sound button.
  | 
  | `playSound` starts playing a sound with the specified ID. 
  | `pauseSound` pauses a sound with the specified ID. 
  | `toggleSoundState` toggles the playing state of a sound with the specified ID.
  |
  | @param {number} id - The ID of the sound to be played/paused/toggled
  */
  playSound: (id) =>
    set((state) => ({
      sounds: state.sounds.map((sound) =>
        sound.id === id ? { ...sound, playing: true } : sound
      ),
    })),

  pauseSound: (id) =>
    set((state) => ({
      sounds: state.sounds.map((sound) =>
        sound.id === id ? { ...sound, playing: false } : sound
      ),
    })),

  toggleSoundState: (id) =>
    set((state) => ({
      sounds: state.sounds.map((sound) =>
        sound.id === id ? { ...sound, playing: !sound.playing } : sound
      ),
    })),

  /*
  |--------------------------------------------------------------------------
  | Global Volume
  |--------------------------------------------------------------------------
  |
  | Sets the global volume for all sounds. It is used when the
  | user adjusts the global volume slider. The global volume is then 
  | multiplied by the volume of each sound to get the final volume of the
  | sound.
  |
  | @param {number} volume - The new global volume value
  */
  setGlobalVolume: (volume) => set({ globalVolume: volume }),

  /*
  |--------------------------------------------------------------------------
  | Pause/Resume Playing Sounds Globally 
  |--------------------------------------------------------------------------
  |
  | These functions pause and resume all currently playing sounds. They are
  | used when the user clicks on the pause/resume button.
  |
  | pausePlayingSounds pauses all currently playing sounds and stores their
  | IDs in the pausedSounds array. resumePausedSounds resumes all sounds
  | whose IDs are stored in the pausedSounds array.
  |
  */
  pausePlayingSounds: () =>
    set((state) => {
      const playingSounds = state.sounds.filter((sound) => sound.playing);
      return {
        sounds: state.sounds.map((sound) =>
          sound.playing ? { ...sound, playing: false } : sound
        ),
        pausedSounds: playingSounds.map((sound) => sound.id),
        isShuffling: false,
      };
    }),

  resumePausedSounds: () =>
    set((state) => ({
      sounds: state.sounds.map((sound) =>
        state.pausedSounds.includes(sound.id)
          ? { ...sound, playing: true }
          : sound
      ),
      pausedSounds: [],
    })),

  /*
  |--------------------------------------------------------------------------
  | Play Category 
  |--------------------------------------------------------------------------
  |
  | This function plays all sounds within a given category. It is used when
  | the user clicks on a category button. It also stops all currently playing
  | sounds if any are playing.
  |
  | @param {string} id - The ID of the category to play
  |
  */
  playCategory: (id: Category) =>
    set((state) => {
      const selectedCategory = Object.keys(Category).find(
        (category) => Category[category as keyof typeof Category] === id
      );

      if (!selectedCategory) {
        // If the category is not found, return the current state
        return state;
      }

      // Check if any sound is playing
      const isAnySoundPlaying = state.sounds.some((sound) => sound.playing);

      if (isAnySoundPlaying && state.activeCategoryId === selectedCategory) {
        // If any sound is playing, stop all sounds
        const soundsStopped = state.sounds.map((sound) => {
          sound.playing = false;
          return sound;
        });

        return {
          sounds: soundsStopped,
          activeCategoryId: null,
        };
      } else {
        const selectedSounds = soundCategories[selectedCategory as Category];
        const randomIndex = Math.floor(Math.random() * selectedSounds.length);
        const selectedCategoryCombo = selectedSounds[randomIndex]!;

        const newSounds = state.sounds.map((sound) => {
          // Stop playing sounds that are not part of the selected category
          if (!selectedCategoryCombo.includes(sound.id)) {
            sound.playing = false;
          } else {
            // Toggle the sound for the selected category
            sound.playing = !sound.playing;
          }
          return sound;
        });

        return {
          sounds: newSounds,
          activeCategoryId: selectedCategory as Category,
        };
      }
    }),

  /*
  |--------------------------------------------------------------------------
  | Play Random Sounds
  |--------------------------------------------------------------------------
  |
  | This function generates a new combination of random sounds and plays them.
  | It also stops all currently playing sounds if any are playing.
  |
  | Only plays between 2 and 4 sounds at a time.
  |
  */
  playRandom: () =>
    set((state) => {
      const randomCategoryId = Category.Random;

      // Check if any sound is playing
      const isAnySoundPlaying = state.sounds.some((sound) => sound.playing);

      if (isAnySoundPlaying && state.activeCategoryId === randomCategoryId) {
        // If any sound is playing, stop all sounds
        const soundsStopped = state.sounds.map((sound) => {
          sound.playing = false;
          return sound;
        });

        return {
          sounds: soundsStopped,
          activeCategoryId: null,
        };
      } else {
        // If no sound is playing, generate a new combination of random sounds
        const randomCombo: number[] = [];
        // Shuffle between sound counts i.e 2, 3, 4
        const soundCount = Math.floor(Math.random() * (4 - 2 + 1)) + 2;

        for (let i = 0; i < soundCount; i++) {
          const randomSound =
            state.sounds[Math.floor(Math.random() * state.sounds.length)]!;
          randomCombo.push(randomSound.id);
        }

        const newSounds = state.sounds.map((sound) => {
          // Stop playing sounds that are not part of the random category
          if (randomCombo.includes(sound.id)) {
            sound.playing = true;
          } else {
            // Toggle the sound for the generated random combo
            sound.playing = false;
          }
          return sound;
        });

        return {
          sounds: newSounds,
          activeCategoryId: Category.Random,
        };
      }
    }),

  /*
  |--------------------------------------------------------------------------
  | Oscillation 
  |--------------------------------------------------------------------------
  |
  | Oscillation is a feature that allows the volume of a sound to change
  | over time. This is done by changing the volume of the sound in small
  | increments over a period of time.
  |
  */
  toggleOscillation: () =>
    set((state) => {
      return { isOscillating: !state.isOscillating };
    }),

  /*
  |--------------------------------------------------------------------------
  | Sound Combinations or Combos
  |--------------------------------------------------------------------------
  |
  | This section contains all the actions related to sound combos
  | Sound combos are a collection of sounds that can be played together
  | Combo actions include adding, deleting and playing a combo
  |
  | `addCombo` adds a new sound combination to the combos array.
  | `deleteCombo` deletes a sound combination from the combos array.
  | `playCombo` plays a sound combination with the specified ID.
  |
  */
  addCombo: (combo) =>
    set((state) => {
      const newCombo = {
        ...combo,
        sounds: combo.sounds.map((sound) => ({ ...sound, volume: 1 })),
      };
      return { combos: [...state.combos, newCombo] };
    }),

  deleteCombo: (id) =>
    set((state) => ({
      combos: state.combos.filter((combo) => combo.id !== id),
    })),

  playCombo: (id) =>
    set((state) => {
      const combo = state.combos.find((combo) => combo.id === id);
      if (combo) {
        const soundsStopped = state.sounds.map((sound) => {
          sound.playing = false;
          return sound;
        });

        const sounds = soundsStopped.map((sound) => {
          const comboSound = combo.sounds.find((s) => s.id === sound.id);
          if (comboSound) {
            return { ...sound, playing: true, volume: comboSound.volume };
          } else {
            return { ...sound, playing: false };
          }
        });
        return { sounds };
      }

      return state;
    }),

  /*
  |--------------------------------------------------------------------------
  | Shuffle Sounds
  |--------------------------------------------------------------------------
  |
  | This function shuffles currently playing sounds. It gradually increases
  | volume for three randomly chosen sounds, then decreases the volume of 
  | previously playing sounds to zero and pauses them. 
  |
  */

  toggleShuffle: () =>
    set((state) => {
      return { isShuffling: !state.isShuffling };
    }),

  /*
  |--------------------------------------------------------------------------
  | Play shared link state
  |--------------------------------------------------------------------------
  */
  playSharedSound: (soundState) =>
    set((state) => ({
      sounds: state.sounds.map((sound) => {
        const newSound = soundState.find((s) => s.id === sound.id);
        if (newSound) {
          return { ...sound, playing: true };
        }
        return { ...sound, playing: false };
      }),
    })),

  /*
  |--------------------------------------------------------------------------
  | Set Shared Link State
  |--------------------------------------------------------------------------
  */
  setSharedSoundState: (sharedSoundState) => set({ sharedSoundState }),

  /*
  |--------------------------------------------------------------------------
  | Start Timer
  |--------------------------------------------------------------------------
  |
  | This function starts a timer that plays a sound after a specified interval
  | The timer is cleared when the user pauses or resets the timer
  |
  */
  startTimer: () =>
    set((state) => ({ timer: { ...state.timer, running: true } })),

  /*
  |--------------------------------------------------------------------------
  | Pause Timer
  |--------------------------------------------------------------------------
  |
  | This function pauses the timer, clearing the interval and setting the
  | running state to false
  |
  */
  pauseTimer: () =>
    set((state) => ({ timer: { ...state.timer, running: false } })),

  /*
  |--------------------------------------------------------------------------
  | Resumes Timer
  |--------------------------------------------------------------------------
  |
  | This function resumes the timer, setting the running state to true
  |
  */
  resumeTimer: () =>
    set((state) => ({ timer: { ...state.timer, running: true } })),

  /*
  |--------------------------------------------------------------------------
  | Set Global Timer Duration
  |--------------------------------------------------------------------------
  |
  | This function sets the timer duration and remaining time
  |
  */
  setTimerDuration: (duration: number) =>
    set((state) => ({
      timer: {
        ...state.timer,
        remaining: duration,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Next Stage
  |--------------------------------------------------------------------------
  |
  | This function  starts the next stage of the timer if autoStartBreaks is
  | enabled and the next stage is a break stage (short or long)
  |
  */
  nextStage: () =>
    set((state) => {
      const { activeStage, stageSeconds, sessionCount, longBreakInterval } =
        state.timer;
      const nextStage = getNextStage(
        activeStage,
        sessionCount,
        longBreakInterval
      );
      const nextStageSeconds = stageSeconds[nextStage];

      return {
        timer: {
          ...state.timer,
          activeStage: nextStage,
          remaining: nextStageSeconds,
          running: false,
          paused: true,
        },
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | Change Stage 
  |--------------------------------------------------------------------------
  |
  | This function changes the stage of the timer to the specified stage
  | It also sets the remaining time to the duration of the specified stage
  |
  */
  changeStage: (stage: PomodoroStage) =>
    set((state) => ({
      timer: {
        ...state.timer,
        activeStage: stage,
        remaining: state.timer.stageSeconds[stage],
        running: false,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Change Timer Seconds 
  |--------------------------------------------------------------------------
  */
  changeTimerSettings: (stage: PomodoroStage, minutes: number) =>
    set((state) => {
      const { stageSeconds } = state.timer;
      const nextStageSeconds = minutes * MINUTE_IN_SECONDS;

      return {
        timer: {
          ...state.timer,
          stageSeconds: {
            ...stageSeconds,
            [stage]: nextStageSeconds,
          },
        },
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | Timer Completed
  |--------------------------------------------------------------------------
  |
  | This function sets the timer completed state to true
  |
  */
  sessionCompleted: () =>
    set((state) => {
      return {
        timer: {
          ...state.timer,
          sessionCount: 0,
          running: false,
          completed: true,
        },
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | Advance Timer
  |--------------------------------------------------------------------------
  |
  | This function advances the timer to the next stage, either a break or
  | work stage. It also increments the session count and determines if a
  | long break is due based on the long break interval setting and the
  | current session count.
  |
  */
  advanceTimer: () =>
    set((state) => {
      const {
        activeStage,
        stageSeconds,
        sessionCount,
        longBreakInterval,
        autoStartBreaks,
      } = state.timer;
      let nextStage: PomodoroStage;
      let newSessionCount = sessionCount;

      if (activeStage === PomodoroStage.WorkTime) {
        newSessionCount++;
        nextStage =
          newSessionCount % longBreakInterval === 0
            ? PomodoroStage.LongBreak
            : PomodoroStage.ShortBreak;
      } else {
        nextStage = PomodoroStage.WorkTime;
      }

      return {
        timer: {
          ...state.timer,
          activeStage: nextStage,
          remaining: stageSeconds[nextStage],
          running: autoStartBreaks || nextStage === PomodoroStage.WorkTime,
          sessionCount: newSessionCount,
        },
      };
    }),

  /*
  |--------------------------------------------------------------------------
  | Toggle Auto Start Breaks
  |--------------------------------------------------------------------------
  |
  | This function toggles the auto start breaks setting on the timer
  |
  */
  toggleAutoStartBreaks: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        autoStartBreaks: !state.timer.autoStartBreaks,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Update Timer
  |--------------------------------------------------------------------------
  |
  | This function updates the remaining time on the timer
  |
  */
  updateTimer: (remaining: number) =>
    set((state) => ({
      timer: {
        ...state.timer,
        remaining: remaining,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Reset Timer
  |--------------------------------------------------------------------------
  |
  | This function resets the timer, clearing the interval and setting the
  | remaining time to the duration
  |
  */

  resetTimer: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        running: false,
        activeStage: PomodoroStage.WorkTime,
        remaining: state.timer.stageSeconds[PomodoroStage.WorkTime],
        sessionCount: 0,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Toggle Timer Sound
  |--------------------------------------------------------------------------
  |
  | This function toggles the timer sound setting on the timer
  |
  */
  toggleTimerSound: () =>
    set((state) => ({
      timer: {
        ...state.timer,
        enableSound: !state.timer.enableSound,
      },
    })),

  /*
  |--------------------------------------------------------------------------
  | Reset or Clear State
  |--------------------------------------------------------------------------
  |
  | This section contains all the actions related to resetting or clearing the state
  | Resetting the state will set all sounds to their default values
  |
  */
  reset: () =>
    set({
      sounds: allSounds.map((sound) => ({
        ...sound,
        volume: 0.5,
        playing: false,
      })),
      pausedSounds: [],
      isOscillating: false,
      activeCategoryId: null,
      isShuffling: false,
    }),
}));
