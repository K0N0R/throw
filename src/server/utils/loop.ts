
export function ticker(action: FrameRequestCallback) {
    setInterval((time) => {
        ticker(action);
        action(time);
    });
}