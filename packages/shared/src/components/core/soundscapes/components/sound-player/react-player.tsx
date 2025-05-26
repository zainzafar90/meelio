import React, { useCallback, useEffect, useRef } from "react";
import type { SyntheticEvent, VideoHTMLAttributes } from "react";

export interface Config {
  [key: string]: any;
}

export interface ReactPlayerProps {
  playing?: boolean;
  pip?: boolean;
  playbackRate?: number;
  volume?: number;
  src?: string;
  url?: string;
  crossOrigin?: string;
  preload?: string;
  controls?: boolean;
  muted?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  style?: React.CSSProperties;
  className?: string;
  slot?: string;
  config?: Config;
  children?: React.ReactNode;
  onReady?: () => void;
  onStart?: (event?: SyntheticEvent<HTMLVideoElement>) => void;
  onPlay?: (event?: SyntheticEvent<HTMLVideoElement>) => void;
  onLoadStart?: (event?: SyntheticEvent<HTMLVideoElement>) => void;
  onBuffer?: () => void;
  onBufferEnd?: () => void;
  [key: string]: any;
}

export interface VideoElementProps
  extends React.DetailedHTMLProps<
    VideoHTMLAttributes<HTMLVideoElement>,
    HTMLVideoElement
  > {
  playbackRate?: number;
  volume?: number;
  config?: Config;
}

export type PlayerEntry = {
  key: string;
  name: string;
  canPlay: (src: string) => boolean;
  canEnablePIP?: () => boolean;
  player?:
    | React.ComponentType<VideoElementProps>
    | React.LazyExoticComponent<React.ComponentType<VideoElementProps>>;
};

type Player = React.ForwardRefExoticComponent<
  ReactPlayerProps & {
    activePlayer: PlayerEntry["player"];
  }
>;

export const Player: Player = React.forwardRef((props, ref) => {
  const { playing, pip } = props;

  const Player = props.activePlayer;
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const startOnPlayRef = useRef(true);

  useEffect(() => {
    if (!playerRef.current) return;

    if (playerRef.current.paused && playing === true) {
      playerRef.current.play();
    }
    if (!playerRef.current.paused && playing === false) {
      playerRef.current.pause();
    }

    playerRef.current.playbackRate = props.playbackRate ?? 1;
    playerRef.current.volume = props.volume ?? 1;
  });

  const handleLoadStart = (event: SyntheticEvent<HTMLVideoElement>) => {
    startOnPlayRef.current = true;
    props.onReady?.();
    props.onLoadStart?.(event);
  };

  const handlePlay = (event: SyntheticEvent<HTMLVideoElement>) => {
    if (startOnPlayRef.current) {
      startOnPlayRef.current = false;
      props.onStart?.(event);
    }
    props.onPlay?.(event);
  };

  if (!Player) {
    return null;
  }

  const eventProps: Record<string, EventListenerOrEventListenerObject> = {};

  for (const key in props) {
    if (key.startsWith("on")) {
      eventProps[key] = props[key as keyof ReactPlayerProps];
    }
  }

  return (
    <Player
      {...eventProps}
      style={props.style}
      className={props.className}
      slot={props.slot}
      ref={useCallback(
        (node: HTMLVideoElement) => {
          playerRef.current = node;

          if (typeof ref === "function") {
            ref(node);
          } else if (ref !== null) {
            ref.current = node;
          }
        },
        [ref]
      )}
      src={props.src || props.url}
      crossOrigin={props.crossOrigin}
      preload={props.preload}
      controls={props.controls}
      muted={props.muted}
      autoPlay={props.autoPlay}
      loop={props.loop}
      playsInline={props.playsInline}
      config={props.config}
      onLoadStart={handleLoadStart}
      onPlay={handlePlay}
    >
      {props.children}
    </Player>
  );
});

Player.displayName = "Player";

interface AudioElementProps extends VideoElementProps {
  onReady?: () => void;
  onBuffer?: () => void;
  onBufferEnd?: () => void;
}

export const AudioElement = React.forwardRef<
  HTMLVideoElement,
  AudioElementProps
>((props, ref) => {
  const { onReady, onBuffer, onBufferEnd, ...audioProps } = props;

  return (
    <audio
      {...audioProps}
      ref={ref as React.Ref<HTMLAudioElement>}
      onCanPlay={onReady}
      onWaiting={onBuffer}
      onPlaying={onBufferEnd}
    />
  );
});

AudioElement.displayName = "AudioElement";
