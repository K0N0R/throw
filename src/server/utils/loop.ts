
export function ticker(action: FrameRequestCallback) {
    requestAnimationFrame((time) => {
        ticker(action);
        action(time);
    });
}