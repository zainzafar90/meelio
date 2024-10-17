import { Category, CategoryType } from "@/types/category";
import { SoundType } from "@/types/sound";

export const allCategories: CategoryType[] = [
  {
    id: 1,
    name: Category.Productivity,
    title: "Focus & Productivity",
    description: "Boost focus and productivity with tailored sounds.",
  },
  {
    id: 2,
    name: Category.Relax,
    title: "Relaxation & Sleep",
    description: "Unwind with calming sounds for relaxation and sleep.",
  },
  {
    id: 7,
    name: Category.CreativeThinking,
    title: "Creative Exploration",
    description: "Inspire creativity with unique and stimulating sounds.",
  },
  {
    id: 10,
    name: Category.Random,
    title: "Random Blend",
    description: "Discover new soundscapes with a random blend.",
  },
  {
    id: 3,
    name: Category.NoiseBlocker,
    title: "Noise Management",
    description: "Block distractions with noise-cancelling sounds.",
  },
  {
    id: 9,
    name: Category.BeautifulAmbients,
    title: "Mindfulness & Meditation",
    description: "Tranquility and well-being through calming ambients.",
  },
];

export const soundCategories: Record<Category, SoundType[][]> = {
  Random: [],
  Productivity: [
    [SoundType.Rain, SoundType.CoffeeShop],
    [SoundType.WhiteNoise, SoundType.Waves, SoundType.Forest],
    [SoundType.WaterStream, SoundType.Wind],
    [SoundType.Leaves, SoundType.CoffeeShop, SoundType.Waves],
    // Studying
    [SoundType.CoffeeShop, SoundType.Cityscape],
    [SoundType.Rain, SoundType.WaterStream],
    [SoundType.CoffeeShop, SoundType.Cityscape, SoundType.Rain],
    [SoundType.Cityscape, SoundType.Rain, SoundType.WaterStream],

    // Writing
    [SoundType.CoffeeShop, SoundType.Rain],
    [SoundType.Wind, SoundType.Forest],
    [SoundType.Leaves, SoundType.Bubbles],
    [SoundType.TropicalForest, SoundType.CosmicSounds],
    [SoundType.CoffeeShop, SoundType.Rain, SoundType.Wind],
    [SoundType.Rain, SoundType.Wind, SoundType.Forest],
  ],
  Relax: [
    [SoundType.Rain, SoundType.OceanWaves],
    [SoundType.Forest, SoundType.WaterStream],
    [SoundType.Underwater, SoundType.Bubbles],
    [SoundType.Waves, SoundType.Waterfall, SoundType.TropicalForest],
    [SoundType.Campfire, SoundType.SummerNight, SoundType.Leaves],
    // Sleep
    [SoundType.Rain, SoundType.OceanWaves],
    [SoundType.WhiteNoise, SoundType.PinkNoise, SoundType.BrownNoise],
    [SoundType.Waterfall, SoundType.Forest],
    [SoundType.Underwater, SoundType.Bubbles, SoundType.Leaves],
    [SoundType.SummerNight, SoundType.Waves, SoundType.RainOnTent],
  ],
  NoiseBlocker: [
    [SoundType.WhiteNoise, SoundType.BrownNoise],
    [SoundType.PinkNoise, SoundType.WhiteNoise, SoundType.BrownNoise],
    [SoundType.Rain, SoundType.Waves],
    [SoundType.Fan, SoundType.Airplane],
    [SoundType.Train, SoundType.WashingMachine, SoundType.Water],
  ],
  CreativeThinking: [
    [SoundType.Wind, SoundType.RainOnTent],
    [SoundType.Fire, SoundType.Bubbles],
    [SoundType.Campfire, SoundType.TropicalForest],
    [SoundType.Wind, SoundType.Water, SoundType.Fire],
    [SoundType.Water, SoundType.Fire, SoundType.Bubbles],

    // Motivation
    [SoundType.CoffeeShop, SoundType.Train],
    [SoundType.Cityscape, SoundType.Waves, SoundType.Forest],
    [SoundType.Forest, SoundType.WaterStream],
    [SoundType.RainOnTent, SoundType.ThunderStorm, SoundType.Wind],
    [SoundType.CosmicSounds, SoundType.SpaceEngine],
  ],
  BeautifulAmbients: [
    [SoundType.Wind, SoundType.Forest],
    [SoundType.Leaves, SoundType.WaterStream],
    [SoundType.Water, SoundType.Bubbles],
    [SoundType.Waterfall, SoundType.TropicalForest],
    [SoundType.CosmicSounds, SoundType.Whale],
    [SoundType.Underwater, SoundType.Cicadas],
    [SoundType.Wind, SoundType.Forest, SoundType.Leaves],
    [SoundType.Forest, SoundType.Leaves, SoundType.WaterStream],
  ],
  // Motivation: [
  //   [SoundType.CoffeeShop, SoundType.Train],
  //   [SoundType.Cityscape, SoundType.Waves, SoundType.Forest],
  //   [SoundType.Forest, SoundType.WaterStream],
  //   [SoundType.RainOnTent, SoundType.ThunderStorm, SoundType.Wind],
  //   [SoundType.CosmicSounds, SoundType.SpaceEngine],
  // ],
  // Sleep: [
  //   [SoundType.Rain, SoundType.OceanWaves],
  //   [SoundType.WhiteNoise, SoundType.PinkNoise, SoundType.BrownNoise],
  //   [SoundType.Waterfall, SoundType.Forest],
  //   [SoundType.Underwater, SoundType.Bubbles, SoundType.Leaves],
  //   [SoundType.SummerNight, SoundType.Waves, SoundType.RainOnTent],
  // ],
  // Studying: [
  //   [SoundType.CoffeeShop, SoundType.Cityscape],
  //   [SoundType.Rain, SoundType.WaterStream],
  //   [SoundType.CoffeeShop, SoundType.Cityscape, SoundType.Rain],
  //   [SoundType.Cityscape, SoundType.Rain, SoundType.WaterStream],
  // ],
  // Writing: [
  //   [SoundType.CoffeeShop, SoundType.Rain],
  //   [SoundType.Wind, SoundType.Forest],
  //   [SoundType.Leaves, SoundType.Bubbles],
  //   [SoundType.TropicalForest, SoundType.CosmicSounds],
  //   [SoundType.CoffeeShop, SoundType.Rain, SoundType.Wind],
  //   [SoundType.Rain, SoundType.Wind, SoundType.Forest],
  // ],
};
