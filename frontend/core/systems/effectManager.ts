import { Tween, Interpolation, Easing, Group } from '@tweenjs/tween.js';
import * as PIXI from 'pixi.js';
import { IPosition, MathUtils } from '@common';

export type TEffectConfigGroup = 'gameplay' | 'ui';

export type TBaseEffectConfig = {
    durationMS: number;
    easing?: (number: number) => number;
    interpolation?: any;
    group?: TEffectConfigGroup;
};

type TAffectedCoordinatesObject = PIXI.Container | IPosition;

type IPositionObject = IPosition | { x: number[]; y: number[] };

export type TRunningEffect = {
    tween: Tween<any>;
    displayObject: TAffectedCoordinatesObject;
};

export class EffectsManagerBase {
    public easing = Easing;

    private runningEffects: TRunningEffect[] = [];

    private gameplayGroup = new Group();
    private uiGroup = new Group();

    private gameplayTimer = 0;
    private uiTimer = 0;

    clearAllEffects() {
        this.runningEffects.forEach((effect) => effect.tween.stop());
    }

    clearAllEffectsFromContainer(displayObject: PIXI.Container | any) {
        this.runningEffects
            .filter((runningEffect) => runningEffect.displayObject === displayObject)
            .forEach((effect) => effect.tween.stop());
    }

    updateGameplay(deltaMS: number) {
        this.gameplayTimer += deltaMS;
        this.gameplayGroup.update(this.gameplayTimer);
    }

    updateUi(deltaMS: number) {
        this.uiTimer += deltaMS;
        this.uiGroup.update(this.uiTimer);
    }

    async moveTrajectory(
        obj: PIXI.Container,
        deltaTarget: IPosition,
        height: number,
        durationMS: number,
        beforeUpdate?: (position: IPositionObject) => void,
        afterUpdate?: (position: IPositionObject) => void,
    ) {
        const midPoint = {
            x: (obj.x + deltaTarget.x + obj.x) / 2,
            y: (obj.y + deltaTarget.y + obj.y) / 2 + height,
        };

        await this.tweenEffect<IPositionObject>(
            {
                from: { x: obj.x, y: obj.y },
                to: {
                    x: [midPoint.x, obj.x + deltaTarget.x],
                    y: [midPoint.y, obj.y + deltaTarget.y],
                },
                durationMS,
                interpolation: Interpolation.Bezier,
                obj,
            },
            (position: IPositionObject) => {
                const x = position.x instanceof Array ? position.x[1] : position.x;
                const y = position.y instanceof Array ? position.y[1] : position.y;
                beforeUpdate?.(position);
                obj.x = x;
                obj.y = y;
                afterUpdate?.(position);
            },
        );
    }

    async shake(
        obj: TAffectedCoordinatesObject,
        config: { amplitude: number } & TBaseEffectConfig,
    ) {
        const startX = obj.x;
        const startY = obj.y;

        await this.tweenEffect(
            {
                durationMS: config.durationMS,
                from: { value: 0 },
                to: { value: 1 },
                obj,
            },
            () => {
                obj.x =
                    startX + MathUtils.getRandomValueFromRange(-config.amplitude, config.amplitude);
                obj.y =
                    startY + MathUtils.getRandomValueFromRange(-config.amplitude, config.amplitude);
            },
        );

        obj.x = startX;
        obj.y = startY;
    }

    async shakeFade(
        obj: TAffectedCoordinatesObject,
        config: { amplitude: number } & TBaseEffectConfig,
    ) {
        const startX = obj.x;
        const startY = obj.y;

        await this.tweenEffect(
            {
                ...config,
                from: { value: -config.amplitude },
                to: { value: config.amplitude },
                obj,
            },
            ({ value }) => {
                obj.x = startX + MathUtils.getRandomValueFromRange(-value, value);
                obj.y = startY + MathUtils.getRandomValueFromRange(-value, value);
            },
        );

        obj.x = startX;
        obj.y = startY;
    }

    async move(
        obj: TAffectedCoordinatesObject,
        config: { x: number; y: number; onMove?: (pos: IPosition) => void } & TBaseEffectConfig,
    ) {
        await this.tweenEffect(
            {
                ...config,
                from: { x: obj.x, y: obj.y },
                to: { x: config.x, y: config.y },
                obj,
            },
            (position: IPosition) => {
                obj.x = position.x;
                obj.y = position.y;
                config.onMove?.(position);
            },
        );
    }

    async moveX(obj: TAffectedCoordinatesObject, config: { x: number } & TBaseEffectConfig) {
        await this.tweenEffect(
            {
                ...config,
                from: { x: obj.x },
                to: { x: config.x },
                obj,
            },
            (latest) => {
                obj.x = latest.x;
            },
        );
    }

