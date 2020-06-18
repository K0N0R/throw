import { IPos } from './model';

export interface CornerPointsOptions {
    angleToTake?: number;
    clockWise?: number;
}

export function getCornerPoints(pointsAmount: number, startingAngle: number, circlePos: IPos, radius: number, opts?: CornerPointsOptions): ([number, number])[] {
    const clockWise = opts?.clockWise ? opts.clockWise : 1;
    const angleToTake = opts?.angleToTake ? opts.angleToTake : Math.PI / 2;
    const cornerTickPI = angleToTake / pointsAmount;
    const cornerPoints: ([number, number])[] = [];
    for (let i = 1; i <= pointsAmount - 1; i++) {
        const nextAngle = startingAngle + cornerTickPI * i * clockWise;
        cornerPoints.push(
            [
                radius * Math.cos(nextAngle) + circlePos.x,
                radius * Math.sin(nextAngle) + circlePos.y
            ]
        )

    }
    return cornerPoints;
}