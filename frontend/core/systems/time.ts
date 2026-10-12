export class TimeBase {
    timeCounterMS = 0;
    timeouts: { timeout: number; callback: () => void; group?: string; id: string }[] = [];

    update(deltaMS: number) {
        this.timeCounterMS += deltaMS;
        this.timeouts.forEach((c) => {
            if (c.timeout <= this.timeCounterMS) {
                c.callback();
            }
        });
        this.timeouts = this.timeouts.filter((c) => c.timeout > this.timeCounterMS);
    }

    setTimeout(callback: () => void, timeout: number, group?: string) {
        const id = crypto.randomUUID();
        this.timeouts.push({
            timeout: timeout + this.timeCounterMS,
            callback: callback,
            group: group,
            id: id,
        });
        return id;
    }

    setInterval(callback: () => void, timeout: number, group?: string, id = crypto.randomUUID()) {
        this.timeouts.push({
            timeout: timeout + this.timeCounterMS,
            callback: () => {
                callback();
                if (this.timeouts.find((timeout) => timeout.group === group)) {
                    this.setInterval(callback, timeout, group, id);
                }
            },
            group: group,
            id: id,
        });
        return id;
    }

    clear() {
        this.timeouts = [];
        this.timeCounterMS = 0;
    }

    clearGroup(group: string) {
        this.timeouts = this.timeouts.filter((c) => c.group !== group);
    }

    clearTimeout(id: string) {
        this.timeouts = this.timeouts.filter((c) => c.id !== id);
    }
}

export const WorldTime = new TimeBase();
export const UiTime = new TimeBase();
