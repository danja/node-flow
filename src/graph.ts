import { Connection, ConnectionRenderer, DefaultConnectionRenderer } from "./connection";
import { FlowNode, NodeState } from "./node";
import { Port } from "./port";
import { Box, InBox, Vector2 } from './types';


type GraphRenderer = (ctx: CanvasRenderingContext2D, position: Vector2, scale: number) => void;

export interface ConnectionRendererConfiguration {
    size?: number;
    color?: string;
    renderer?: ConnectionRenderer;
}

function BuildConnectionRenderer(config: ConnectionRendererConfiguration | undefined): ConnectionRenderer {
    if (config?.renderer !== undefined) {
        return config.renderer;
    }

    return DefaultConnectionRenderer(
        config?.size === undefined ? 2 : config.size,
        config?.color === undefined ? "#00FF00" : config.color
    );
}

export interface FlowNodeGraphConfiguration {
    backgroundRenderer?: GraphRenderer;
    backgroundColor?: string;
    idleConnection?: ConnectionRendererConfiguration
}

class MouseObserver {
    constructor(
        ele: HTMLElement,
        dragCallback: (delta: Vector2) => void,
        moveCallback: (delta: Vector2) => void,
        clickStart: () => void,
        clickStop: () => void,
    ) {

        let clicked = false;

        ele.addEventListener('mousedown', (event) => {
            clicked = true;
            clickStart();
        }, false);

        ele.addEventListener('mouseup', (event) => {
            clicked = false
            clickStop();
        }, false);

        ele.addEventListener('mousemove', (event) => {
            if (clicked) {
                dragCallback({
                    x: event.movementX,
                    y: event.movementY,
                })
            }

            var rect = ele.getBoundingClientRect();
            moveCallback({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            })
        }, false);
    }
}


export class NodeFlowGraph {

    private nodes: Array<FlowNode>;

    private connections: Array<Connection>;

    private ctx: CanvasRenderingContext2D;

    private canvas: HTMLCanvasElement;

    private backgroundRenderer: GraphRenderer

    private position: Vector2;

    private mousePosition: Vector2 | undefined;

    private scale: number;

    private mouseObserver: MouseObserver;

    private nodeHovering: number;

    private nodeSelected: number;

    private idleConnectionRenderer: ConnectionRenderer

    constructor(canvas: HTMLCanvasElement, config?: FlowNodeGraphConfiguration) {
        this.nodes = [];
        this.scale = 1;
        this.nodeHovering = -1;
        this.nodeHovering = -1;
        this.position = { x: 0, y: 0 };
        this.connections = new Array<Connection>();
        this.idleConnectionRenderer = BuildConnectionRenderer(config?.idleConnection);

        this.canvas = canvas;
        const ctx = canvas.getContext("2d")
        if (ctx === null) {
            throw new Error("could not create canvas context")
        }
        this.ctx = ctx;

        if (config?.backgroundRenderer !== undefined) {
            this.backgroundRenderer = config?.backgroundRenderer
        } else {
            const backgroundColor = config?.backgroundColor === undefined ? "#3b3b3b" : config.backgroundColor;
            this.backgroundRenderer = (context: CanvasRenderingContext2D, position: Vector2, scale: number) => {
                context.fillStyle = backgroundColor;
                context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }

        window.requestAnimationFrame(this.render.bind(this));

        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.scale += (event.deltaY / 100) * this.scale;
        }, false);

        this.mouseObserver = new MouseObserver(this.canvas,
            (delta) => {
                if (this.nodeSelected > -1) {
                    this.nodes[this.nodeSelected].translate({
                        x: delta.x * (1 / this.scale),
                        y: delta.y * (1 / this.scale)
                    });
                } else {
                    this.position.x += delta.x;
                    this.position.y += delta.y;
                }
            },
            (mousePosition) => {
                this.mousePosition = mousePosition;
            },
            () => {
                if (this.nodeHovering > -1) {
                    this.nodeSelected = this.nodeHovering;
                }
            },
            () => {
                this.nodeSelected = -1;
            }
        );
    }

    connectNodes(nodeOut: FlowNode, outPort: number, nodeIn: FlowNode, inPort) {
        this.connections.push(new Connection(
            nodeIn, inPort,
            nodeOut, outPort,
            this.idleConnectionRenderer,
        ));
    }

    addNode(node: FlowNode): void {
        this.nodes.push(node);
    }

    render(): void {
        this.backgroundRenderer(this.ctx, this.position, this.scale);
        const port = this.renderConnections();
        this.renderNodes(port !== null);

        window.requestAnimationFrame(this.render.bind(this));
    }

    private renderConnections(): Port | null {
        let port: Port | null = null;
        let connectionIndex = -1;

        if (this.mousePosition !== undefined) {
            for (let i = 0; i < this.connections.length; i++) {
                const portMousedOver = this.connections[i].mouseOverPort(this.mousePosition);
                if (portMousedOver !== null) {
                    port = portMousedOver;
                    connectionIndex = i;
                }
            }
        }

        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].render(this.ctx, this.position, this.scale, i == connectionIndex);
        }

        return port;
    }

    private mouseOverNode(node: FlowNode): boolean {
        if (this.mousePosition === undefined) {
            return false
        }
        return node.inBounds(this.ctx, this.position, this.scale, this.mousePosition);
    }

    private renderNodes(mouseAlreadyOverSomething: boolean) {
        this.nodeHovering = -1;
        for (let i = 0; i < this.nodes.length; i++) {
            let state = NodeState.Idle;

            if (!mouseAlreadyOverSomething && this.mouseOverNode(this.nodes[i])) {
                state = NodeState.MouseOver;
                this.nodeHovering = i;
            }

            if (i === this.nodeSelected) {
                state = NodeState.Selected;
            }

            this.nodes[i].render(this.ctx, this.position, this.scale, state);
        }
    }
}