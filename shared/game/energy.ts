import { arenaEnergyPads, DEFAULT_ARENA, type ArenaSettings } from './arenas';
export const ENERGY_RULES = {
    maximum: 100,
    pickup: 35,
    drainPerSecond: 25,
    speed: 9,
    acceleration: 48,
    padRadius: 0.55,
    respawnSeconds: 8,
};
export const ENERGY_PADS = [
    { x: 4, y: 2 },
    { x: 12, y: 2 },
    { x: 20, y: 2 },
    { x: 4, y: 10 },
    { x: 12, y: 10 },
    { x: 20, y: 10 },
] as const;
export class EnergySystem {
    private pads = arenaEnergyPads(DEFAULT_ARENA);
    energy: number[] = [];
    boosting: boolean[] = [];
    padCooldowns: number[] = [];
    reset(players: number, arena: ArenaSettings = DEFAULT_ARENA) {
        this.pads = arenaEnergyPads(arena);
        this.energy = Array.from({ length: players }, () => 0);
        this.boosting = this.energy.map(() => false);
        this.padCooldowns = this.pads.map(() => 0);
    }
    tick(dt: number) {
        this.padCooldowns = this.padCooldowns.map((value) => Math.max(0, value - dt));
        this.boosting.fill(false);
    }
    boost(seat: number, requested: boolean, dt: number) {
        const active = requested && this.energy[seat] > 0;
        this.boosting[seat] = active;
        if (active)
            this.energy[seat] = Math.max(0, this.energy[seat] - ENERGY_RULES.drainPerSecond * dt);
        return active;
    }
    collect(seat: number, position: { x: number; y: number }, playerRadius: number) {
        if (this.energy[seat] >= ENERGY_RULES.maximum) return;
        this.pads.forEach((pad, index) => {
            if (
                this.padCooldowns[index] > 0 ||
                Math.hypot(position.x - pad.x, position.y - pad.y) >
                    playerRadius + ENERGY_RULES.padRadius
            )
                return;
            this.energy[seat] = Math.min(
                ENERGY_RULES.maximum,
                this.energy[seat] + ENERGY_RULES.pickup,
            );
            this.padCooldowns[index] = ENERGY_RULES.respawnSeconds;
        });
    }
}
