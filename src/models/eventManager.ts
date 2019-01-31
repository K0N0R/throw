export interface IObserver {
    event: string;
    handler: Function;
}

export class EventManager {
    private static observers: IObserver[] = [];

    public static add(observer: IObserver): () => void {
        this.observers.push(observer);
        return () => {
            const idx = this.observers.indexOf(observer);
            this.observers.splice(idx, 1);
        };
    }

    public static notify(event: string, value?: any) {
        const eventObservers = this.observers.filter((o) => o.event === event);
        eventObservers.forEach(o => {
            if (typeof o.handler === 'function') o.handler(value)
        });
    }
}