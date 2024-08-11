import { Box, Vector2 } from "./types";

export interface PortStyle {
    size?: number;
    fillColor?: string;
    borderColor?: string;
    borderSize?: number;
}

export interface PortConfig {
    name: string;
    type: string;
    emptyStyle?: PortStyle;
    filledStyle?: PortStyle;
};

export class Port {

    private displayName: string;

    private emptyStyle: PortStyle;

    private filledStyle: PortStyle;

    constructor(config: PortConfig) {
        this.displayName = config.name;
        this.emptyStyle = {
            borderColor: config.emptyStyle?.borderColor === undefined ? "#1c1c1c" : config.emptyStyle?.borderColor,
            fillColor: config.emptyStyle?.fillColor === undefined ? "#999999" : config.emptyStyle?.fillColor,
            borderSize: config.emptyStyle?.borderSize === undefined ? 1 : config.emptyStyle?.borderSize,
            size: config.emptyStyle?.size === undefined ? 4 : config.emptyStyle?.size
        }
    }

    getDisplayName(): string {
        return this.displayName;
    }

    render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number): Box {
        const radius = this.emptyStyle.size as number * scale
        ctx.strokeStyle = this.emptyStyle.borderColor as string;
        ctx.fillStyle = this.emptyStyle.fillColor as string;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        return {
            Position: {
                x: position.x - radius,
                y: position.y - radius,
            },
            Size: {
                x: radius * 2,
                y: radius * 2,
            }
        }
    }
}