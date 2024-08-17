import { Box, Vector2 } from '../types';

export const width = 150;
export const height = 30;
export const borderRadius = 15;

export interface Widget {
    Size(): Vector2
    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box
}