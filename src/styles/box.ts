import { Box } from "../types/box";
import { StrokeStyle, StrokeStyleConfig, StrokeStyleWithFallback } from "./stroke";

export interface BoxStyleConfig {
    border?: StrokeStyleConfig;
    color?: string;
    radius?: number;
}

export function BoxStyleWithFallback(input?: BoxStyleConfig, fallback?: BoxStyleConfig): BoxStyleConfig {
    return {
        radius: input?.radius === undefined ? fallback?.radius : input?.radius,
        color: input?.color === undefined ? fallback?.color : input?.color,
        border: StrokeStyleWithFallback(input?.border, fallback?.border)
    };
}

export class BoxStyle {
    private border: StrokeStyle | null;

    private color: string;

    private radius: number;

    constructor(config?: BoxStyleConfig) {
        this.color = config?.color === undefined ? "#CCCCCC" : config.color;
        this.border = config?.border === undefined ? null : new StrokeStyle(config.border);
        this.radius = config?.radius === undefined ? 2 : config.radius;
    }

    Draw(ctx: CanvasRenderingContext2D, box: Box, scale: number): void {
        ctx.fillStyle = this.color
        this.border?.setupStyle(ctx, scale);
        ctx.beginPath();
        ctx.roundRect(
            box.Position.x,
            box.Position.y,
            box.Size.x,
            box.Size.y,
            this.radius * scale
        );
        ctx.fill();
        ctx.stroke();
    }

    setColor(color: string): void {
        this.color = color;
    }

    setBorderColor(color: string): void {
        if (this.border === null) {
            this.border = new StrokeStyle({
                color: color
            })
        } else {
            this.border.setColor(color);
        }
    }

}