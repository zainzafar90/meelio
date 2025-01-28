declare module "*web-timer.worker?worker" {
  class WebTimerWorker extends Worker {
    constructor();
  }
  export default WebTimerWorker;
}
