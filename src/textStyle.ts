import { Vector2 } from "./types";

export interface TextStyleConfig {
    size?: number;
    color?: string;
}

export class TextStyle {
    private size: number;

    private color: string;

    constructor(config: TextStyleConfig) {
        this.size = config.size === undefined ? 16 : config.size;
        this.color = config.color === undefined ? "black" : config.color;
    }

    setupStyle(ctx: CanvasRenderingContext2D, scale: number): void {
        ctx.fillStyle = this.color;
        ctx.font = (this.size * scale) + "px Arial";
    }

    getSize(): number {
        return this.size;
    }

    measure(ctx: CanvasRenderingContext2D, scale: number, text: string): Vector2 {
        this.setupStyle(ctx, scale);
        const measurements = ctx.measureText(text)
        return {
            x: measurements.width,
            y: measurements.actualBoundingBoxAscent + measurements.actualBoundingBoxDescent
        }
    }
}