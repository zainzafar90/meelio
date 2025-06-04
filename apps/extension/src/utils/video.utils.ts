const pauseHTML5Videos = () => {
  const videos = document.querySelectorAll('video')
  videos.forEach(video => {
    video.pause()
  })
}

const pauseYouTubeVideos = () => {
  const youtubeFrames = document.querySelectorAll(
    'iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]'
  )
  youtubeFrames.forEach((frame) => {
    try {
      const el = frame as HTMLIFrameElement
      const src = el.getAttribute('src') || ''
      if (!src.includes('enablejsapi=1')) {
        const sep = src.includes('?') ? '&' : '?'
        el.setAttribute('src', `${src}${sep}enablejsapi=1`)
      }
      el.contentWindow?.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        '*'
      )
    } catch (e) {
      console.log('Failed to pause YouTube video:', e)
    }
  })
}


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