    async moveY(
        obj: TAffectedCoordinatesObject | IPosition,
        config: { y: number } & TBaseEffectConfig,
    ) {
        await this.tweenEffect(
            {
                ...config,
                from: { y: obj.y },
                to: { y: config.y },
                obj,
            },
            (latest) => {
                obj.y = latest.y;
            },
        );
    }

    async alpha(obj: PIXI.Container, config: { alpha: number } & TBaseEffectConfig) {
        await this.tweenEffect(
            {
                ...config,
                from: { alpha: obj.alpha },
                to: { alpha: config.alpha },
                obj,
            },
            (value) => (obj.alpha = value.alpha),
        );
    }

    async scale(obj: PIXI.Container, config: { x: number; y: number } & TBaseEffectConfig) {
        await this.tweenEffect(
            {
                ...config,
                from: { x: obj.scale.x, y: obj.scale.y },
                to: { x: config.x, y: config.y },
                obj,
            },
            (latest) => {
                obj.scale.x = latest.x;
                obj.scale.y = latest.y;
            },
        );
    }

    async resizeSprite(
        obj: PIXI.Sprite,
        config: { width: number; height: number } & TBaseEffectConfig,
    ) {
        await this.tweenEffect(
            {
                ...config,
                from: { width: obj.width, height: obj.height },
                to: { width: config.width, height: config.height },
                obj,
            },
            (latest) => {
                obj.width = latest.width;
                obj.height = latest.height;
            },
        );
    }

    async value<T>(
        obj: T,
        config: { value: number; fieldName: keyof T; onUpdate?: () => void } & TBaseEffectConfig,
    ) {
        const fieldName = config.fieldName;
        await this.tweenEffect(
            {
                ...config,
                from: { [fieldName]: obj[fieldName] },
                to: { [fieldName]: config.value },
                obj: obj as PIXI.Container,
            },
            (latest) => {
                obj[fieldName] = (latest as T)[fieldName];
                config?.onUpdate?.();
            },
        );
    }

    async callback(
        owner: any,
        config: { from: number; to: number } & TBaseEffectConfig,
        callback: (value: number) => void,
    ) {
        await this.tweenEffect(
            {
                ...config,
                from: { value: config.from },
                to: { value: config.to },
                obj: owner as PIXI.Container,
            },
            (latest) => {
                callback(latest.value!);
            },
        );
    }

    async rotate(obj: PIXI.Container, config: { angle: number } & TBaseEffectConfig) {
        await this.tweenEffect(
            {
                ...config,
                from: { angle: obj.angle },
                to: { angle: config.angle },
                obj,
            },
            (latest) => {
                obj.angle = latest.angle;
            },
        );
    }

    async tint(obj: PIXI.Container, config: { tint: number } & TBaseEffectConfig) {
        const getTint = () => {
            return obj.tint;
        };

        const setColor = (r: number, g: number, b: number) => {
            obj.tint = new PIXI.Color([r, g, b]).toNumber();
        };

        const startColor = new PIXI.Color(getTint());
        const endColor = new PIXI.Color(config.tint);

        await this.tweenEffect(
            {
                durationMS: config.durationMS,
                from: { r: startColor.red, g: startColor.green, b: startColor.blue },
                to: endColor.toRgb(),
                obj,
            },
            (value) => {
                setColor(value.r, value.g, value.b);
            },
        );
    }

    private tweenEffect<T extends Record<string, any>>(
        config: TBaseEffectConfig & { from: T; to: T; obj: PIXI.Container | IPosition },
        onUpdate: (latest: T) => void,
    ) {
        const effectConfigDefaults = {
            easing: Easing.Linear.None,
            group: 'ui' as TEffectConfigGroup,
        };

        const fullConfig = { ...effectConfigDefaults, ...config };

        const group = this.getGroup(fullConfig.group);
        const timer = this.getGroupTimer(fullConfig.group);

        return new Promise<void>((resolve) => {
            const tween = new Tween(fullConfig.from, group)
                .to(fullConfig.to, fullConfig.durationMS)
                .easing(fullConfig.easing)
                .onUpdate(onUpdate)
                .onComplete(() => resolve())
                .start(timer);

            if (fullConfig.interpolation) {
                tween.interpolation(Interpolation.Bezier);
            }

            this.runningEffects.push({
                tween,
                displayObject: config.obj,
            });
        });
    }

    private getGroup(groupName: TEffectConfigGroup) {
        switch (groupName) {
            case 'gameplay':
                return this.gameplayGroup;
            case 'ui':
                return this.uiGroup;
        }
    }

    private getGroupTimer(groupName: TEffectConfigGroup) {
        switch (groupName) {
            case 'gameplay':
                return this.gameplayTimer;
            case 'ui':
                return this.uiTimer;
        }
    }
}

export const EffectsManager = new EffectsManagerBase();
