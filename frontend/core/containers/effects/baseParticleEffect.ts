// BaseParticleEffect.ts
import { ParticleContainer, Particle, Texture, Ticker } from 'pixi.js';

export interface ParticleEffectConfig {
    maxParticles?: number;
    emissionRate?: number;
    lifetime?: [number, number];
    speed?: [number, number];
    scale?: [number, number];
    alpha?: [number, number];
    angle?: [number, number];
    gravity?: number;
    friction?: number;
    angularSpeed?: [number, number];

    tint?: [number, number];
    wind?: { strength: number; frequency: number };
    emitArea?: { width: number; height: number };

    dynamic?: {
        position?: boolean;
        rotation?: boolean;
        scale?: boolean;
        color?: boolean;
    };
}

export class BaseParticleEffect extends ParticleContainer {
    private _texArray: Texture[];

    private cfg: Required<ParticleEffectConfig>;
    private pool: Particle[] = [];
    private live: Particle[] = [];
    private data: {
        vx: number;
        vy: number;
        life: number;
        age: number;
        startAlpha: number;
        endAlpha: number;
        startScale: number;
        endScale: number;
        startTint: number;
        endTint: number;
        angularSpeed: number;
        windOffset: number;
        windFrequency: number;
    }[] = [];

    private running = false;
    private onceUpdating = false;
    private emitAcc = 0;

    constructor(config: ParticleEffectConfig, textures: Texture | Texture[]) {
        const texturesArray = Array.isArray(textures) ? textures : [textures];
        const firstTexture = texturesArray[0];

        super({
            texture: firstTexture,
            dynamicProperties: {
                position: config.dynamic?.position ?? true,
                rotation: config.dynamic?.rotation ?? true,
                vertex: config.dynamic?.scale ?? true,
                color: config.dynamic?.color ?? true,
                uvs: texturesArray.length > 1 ? true : false,
            },
        });

        this._texArray = Array.isArray(textures) ? textures : [textures];
        this.cfg = {
            maxParticles: config.maxParticles ?? 500,
            emissionRate: config.emissionRate ?? 80,
            lifetime: config.lifetime ?? [0.5, 1.5],
            speed: config.speed ?? [80, 220],
            scale: config.scale ?? [0.6, 1.2],
            alpha: config.alpha ?? [1, 0],
            angle: config.angle ?? [0, 360],
            gravity: config.gravity ?? 0,
            friction: config.friction ?? 1.0,
            angularSpeed: config.angularSpeed ?? [0, 0],
            tint: config.tint ?? [0xffffff, 0xffffff],
            wind: config.wind ?? { strength: 0, frequency: 0 },
            emitArea: config.emitArea ?? { width: 0, height: 0 },
            dynamic: {
                position: config.dynamic?.position ?? true,
                rotation: config.dynamic?.rotation ?? true,
                scale: config.dynamic?.scale ?? true,
                color: config.dynamic?.color ?? true,
            },
        };
    }

    public start(autoUpdate = true): void {
        this.running = true;
        this.emitAcc = 0;
        if (autoUpdate) Ticker.shared.add(this._tickMain, this);
    }

    public stop(): void {
        this.running = false;
        Ticker.shared.remove(this._tickMain, this);
    }

    public emitOnce(count?: number): void {
        const amount = count ?? this.cfg.maxParticles;
        for (let i = 0; i < amount && this.live.length < this.cfg.maxParticles; i++) {
            this._spawn();
        }
        if (!this.running && !this.onceUpdating) {
            this.onceUpdating = true;
            Ticker.shared.add(this._tickOnce, this);
        }
    }

    public setEmitterPosition(x: number, y: number): void {
        this.position.set(x, y);
    }

    public override destroy(options?: Parameters<ParticleContainer['destroy']>[0]): void {
        this.stop();
        if (this.onceUpdating) {
            Ticker.shared.remove(this._tickOnce, this);
            this.onceUpdating = false;
        }
        for (let i = this.live.length - 1; i >= 0; i--) {
            this.removeParticle(this.live[i]);
        }
        this.pool.length = 0;
        this.live.length = 0;
        this.data.length = 0;
        super.destroy(options as any);
    }

    // ===== Ticki =====

    private _tickMain(ticker: Ticker): void {
        if (!this.running) return;
        const dt = ticker.deltaMS / 1000;
        this._emitContinuous(dt);
        this._updateParticles(dt);
    }

