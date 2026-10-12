import * as PIXI from 'pixi.js';
import { IPosition, MathUtils } from '../common';

export type TExtendedDisplayObject =
    | PIXI.Container
    | {
          displayObject: PIXI.Container;
          anchor?: { x: number; y: number } | number;
          eventMode?: PIXI.EventMode;
      };

export namespace PixiUtils {
    export function isIntersecting(a: PIXI.Rectangle, b: PIXI.Rectangle) {
        const AhorizontalIntersection =
            (a.right >= b.left && a.right <= b.right) || (a.left >= b.left && a.left <= b.right);
        const AverticalIntersection =
            (a.top >= b.top && a.top <= b.bottom) || (a.bottom >= b.top && a.bottom <= b.bottom);

        const BhorizontalIntersection =
            (b.right >= a.left && b.right <= a.right) || (b.left >= a.left && b.left <= a.right);
        const BverticalIntersection =
            (b.top >= a.top && b.top <= a.bottom) || (b.bottom >= a.top && b.bottom <= a.bottom);
        return (
            (AhorizontalIntersection && AverticalIntersection) ||
            (BhorizontalIntersection && BverticalIntersection) || // aa or bb
            (AhorizontalIntersection && BverticalIntersection) ||
            (BhorizontalIntersection && AverticalIntersection)
        ); // ab or ba
    }

    export function getFromStorage(key: string, defaultValue: any) {
        const jsonValue = window.localStorage.getItem(key);
        if (jsonValue) {
            return JSON.parse(jsonValue);
        } else {
            return defaultValue;
        }
    }

    export function saveToStorage(key: string, value: any) {
        window.localStorage.setItem(key, JSON.stringify(value));
    }

    export function applyExtendedDisplayObjectParams(
        object: TExtendedDisplayObject,
    ): PIXI.Container {
        if (object instanceof PIXI.Container) {
            return object;
        }

        if (
            object.displayObject instanceof PIXI.Sprite ||
            object.displayObject instanceof PIXI.Text
        ) {
            if (object.anchor != null) {
                if (typeof object.anchor === 'number') {
                    object.displayObject.anchor.set(object.anchor, object.anchor);
                } else {
                    object.displayObject.anchor.set(object.anchor.x, object.anchor.y);
                }
            }

            if (typeof object.eventMode === 'string') {
                object.displayObject.eventMode = object.eventMode;
            } else {
                object.displayObject.eventMode = 'passive';
            }
        }

        return object.displayObject;
    }

    export function createGraphicsFromVertices(
        vertices: IPosition[],
        verticesAnchor: IPosition,
        style?: {
            fill?: { color: number; alpha: number };
            stroke?: { width: number; color: number; closePath: boolean };
        },
    ) {
        const graphics = new PIXI.Graphics();
        if (style) {
            if (style.stroke) {
                graphics.setStrokeStyle(style.stroke);
            }
            if (style.fill) {
                graphics.setFillStyle(style.fill);
            }
        }

        vertices.forEach((vertice, index) => {
            if (!index) {
                graphics.moveTo(vertice.x - verticesAnchor.x, vertice.y - verticesAnchor.y);
            } else {
                graphics.lineTo(vertice.x - verticesAnchor.x, vertice.y - verticesAnchor.y);
            }
        });

        if (style?.stroke && style.stroke.closePath) {
            graphics.closePath();
        }

        if (style?.fill) {
            graphics.fill();
        }
        return graphics;
    }

    export function getClosestToElementFromCollection<
        T extends PIXI.Container,
        U extends PIXI.Container,
    >(element: T, collection: U[]): U | undefined {
        return collection
            .concat()
            .sort(
                (a, b) =>
                    MathUtils.distance(
                        element.toGlobal({ x: 0, y: 0 }),
                        b.toGlobal({ x: 0, y: 0 }),
                    ) -
                    MathUtils.distance(
                        element.toGlobal({ x: 0, y: 0 }),
                        a.toGlobal({ x: 0, y: 0 }),
                    ),
            )
            .pop();
    }
}
