
export function loopFnc(action: FrameRequestCallback) {
    window.requestAnimationFrame((time) => {
        loopFnc(action);
        action(time);
    });
 
}