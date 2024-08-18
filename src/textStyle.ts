import { Vector2 } from "./types/vector2";

export interface TextStyleConfig {
    size?: number;
    color?: string;
    font?: string;
}

export const DefaultSize: number = 16;
export const DefaultColor: string = "black";
export const DefaultFont: string = "Verdana";

export class TextStyle {
    private size: number;

    private color: string;

    private font: string;

    constructor(config: TextStyleConfig | undefined) {
        this.size = config?.size === undefined ? DefaultSize : config.size;
        this.color = config?.color === undefined ? DefaultColor : config.color;
        this.font = config?.font === undefined ? DefaultFont : config.font;
    }

    setupStyle(ctx: CanvasRenderingContext2D, scale: number): void {
        ctx.fillStyle = this.color;
        ctx.font = (this.size * scale) + "px " + this.font;
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