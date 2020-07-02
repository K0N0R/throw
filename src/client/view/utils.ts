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