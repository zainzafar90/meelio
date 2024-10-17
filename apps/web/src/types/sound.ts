import { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

/*
|-----------------------------------------------------------------------------------
| Sound holds the following properties:                                
|
| - id: the ID of the sound
| - name: the name of the sound
| - url: the URL of the sound
| - bgImg: the background image of the sound
| - volume: the volume of the sound
| - playing: a boolean value determining whether the sound is playing or not
| - category: the category of the sound
| - icon: the icon of the sound
| - loading: a boolean value determining whether the sound is buffering or not
|
|-----------------------------------------------------------------------------------
*/

export type Sound = {
  id: number;
  name: string;
  url: string;
  icon: ({ ...props }: IconProps) => JSX.Element;
  volume: number;
  playing: boolean;
  loading?: boolean;
};

/*
|-----------------------------------------------------------------------------------
| SoundState is used when sharing the sounds with a friend. It is used to encode and
| decode the sounds.  
| 
| SoundState holds the following properties:
|
| - id: the ID of the sound
| - volume: the volume of the sound
|
|-----------------------------------------------------------------------------------
*/
export type SoundState = Pick<Sound, "id" | "volume">;

export enum SoundType {
  CoffeeShop = 1,
  Underwater,
  WhiteNoise,
  BrownNoise,
  PinkNoise,
  Cicadas,
  RainOnTent,
  RainOnUmbrella,
  Waves,
  TropicalForest,
  Campfire,
  ThunderStorm,
  Train,
  SpaceEngine,
  Wind,
  WindHowling,
  Cityscape,
  Water,
  SummerNight,
  Fan,
  Leaves,
  Airplane,
  Bubbles,
  Waterfall,
  Whale,
  Fire,
  WashingMachine,
  Rain,
  CosmicSounds,
  Forest,
  OceanWaves,
  WaterStream,
}
