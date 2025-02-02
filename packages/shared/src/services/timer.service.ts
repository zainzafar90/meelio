// import { TimerState } from "../types/timer";

// export interface TimerWorker {
//   start(duration: number): void;
//   pause(): void;
//   reset(): void;
//   onTick(callback: (remaining: number) => void): void;
//   onComplete(callback: () => void): void;
// }

// export class TimerService {
//   private tickCallbacks: ((remaining: number) => void)[] = [];
//   private completeCallbacks: (() => void)[] = [];
//   private stateCallbacks: ((state: TimerState) => void)[] = [];
//   private type: "web" | "extension";
//   private worker?: Worker;

//   constructor(type: "web" | "extension", worker?: Worker) {
//     this.type = type;
//     if (type === "web" && !worker) {
//       throw new Error("Worker is required for web timer");
//     }
//     this.worker = worker;
//     this.setupListeners();
//   }

//   private setupListeners() {
//     if (this.type === "web" && this.worker) {
//       this.worker.onmessage = (e) => {
//         if (e.data.type === "STATE_UPDATE") {
//           const state = e.data.state;
//           this.stateCallbacks.forEach((cb) =>
//             cb({
//               remaining: state.timeLeft,
//               isRunning: state.isRunning,
//             })
//           );

//           // For backwards compatibility
//           this.tickCallbacks.forEach((cb) => cb(state.timeLeft));
//           if (state.timeLeft === 0) {
//             this.completeCallbacks.forEach((cb) => cb());
//           }
//         }
//       };
//     } else if (this.type === "extension") {
//       chrome.runtime.onMessage.addListener((message) => {
//         if (message.type === "STATE_UPDATE") {
//           const state = message.state;
//           this.stateCallbacks.forEach((cb) =>
//             cb({
//               remaining: state.timeLeft,
//               isRunning: state.isRunning,
//             })
//           );

//           // For backwards compatibility
//           this.tickCallbacks.forEach((cb) => cb(state.timeLeft));
//           if (state.timeLeft === 0) {
//             this.completeCallbacks.forEach((cb) => cb());
//           }
//         }
//       });
//     }
//   }

//   start(duration: number) {
//     if (this.type === "web" && this.worker) {
//       this.worker.postMessage({ type: "START_TIMER", duration });
//     } else if (this.type === "extension") {
//       chrome.runtime.sendMessage({ type: "START_TIMER", duration });
//     }
//   }

//   pause() {
//     if (this.type === "web" && this.worker) {
//       this.worker.postMessage({ type: "PAUSE_TIMER" });
//     } else if (this.type === "extension") {
//       chrome.runtime.sendMessage({ type: "PAUSE_TIMER" });
//     }
//   }

//   reset() {
//     if (this.type === "web" && this.worker) {
//       this.worker.postMessage({ type: "RESET_TIMER" });
//     } else if (this.type === "extension") {
//       chrome.runtime.sendMessage({ type: "RESET_TIMER" });
//     }
//   }

//   getState() {
//     if (this.type === "web" && this.worker) {
//       this.worker.postMessage({ type: "GET_TIME" });
//     } else if (this.type === "extension") {
//       chrome.runtime.sendMessage({ type: "GET_TIME" });
//     }
//   }

//   onTick(callback: (remaining: number) => void) {
//     this.tickCallbacks.push(callback);
//     return () => {
//       this.tickCallbacks = this.tickCallbacks.filter((cb) => cb !== callback);
//     };
//   }

//   onComplete(callback: () => void) {
//     this.completeCallbacks.push(callback);
//     return () => {
//       this.completeCallbacks = this.completeCallbacks.filter(
//         (cb) => cb !== callback
//       );
//     };
//   }

//   onStateChange(callback: (state: TimerState) => void) {
//     this.stateCallbacks.push(callback);
//     // Get initial state
//     this.getState();
//     return () => {
//       this.stateCallbacks = this.stateCallbacks.filter((cb) => cb !== callback);
//     };
//   }
// }
