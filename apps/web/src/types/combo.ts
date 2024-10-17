import { Sound } from "./sound";

/*
|-----------------------------------------------------------------------------------
| Combo is used to store the combos. A combo is a collection of sounds that can be
| played together. 
|
| Combo holds the following properties:
|
| - id: the ID of the combo
| - name: the name of the combo
| - sounds: an array of sounds
|
|-----------------------------------------------------------------------------------
*/
export type Combo = {
  id: string;
  name: string;
  sounds: Pick<Sound, "id" | "volume">[];
};
