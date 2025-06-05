/* native <video>/<audio> on the page */
const pauseHTML5Videos = () => {
  document.querySelectorAll('video, audio').forEach(m => (m as HTMLVideoElement | HTMLAudioElement).pause());
}

const pauseYouTubeVideos = () => {
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

  /* SoundCloud widget */
  document.querySelectorAll('iframe[src*="soundcloud.com"]').forEach(f =>
    (f as HTMLIFrameElement).contentWindow?.postMessage({ method: 'pause' }, '*'), // SC Widget API:contentReference[oaicite:0]{index=0}
  );

  /* Spotify embed */
  document
    .querySelectorAll('iframe[src*="spotify.com/embed"]')
    .forEach(f =>
      (f as HTMLIFrameElement).contentWindow?.postMessage({ command: 'pause' }, '*'), // iFrame API:contentReference[oaicite:1]{index=1}
    );
};


export const pauseAllVideos = () => {
  pauseHTML5Videos()
  pauseYouTubeVideos()
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