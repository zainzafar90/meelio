const pauseHTML5Videos = () => {
  const videos = document.querySelectorAll('video')
  videos.forEach(video => {
    video.pause()
  })
}

const pauseYouTubeVideos = () => {
  const youtubeFrames = document.querySelectorAll('iframe[src*="youtube.com"]')
  youtubeFrames.forEach(frame => {
    try {
      (frame as HTMLIFrameElement).contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
    } catch (e) {
      console.log('Failed to pause YouTube video:', e)
    }
  })
}


export const pauseAllVideos = () => {
  pauseHTML5Videos()
  pauseYouTubeVideos()
} 