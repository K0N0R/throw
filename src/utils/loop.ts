
export function ticker(action: FrameRequestCallback) {
    window.requestAnimationFrame((time) => {
        ticker(action);
        action(time);
    });
}