import { IPosition } from '@common';

export type TStateMessage = [{ name: 'gameplay-start' }, { name: 'lobby-start' }];
export type TSystemMessage = [
    { name: 'preload'; data: number },
    { name: 'time-scale'; data: { timeScale: number } },
];
export type TInputMessage = [
    { name: 'resize'; data: { width: number; height: number } },
    { name: 'keyup'; data: string },
    { name: 'keydown'; data: string },
    { name: 'pointerdown'; data: boolean },
    { name: 'pointerup'; data: boolean },
    { name: 'pointermove'; data: IPosition },
    { name: 'pointer-world-position'; data: IPosition },
    { name: 'contextmenu'; data: boolean },
    { name: 'wheel'; data: number },
];
