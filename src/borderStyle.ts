export interface BorderStyleConfig {
    radius?: number;
    size?: number;
    color?: string;
}

export class BorderStyle {
    private size: number;

    private radius: number;

    private color: string;

    constructor(config: BorderStyleConfig) {
        this.size = config.size === undefined ? 1 : config.size;
        this.color = config.color === undefined ? "black" : config.color;
        this.radius = config.radius === undefined ? 15 : config.radius;
    }

    setupStyle(ctx: CanvasRenderingContext2D, scale: number): void {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = scale * this.size;
    }

    getRadius(scale: number): number {
        return this.radius * scale;
    }
}