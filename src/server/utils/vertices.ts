import { IPos } from './model';

export function getCornerPoints(amount: number, angle: number, circlePos: IPos, radius: number, clockWise = 1): ([number, number])[] {
    const cornerTickPI = Math.PI / 2 / amount;
    const cornerPoints: ([number, number])[] = [];
    for (let i = 1; i <= amount - 1; i++) {
        cornerPoints.push(
            [radius * Math.cos(angle + cornerTickPI * i * clockWise) + circlePos.x, radius * Math.sin(angle + cornerTickPI * i * clockWise) + circlePos.y]
        )

    }
    return cornerPoints;
}