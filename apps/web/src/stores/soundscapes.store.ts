import { soundCategories } from "@/data/category-data";
import { allSounds } from "@/data/sounds-data";
import { create } from "zustand";

import { Category } from "@/types/category";
import { Combo } from "@/types/combo";
import { Sound, SoundState } from "@/types/sound";

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
  | Resets the state to its initial values
  |--------------------------------------------------------------------------
  */
  reset: () => void;
};

export const useSoundscapesStore = create<State>((set) => ({
  sounds: allSounds,
  globalVolume: 0.5,
  pausedSounds: [],
  isOscillating: false,
  combos: [],
  activeCategoryId: null,
  isShuffling: false,
  sharedSoundState: [],
  editorTypingSoundEnabled: true,

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