    private _tickOnce(ticker: Ticker): void {
        const dt = ticker.deltaMS / 1000;
        this._updateParticles(dt);
        if (this.live.length === 0) {
            Ticker.shared.remove(this._tickOnce, this);
            this.onceUpdating = false;
        }
    }

    // ===== Emisja / update =====

    private _emitContinuous(dt: number): void {
        this.emitAcc += dt;
        let toEmit = Math.floor(this.emitAcc * this.cfg.emissionRate);
        if (toEmit > 0) this.emitAcc -= toEmit / this.cfg.emissionRate;
        while (toEmit-- > 0 && this.live.length < this.cfg.maxParticles) {
            this._spawn();
        }
    }

    private _updateParticles(dt: number): void {
        const hasFriction = this.cfg.friction !== 1.0;
        const hasWind = this.cfg.wind.strength !== 0 && this.cfg.wind.frequency !== 0;

        for (let i = this.live.length - 1; i >= 0; i--) {
            const p = this.live[i];
            const d = this.data[i];

            d.age += dt;
            if (d.age >= d.life) {
                this._despawnAt(i);
                continue;
            }

            if (hasFriction) {
                d.vx *= this.cfg.friction;
                d.vy *= this.cfg.friction;
            }
            p.x += d.vx * dt;
            p.y += d.vy * dt;
            d.vy += this.cfg.gravity * dt;

            const t = d.age / d.life;
            p.alpha = d.startAlpha + t * (d.endAlpha - d.startAlpha);
            const s = d.startScale + t * (d.endScale - d.startScale);
            p.scaleX = s;
            p.scaleY = s;

            p.tint = lerpColor(d.startTint, d.endTint, t);

            if (hasWind) {
                p.x +=
                    Math.sin(d.age * d.windFrequency + d.windOffset) * this.cfg.wind.strength * dt;
            }

            p.rotation += d.angularSpeed * dt;
        }
    }

    // ===== Spawn / despawn =====

    private _spawn(): void {
        // losowanie tekstury
        const tex = this._texArray[(Math.random() * this._texArray.length) | 0];
        const p = this.pool.pop() ?? new Particle({ texture: tex });
        p.texture = tex;

        p.anchorX = 0.5;
        p.anchorY = 0.5;

        const offsetX = (Math.random() - 0.5) * this.cfg.emitArea.width;
        const offsetY = (Math.random() - 0.5) * this.cfg.emitArea.height;
        p.x = offsetX;
        p.y = offsetY;
        p.rotation = 0;

        const ang = deg2rad(rand(this.cfg.angle[0], this.cfg.angle[1]));
        const spd = rand(this.cfg.speed[0], this.cfg.speed[1]);
        const startScale = rand(this.cfg.scale[0], this.cfg.scale[1]);
        const endScale = startScale * 0.5;

        const [startTint, endTint] = this.cfg.tint;
        const angSpeed = deg2rad(rand(this.cfg.angularSpeed[0], this.cfg.angularSpeed[1]));

        const windOffset = Math.random() * Math.PI * 2;
        const windFrequency = this.cfg.wind.frequency * rand(0.8, 1.2);

        p.alpha = this.cfg.alpha[0];
        p.scaleX = startScale;
        p.scaleY = startScale;
        p.tint = startTint;

        this.addParticle(p);

        this.live.push(p);
        this.data.push({
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: rand(this.cfg.lifetime[0], this.cfg.lifetime[1]),
            age: 0,
            startAlpha: this.cfg.alpha[0],
            endAlpha: this.cfg.alpha[1],
            startScale,
            endScale,
            startTint,
            endTint,
            angularSpeed: angSpeed,
            windOffset,
            windFrequency,
        });
    }

    private _despawnAt(i: number): void {
        const p = this.live[i];
        this.removeParticle(p);
        this.pool.push(p);
        this.live.splice(i, 1);
        this.data.splice(i, 1);
    }
}

// ===== Helpers =====
function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}
function deg2rad(d: number) {
    return (d * Math.PI) / 180;
}

function lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff,
        ag = (a >> 8) & 0xff,
        ab = a & 0xff;
    const br = (b >> 16) & 0xff,
        bg = (b >> 8) & 0xff,
        bb = b & 0xff;
    const rr = (ar + (br - ar) * t) & 0xff;
    const rg = (ag + (bg - ag) * t) & 0xff;
    const rb = (ab + (bb - ab) * t) & 0xff;
    return (rr << 16) | (rg << 8) | rb;
}
