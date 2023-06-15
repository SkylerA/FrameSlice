type MessageCb = (
  frame: number,
  currentTime: number,
  currentTarget: number,
  thisPtr: ProgrammableTimer
) => void;

class ProgrammableTimer {
  frame: number;
  target: number;
  interval: number;
  stopped: boolean;
  callback: MessageCb;

  // https://stackoverflow.com/a/70749281/81008
  constructor(hertz: number, callback: MessageCb) {
    this.target = performance.now(); // target time for the next frame
    this.interval = (1 / hertz) * 1000; // the milliseconds between ticks
    this.callback = callback;
    this.stopped = false;
    this.frame = 0;

    this.tick(this);
  }

  tick(self: ProgrammableTimer) {
    if (self.stopped) return;

    const currentTime = performance.now();
    const currentTarget = self.target;
    const currentInterval = (self.target += self.interval) - currentTime;

    setTimeout(self.tick, currentInterval, self);
    self.callback(self.frame++, currentTime, currentTarget, self);
  }

  stop() {
    this.stopped = true;
    return this.frame;
  }

  adapt(hertz: number) {
    return (this.interval = (1 / hertz) * 1000);
  }

  redefine(replacement: MessageCb) {
    this.callback = replacement;
  }
}

let timer: ProgrammableTimer | undefined = undefined;
let sampleRate = 60;

const postFrameMsgCb: MessageCb = (
  frame,
  currentTime,
  currentTarget,
  thisPtr
) => {
  postMessage({ frame, currentTime, currentTarget });
};

onmessage = function (e) {
  switch (e.data["cmd"].toLowerCase()) {
    case "start":
      postMessage(e.data);
      if (timer === undefined) {
        timer = new ProgrammableTimer(sampleRate, postFrameMsgCb);
      }
      break;

    case "stop":
      timer?.stop();
      timer = undefined;
      break;

    default:
      break;
  }
};
