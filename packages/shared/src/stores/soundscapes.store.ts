import { soundCategories } from "../data/category-data";
import { allSounds } from "../data/sounds-data";
import { create } from "zustand";

import { Category } from "../types/category";
import { Combo } from "../types/combo";
import { Sound, SoundState } from "../types/sound";

type State = {
  sounds: Sound[];
  combos: Combo[];
  globalVolume: number;
  pausedSounds: number[];
  isOscillating: boolean;
  activeCategoryId: Category | null;
  isShuffling: boolean;
  sharedSoundState: SoundState[];
  editorTypingSoundEnabled: boolean;

  setSoundLoading: (id: number, isBuffering?: boolean) => void;
  setVolumeForSound: (id: number, volume: number, comboId?: string) => void;
  setGlobalVolume: (volume: number) => void;
  playSound: (id: number) => void;
  pauseSound: (id: number) => void;
  toggleSoundState: (id: number) => void;
  pausePlayingSounds: () => void;
  resumePausedSounds: () => void;
  playCategory: (category: Category) => void;
  playRandom: () => void;
  toggleOscillation: () => void;
  deleteCombo: (id: string) => void;
  playCombo: (id: string) => void;
  addCombo: (comboSound: Combo) => void;
  toggleShuffle: () => void;
  playSharedSound: (soundState: SoundState[]) => void;
  setSharedSoundState: (sharedSoundState: SoundState[]) => void;
  captureSoundState: () => SoundState[];
  restoreSoundState: (soundState: SoundState[]) => void;
  reset: () => void;
};

export const useSoundscapesStore = create<State>((set, get) => ({
  sounds: allSounds,
  globalVolume: 0.5,
  pausedSounds: [],
  isOscillating: false,
  combos: [],
  activeCategoryId: null,
  isShuffling: false,
  sharedSoundState: [],
  editorTypingSoundEnabled: true,

  setSoundLoading: (id, isBuffering) =>
    set((state) => ({
      sounds: state.sounds.map((sound) =>
        sound.id === id ? { ...sound, loading: !!isBuffering } : sound
      ),
    })),

  setVolumeForSound: (id, volume, comboId) =>
    set((state) => {
      if (comboId) {
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
      }
      return {
        sounds: state.sounds.map((sound) =>
          sound.id === id ? { ...sound, volume } : sound
        ),
      };
    }),

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

  setGlobalVolume: (volume) => set({ globalVolume: volume }),

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

  playCategory: (id: Category) =>
    set((state) => {
      const selectedCategory = Object.keys(Category).find(
        (category) => Category[category as keyof typeof Category] === id
      );

      if (!selectedCategory) {
        return state;
      }

      const isAnySoundPlaying = state.sounds.some((sound) => sound.playing);

      if (isAnySoundPlaying && state.activeCategoryId === selectedCategory) {
        return {
          sounds: state.sounds.map((sound) => ({ ...sound, playing: false })),
          activeCategoryId: null,
        };
      }

      const categorySounds = soundCategories[selectedCategory as Category];

      return {
        sounds: state.sounds.map((sound) => ({
          ...sound,
          playing: categorySounds.includes(sound.id),
        })),
        activeCategoryId: selectedCategory as Category,
      };
    }),

  playRandom: () =>
    set((state) => {
      const randomCategoryId = Category.Random;
      const isAnySoundPlaying = state.sounds.some((sound) => sound.playing);

      if (isAnySoundPlaying && state.activeCategoryId === randomCategoryId) {
        return {
          sounds: state.sounds.map((sound) => ({ ...sound, playing: false })),
          activeCategoryId: null,
        };
      }

      const soundCount = Math.floor(Math.random() * 3) + 2;
      const randomCombo: number[] = [];

      for (let i = 0; i < soundCount; i++) {
        const randomSound =
          state.sounds[Math.floor(Math.random() * state.sounds.length)]!;
        randomCombo.push(randomSound.id);
      }

      return {
        sounds: state.sounds.map((sound) => ({
          ...sound,
          playing: randomCombo.includes(sound.id),
        })),
        activeCategoryId: Category.Random,
      };
    }),

  toggleOscillation: () =>
    set((state) => ({ isOscillating: !state.isOscillating })),

  addCombo: (combo) =>
    set((state) => ({
      combos: [
        ...state.combos,
        {
          ...combo,
          sounds: combo.sounds.map((sound) => ({ ...sound, volume: 1 })),
        },
      ],
    })),

  deleteCombo: (id) =>
    set((state) => ({
      combos: state.combos.filter((combo) => combo.id !== id),
    })),

  playCombo: (id) =>
    set((state) => {
      const combo = state.combos.find((combo) => combo.id === id);
      if (!combo) return state;

      return {
        sounds: state.sounds.map((sound) => {
          const comboSound = combo.sounds.find((s) => s.id === sound.id);
          return comboSound
            ? { ...sound, playing: true, volume: comboSound.volume }
            : { ...sound, playing: false };
        }),
      };
    }),

  toggleShuffle: () =>
    set((state) => ({ isShuffling: !state.isShuffling })),

  playSharedSound: (soundState) =>
    set((state) => ({
      sounds: state.sounds.map((sound) => ({
        ...sound,
        playing: soundState.some((s) => s.id === sound.id),
        volume:
          soundState.find((sharedSound) => sharedSound.id === sound.id)?.volume ??
          sound.volume,
      })),
    })),

  setSharedSoundState: (sharedSoundState) => set({ sharedSoundState }),

  captureSoundState: () =>
    get()
      .sounds.filter((sound) => sound.playing)
      .map((sound) => ({
        id: sound.id,
        volume: sound.volume,
      })),

  restoreSoundState: (soundState) =>
    set((state) => ({
      sounds: state.sounds.map((sound) => {
        const restoredSound = soundState.find(
          (candidate) => candidate.id === sound.id
        );

        return {
          ...sound,
          playing: Boolean(restoredSound),
          volume: restoredSound?.volume ?? sound.volume,
        };
      }),
      activeCategoryId: null,
      pausedSounds: [],
      isShuffling: false,
    })),

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
