import { FlowNode } from "./node";
import { Port } from "./port";
import { BoxCenter, InBox, Vector2 } from "./types";

export type ConnectionRenderer = (ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, graphScale: number, mouseOver: boolean) => void

export function DefaultConnectionRenderer(connectionSize: number, connectionColor: string): ConnectionRenderer {
    return (ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, graphScale: number, mouseOver: boolean) => {
        const midX = (start.x + end.x) / 2;

        let lineSize = connectionSize * graphScale;
        if (mouseOver) {
            lineSize *= 2;
        }

        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = lineSize;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(midX, start.y, midX, end.y, end.x, end.y);
        ctx.stroke();
    }
}

export class Connection {

    // Variables for holding temp data, preventing object allocations each
    // frame
    private inPos: Vector2;
    private outPos: Vector2;

    constructor(
        private inNode: FlowNode,
        private inNodePortIndex: number,
        private outNode: FlowNode,
        private outNodePortIndex: number,
        private renderer: ConnectionRenderer,
    ) {
        this.inPos = { x: 0, y: 0 };
        this.outPos = { x: 0, y: 0 };
    }

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, graphScale: number, mouseOver: boolean): void {
        const inPortBox = this.inNode.inputPortPosition(this.inNodePortIndex)
        const outPortBox = this.outNode.outputPortPosition(this.outNodePortIndex);

        if (inPortBox === undefined || outPortBox === undefined) {
            return;
        }

        BoxCenter(inPortBox, this.inPos);
        BoxCenter(outPortBox, this.outPos);

        this.renderer(ctx, this.inPos, this.outPos, graphScale, mouseOver);
    }

    mouseOverPort(mousePosition: Vector2): Port | null {
        const inPortBox = this.inNode.inputPortPosition(this.inNodePortIndex)
        if (inPortBox !== undefined && InBox(inPortBox, mousePosition)) {
            return this.inNode.inputPort(this.inNodePortIndex)
        }

        const outPortBox = this.outNode.outputPortPosition(this.outNodePortIndex);
        if (outPortBox !== undefined && InBox(outPortBox, mousePosition)) {
            return this.outNode.outputPort(this.outNodePortIndex)
        }

        return null;
    }
}