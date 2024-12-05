import { SoundState } from "@/types/sound";

// Function to encode the sound state as a query string
export const encodeSoundState = (soundState: SoundState[]) => {
  const encodedState = encodeURIComponent(JSON.stringify(soundState));
  return encodedState;
};

// Function to decode the sound state from the query string
export const decodeSoundState = (encodedState: string) => {
  const decodedState = JSON.parse(decodeURIComponent(encodedState));
  return decodedState;
};
