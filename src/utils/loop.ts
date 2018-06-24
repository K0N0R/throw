
export function loopFnc(action: Function) {
    window.requestAnimationFrame(() => { loopFnc(action) });
    action();
}