import { Vector2 } from "../types/vector2";

export enum FontWeight {
    Normal = "",
    Bold = "bold"
}

export interface TextStyleConfig {
    size?: number;
    color?: string;
    font?: string;
    weight?: FontWeight;
}

export const DefaultSize: number = 16;
export const DefaultColor: string = "black";
export const DefaultFont: string = "Courier New";

export function TextStyleFallback(input?: TextStyleConfig, fallback?: TextStyleConfig): TextStyleConfig {
    return {
        color: input?.color === undefined ? fallback?.color : input?.color,
        size: input?.size === undefined ? fallback?.size : input?.size,
        font: input?.font === undefined ? fallback?.font : input?.font,
        weight: input?.weight === undefined ? fallback?.weight : input?.weight,
    };
}

export class TextStyle {

    private size: number;

    private color: string;

    private font: string;

    private weight: FontWeight

    constructor(config: TextStyleConfig | undefined) {
        this.size = config?.size === undefined ? DefaultSize : config.size;
        this.color = config?.color === undefined ? DefaultColor : config.color;
        this.font = config?.font === undefined ? DefaultFont : config.font;
        this.weight = config?.weight === undefined ? FontWeight.Normal : config.weight;
    }

    setupStyle(ctx: CanvasRenderingContext2D, scale: number): void {
        ctx.fillStyle = this.color;
        ctx.font = this.weight + " " + (this.size * scale) + "px " + this.font;
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

    setColor(color: string): void {
        this.color = color;
    }
}