import { FlowNode } from "./node";
import { Port } from "./port";
import { BoxCenter, InBox, Vector2 } from "./types";

export type ConnectionRenderer = (ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, graphScale: number, mouseOver: boolean) => void

export function DefaultConnectionRenderer(connectionSize: number, connectionColor: string, mouseOverSize: number, mouseOverColor: string): ConnectionRenderer {
    return (ctx: CanvasRenderingContext2D, start: Vector2, end: Vector2, graphScale: number, mouseOver: boolean) => {

        let lineSize = connectionSize * graphScale;
        let color = connectionColor;
        if (mouseOver) {
            lineSize = mouseOverSize * graphScale;
            color = mouseOverColor;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = lineSize;

        // Draw
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        const midX = (start.x + end.x) / 2;
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
        private inNode: FlowNode | null,
        private inNodePortIndex: number,
        private outNode: FlowNode | null,
        private outNodePortIndex: number,
        private renderer: ConnectionRenderer,
    ) {
        this.inPos = { x: 0, y: 0 };
        this.outPos = { x: 0, y: 0 };
    }

    render(ctx: CanvasRenderingContext2D, graphScale: number, mouseOver: boolean, mousePosition: Vector2 | undefined): void {

        // Not sure what to do here? Maybe we should throw an error in the 
        // future?
        if (this.inNode === null && this.outNode === null) {
            return;
        }

        if (this.inNode !== null) {
            const inPortBox = this.inNode.inputPortPosition(this.inNodePortIndex)
            if (inPortBox === undefined) {
                return;
            }
            BoxCenter(inPortBox, this.inPos);
        } else if (mousePosition !== undefined) {
            this.inPos.x = mousePosition.x;
            this.inPos.y = mousePosition.y;
        } else {
            return;
        }

        if (this.outNode !== null) {
            const outPortBox = this.outNode.outputPortPosition(this.outNodePortIndex);
            if (outPortBox === undefined) {
                return;
            }
            BoxCenter(outPortBox, this.outPos);
        } else if (mousePosition !== undefined) {
            this.outPos.x = mousePosition.x;
            this.outPos.y = mousePosition.y;
        } else {
            return;
        }

        this.renderer(ctx, this.inPos, this.outPos, graphScale, mouseOver);
    }

    clearPort(mousePosition: Vector2): void {
        if (this.inNode !== null) {
            const inPortBox = this.inNode.inputPortPosition(this.inNodePortIndex)
            if (inPortBox !== undefined && InBox(inPortBox, mousePosition)) {
                this.inNode = null;
                this.inNodePortIndex = -1;
            }
        }

        if (this.outNode !== null) {
            const outPortBox = this.outNode.outputPortPosition(this.outNodePortIndex);
            if (outPortBox !== undefined && InBox(outPortBox, mousePosition)) {
                this.outNode = null;
                this.outNodePortIndex = -1;
            }
        }
    }

    setInput(node: FlowNode, portIndex: number): void {
        this.inNode = node;
        this.inNodePortIndex = portIndex;
    }

    mouseOverPort(mousePosition: Vector2): Port | null {
        if (this.inNode !== null) {
            const inPortBox = this.inNode.inputPortPosition(this.inNodePortIndex)
            if (inPortBox !== undefined && InBox(inPortBox, mousePosition)) {
                return this.inNode.inputPort(this.inNodePortIndex)
            }
        }

        if (this.outNode !== null) {
            const outPortBox = this.outNode.outputPortPosition(this.outNodePortIndex);
            if (outPortBox !== undefined && InBox(outPortBox, mousePosition)) {
                return this.outNode.outputPort(this.outNodePortIndex)
            }
        }

        return null;
    }

    outPort(): Port | null {
        if (this.outNode === null) {
            return null;
        }
        return this.outNode[this.outNodePortIndex];
    }

    inPort(): Port | null {
        if (this.inNode === null) {
            return null;
        }
        return this.inNode[this.inNodePortIndex];
    }
}