import { TSystemMessage, TInputMessage, TStateMessage } from './busInterfaces';

export type TBusTopic = {
    input: TInputMessage;
    system: TSystemMessage;
    state: TStateMessage;
};

export type TBusMessage<T extends keyof TBusTopic = keyof TBusTopic> = TBusTopic[T][number];

class BusBase {
    private observers: {
        topic: keyof TBusTopic;
        owner: any;
        action: (message: TBusMessage) => void;
    }[] = [];

    public subscribe<T extends keyof TBusTopic>(
        topic: T,
        action: (message: TBusMessage<T>) => void,
        owner: any,
    ) {
        this.observers.push({ topic, action: action, owner });
    }

    public unsubscribeOwner(owner: any, topic?: keyof TBusTopic) {
        if (topic) {
            this.observers = this.observers.filter(
                (observer) => observer.owner !== owner && observer.topic !== topic,
            );
        } else {
            this.observers = this.observers.filter((observer) => observer.owner !== owner);
        }
    }

    public clearHandlers() {
        this.observers = [];
    }

    public emit<T extends keyof TBusTopic>(topic: T, data: TBusMessage<T>) {
        this.observers
            .filter((i) => i.topic === topic)
            .forEach((i) => {
                i.action(data);
            });
    }
}

export const Bus = new BusBase();
