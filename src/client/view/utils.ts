import { render } from "preact";

export const goTo = (vnode: preact.ComponentChild) => {
    render(vnode, document.body);
}

const tick: number[] = [];
export const fpsMeter = () => {
    const now = performance.now();
    while (tick.length > 0 && tick[0] <= now - 1000) {
        tick.shift();
    }
    tick.push(now);
    return tick.length;
}

export const playSound = (id: string, volume: number = 0.5) => {
    const element: HTMLAudioElement | null = document.querySelector(id)
    if (!element) return;
    element.volume = volume;
    element.play();
}

export const loopSound = (id: string, time: number, volume: number) => {
    const element: HTMLAudioElement | null = document.querySelector(id)
    if (!element) return () => {};
    element.volume = volume;
    element.currentTime = 0;
    element.play();
    const interval = setInterval(() => {
        element.currentTime = 0;
        element.play();
    }, time);
    return () => {
        element.pause();
        clearInterval(interval);
    }
}

export const stopSound = (id: string) => {
    const element: HTMLAudioElement | null = document.querySelector(id)
    if (!element) return;
    element.pause();
}

export const setSoundVolume = (id: string, volume: number): void =>  {
    const element: HTMLAudioElement | null = document.querySelector(id)
    if (!element) return;
    element.volume = volume;
}