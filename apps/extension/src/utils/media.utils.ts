/* native <video>/<audio> on the page */
const pauseHTML5Videos = () => {
  document.querySelectorAll('video, audio').forEach(m => (m as HTMLVideoElement | HTMLAudioElement).pause());
}

function pauseEmbedPlayers() {
  /* SoundCloud widget – right host and STRINGified message */
  document
    .querySelectorAll('iframe[src*="w.soundcloud.com/player"]')
    .forEach(f => {
      /* if the SC widget script is already there → simple */
      if ((window as any).SC?.Widget) {
        try { (window as any).SC.Widget(f).pause(); } catch {}
      }

      /* raw postMessage fallback */
      (f as HTMLIFrameElement).contentWindow?.postMessage(
        JSON.stringify({ method: 'pause' }), // must be a string
        '*',
      );
    });

  /* Spotify embeds */
  document
    .querySelectorAll('iframe[src*="spotify.com/embed"]')
    .forEach(f =>
      (f as HTMLIFrameElement).contentWindow?.postMessage(
        { command: 'pause' },
        '*',
      ),
    );
}

const pauseYoutubeAndVimeo = () => {
  /* YouTube’s own player (normal pages + shorts) */
  document.querySelectorAll('.html5-main-video').forEach(v => (v as HTMLVideoElement).pause()); /*:contentReference[oaicite:0]{index=0}*/

  /* YouTube / Vimeo players inside iframes */
  document.querySelectorAll('iframe[src*="youtube.com"]').forEach(f =>
    (f as HTMLIFrameElement).contentWindow?.postMessage(
      '{"event":"command","func":"pauseVideo","args":""}',
      '*'
    )
  );
  
  /* Vimeo */
  document.querySelectorAll('iframe[src*="vimeo.com"]').forEach(f =>
    (f as HTMLIFrameElement).contentWindow?.postMessage({ method: 'pause' }, '*'),
  );

};


export const pauseAllVideos = () => {
  pauseHTML5Videos()
  pauseYoutubeAndVimeo()
}

export const startAutoPause = () => {
  pauseAllVideos()
  const observer = new MutationObserver(() => pauseAllVideos())
  observer.observe(document, { childList: true, subtree: true })
  const interval = setInterval(pauseAllVideos, 3000)
  return () => {
    observer.disconnect()
    clearInterval(interval)
  }
}