import { Connection, ConnectionRenderer, DefaultConnectionRenderer } from "./connection";
import { FlowNode, NodeIntersection, NodeState } from "./node";
import { Port } from "./port";
import { Vector2 } from './types';

export type GraphRenderer = (ctx: CanvasRenderingContext2D, position: Vector2, scale: number) => void;

export interface ConnectionRendererConfiguration {
    size?: number;
    color?: string;

    mouseOverSize?: number;
    mouseOverColor?: string;

    renderer?: ConnectionRenderer;
}

function BuildConnectionRenderer(config: ConnectionRendererConfiguration | undefined): ConnectionRenderer {
    if (config?.renderer !== undefined) {
        return config.renderer;
    }

    return DefaultConnectionRenderer(
        config?.size === undefined ? 2 : config.size,
        config?.color === undefined ? "#00FF00" : config.color,
        config?.mouseOverSize === undefined ? 3 : config.mouseOverSize,
        config?.mouseOverColor === undefined ? "#00FF22" : config.mouseOverColor
    );
}

interface PortIntersection {
    Node: FlowNode;
    Port: Port;
    Index: number;
    InputPort: boolean;
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
        moveCallback: (position: Vector2) => void,
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

    private ctx: CanvasRenderingContext2D;

    private canvas: HTMLCanvasElement;

    private backgroundRenderer: GraphRenderer

    private idleConnectionRenderer: ConnectionRenderer

    private nodes: Array<FlowNode>;

    private connections: Array<Connection>;

    private position: Vector2;

    private mousePosition: Vector2 | undefined;

    private scale: number;

    private nodeHovering: number;

    private nodeSelected: number;

    private connectionSelected: Connection | null;

    private portHovering: PortIntersection | null;

    constructor(canvas: HTMLCanvasElement, config?: FlowNodeGraphConfiguration) {
        this.nodes = [];
        this.scale = 1;
        this.nodeHovering = -1;
        this.nodeSelected = -1;
        this.connectionSelected = null;
        this.portHovering = null;
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

        new MouseObserver(this.canvas,

            // Mouse dragging something event
            this.mouseDragEvent.bind(this),

            // Mouse move event
            (mousePosition) => {
                this.mousePosition = mousePosition;
            },

            // Click start
            () => {
                if (this.nodeHovering > -1) {
                    this.nodeSelected = this.nodeHovering;
                }

                if (this.portHovering === null) {
                    return
                }

                if (this.portHovering.InputPort) {
                    for (let i = 0; i < this.connections.length; i++) {
                        if (this.connections[i].inPort() === this.portHovering.Port) {
                            this.connections[i].clearInput();
                            this.connectionSelected = this.connections[i];
                        }
                    }
                } else {
                    let inNode: FlowNode | null = this.portHovering.Node
                    let inNodeIndex = this.portHovering.Index
                    let outNode: FlowNode | null = this.portHovering.Node
                    let outNodeIndex = this.portHovering.Index

                    if (this.portHovering.InputPort) {
                        outNode = null;
                        outNodeIndex = -1;
                    } else {
                        inNode = null;
                        inNodeIndex = -1;
                    }

                    const connection = new Connection(inNode, inNodeIndex, outNode, outNodeIndex, this.idleConnectionRenderer);
                    this.connectionSelected = connection;
                    this.connections.push(connection);
                }
            },

            this.clickEnd.bind(this)
        );
    }

    private clearCurrentlySelectedConnection(): void {
        if (this.connectionSelected === null) {
            return;
        }
        this.removeConnection(this.connectionSelected);
        this.connectionSelected = null;
    }

    private clickEnd(): void {
        this.nodeSelected = -1;

        if (this.connectionSelected === null) {
            return;
        }

        if (this.portHovering === null) {
            this.clearCurrentlySelectedConnection();
            return;
        }

        const port = this.portHovering.Port;
        const conn = this.connectionSelected;

        // If the port we're hovering is the one we started the connection 
        // with...
        if (port === conn.inPort() || port === conn.outPort()) {
            this.clearCurrentlySelectedConnection();
            return;
        }

        // If the port we're hoving is input, and also we started the 
        // connection with an input, we can't do anything. We can't connect
        // input to input
        if (this.portHovering.InputPort && conn.inPort() !== null) {
            this.clearCurrentlySelectedConnection();
            return;
        }

        // Same with out. Can't connect output to output
        if (!this.portHovering.InputPort && conn.outPort() !== null) {
            this.clearCurrentlySelectedConnection();
            return;
        }

        // Ight. Let's make the connection.
        if (this.portHovering.InputPort) {
            this.clearNodeInputPortConnection(this.portHovering.Node, this.portHovering.Index);
            conn.setInput(this.portHovering.Node, this.portHovering.Index)
        } else {
            conn.setOutput(this.portHovering.Node, this.portHovering.Index);
        }

        this.connectionSelected = null;
    }

    clearNodeInputPortConnection(node: FlowNode, index: number): void {
        const port = node.inputPort(index);
        for (let i = this.connections.length - 1; i >= 0; i--) {
            if (this.connections[i].inPort() === port) {
                this.removeConnection(this.connections[i]);
            }
        }
    }

    private mouseDragEvent(delta: Vector2): void {
        if (this.interactingWithNode()) {
            this.nodes[this.nodeSelected].translate({
                x: delta.x * (1 / this.scale),
                y: delta.y * (1 / this.scale)
            });
        } else if (this.interactingWithConnection()) {
            // intentionally left blank
        } else {
            this.position.x += delta.x;
            this.position.y += delta.y;
        }
    }

    private interactingWithNode(): boolean {
        return this.nodeSelected > -1;
    }

    private interactingWithConnection(): boolean {
        return this.connectionSelected !== null;
    }

    private removeConnection(connection: Connection) {
        connection.clearPorts();
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        } else {
            console.error("no connection found to remove");
        }
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
        this.renderConnections();
        this.renderNodes();

        window.requestAnimationFrame(this.render.bind(this));
    }

    private renderConnections(): void {
        for (let i = 0; i < this.connections.length; i++) {
            let portMousedOver = false;
            if (this.mousePosition !== undefined) {
                portMousedOver = this.connections[i].mouseOverPort(this.mousePosition) !== null;
            }
            this.connections[i].render(this.ctx, this.scale, portMousedOver, this.mousePosition);
        }
    }

    private mouseOverNode(node: FlowNode): NodeIntersection {
        if (this.mousePosition === undefined) {
            return {};
        }
        return node.inBounds(this.ctx, this.position, this.scale, this.mousePosition);
    }

    private renderNodes() {
        this.portHovering = null;
        this.nodeHovering = -1;
        for (let i = 0; i < this.nodes.length; i++) {
            let state = NodeState.Idle;

            if (this.mousePosition !== undefined) {
                const intersection = this.nodes[i].inBounds(this.ctx, this.position, this.scale, this.mousePosition);

                if (intersection.Node !== undefined && intersection.PortIndex === undefined) {
                    state = NodeState.MouseOver;
                    this.nodeHovering = i;
                }

                if (intersection.Port !== undefined && intersection.Node !== undefined && intersection.PortIndex !== undefined && intersection.PortIsInput !== undefined) {
                    this.portHovering = {
                        Index: intersection.PortIndex,
                        Node: intersection.Node,
                        Port: intersection.Port,
                        InputPort: intersection.PortIsInput
                    };
                }
            }

            if (i === this.nodeSelected) {
                state = NodeState.Selected;
            }

            this.nodes[i].render(this.ctx, this.position, this.scale, state, this.mousePosition);
        }
    }
}