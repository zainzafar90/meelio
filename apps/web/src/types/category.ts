/*
|-----------------------------------------------------------------------------------
|  This file contains the types for the categories of the sounds.                   
|  The categories are used to filter the sounds.                                    
|-----------------------------------------------------------------------------------
*/
export enum Category {
  Productivity = "Productivity",
  Relax = "Relax",
  NoiseBlocker = "NoiseBlocker",
  CreativeThinking = "CreativeThinking",
  BeautifulAmbients = "BeautifulAmbients",
  Random = "Random",
  Motivation = "Motivation",
  Sleep = "Sleep",
  Studying = "Studying",
  Writing = "Writing",
}

export type CategoryKeys = keyof typeof Category;

export type CategoryType = {
  id: number;
  title: string;
  name: Category;
  description: string;
};
