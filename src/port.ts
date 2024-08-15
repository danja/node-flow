import { Connection } from "./connection";
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

    private connections: Array<Connection>;

    constructor(config: PortConfig) {
        this.connections = new Array<Connection>();
        this.displayName = config.name;

        this.emptyStyle = {
            borderColor: config.emptyStyle?.borderColor === undefined ? "#1c1c1c" : config.emptyStyle?.borderColor,
            fillColor: config.emptyStyle?.fillColor === undefined ? "#999999" : config.emptyStyle?.fillColor,
            borderSize: config.emptyStyle?.borderSize === undefined ? 1 : config.emptyStyle?.borderSize,
            size: config.emptyStyle?.size === undefined ? 4 : config.emptyStyle?.size
        }

        this.filledStyle = {
            borderColor: config.filledStyle?.borderColor === undefined ? "#1c1c1c" : config.filledStyle?.borderColor,
            fillColor: config.filledStyle?.fillColor === undefined ? "#00FF00" : config.filledStyle?.fillColor,
            borderSize: config.filledStyle?.borderSize === undefined ? 1 : config.filledStyle?.borderSize,
            size: config.filledStyle?.size === undefined ? 5 : config.filledStyle?.size
        }
    }

    addConnection(connection: Connection): void {
        this.connections.push(connection);
    }

    clearConnection(connection: Connection): void {
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        } else {
            console.error("no connection found to remove");
        }
    }

    getDisplayName(): string {
        return this.displayName;
    }

    render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number): Box {
        let style = this.emptyStyle;
        if (this.connections.length > 0) {
            style = this.filledStyle;
        }

        const radius = style.size as number * scale
        ctx.strokeStyle = style.borderColor as string;
        ctx.fillStyle = style.fillColor as string;
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