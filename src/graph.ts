import { Connection, ConnectionRenderer, DefaultConnectionRenderer } from "./connection";
import { ContextEntry, ContextMenu, ContextMenuConfig } from "./contextMenu";
import { FlowNode, NodeIntersection, NodeState } from "./node";
import { Port } from "./port";
import { CopyVector2, Vector2 } from './types/vector2';
import { Widget } from "./widgets/widget";

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
        undefined, // config?.color === undefined ? "#00FF00" : config.color,
        config?.mouseOverSize === undefined ? 3 : config.mouseOverSize,
        undefined, // config?.mouseOverColor === undefined ? "#00FF22" : config.mouseOverColor
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
    contextMenu?: ContextMenuConfig
}

class MouseObserver {

    private clicked: boolean;

    private lastTouch: Vector2;

    constructor(
        private ele: HTMLElement,
        private dragCallback: (delta: Vector2) => void,
        private moveCallback: (position: Vector2) => void,
        private clickStart: (position: Vector2) => void,
        private clickStop: () => void,
        private contextMenu: (position: Vector2) => void
    ) {
        this.clicked = false;
        this.lastTouch = {
            x: 0,
            y: 0
        }

        // Down
        ele.addEventListener('mousedown', this.down.bind(this), false);
        ele.addEventListener('touchstart', this.touchDown.bind(this), false);

        // Up
        ele.addEventListener('mouseup', this.up.bind(this), false);
        ele.addEventListener('touchend', this.up.bind(this), false);

        // Move
        ele.addEventListener('mousemove', this.move.bind(this), false);
        ele.addEventListener('touchmove', this.moveTouch.bind(this), false);

        // Context
        ele.addEventListener('contextmenu', (evt) => {
            contextMenu(this.mousePosition(evt));
            evt.preventDefault()
        }, false);
    }

    private mousePosition(event: MouseEvent): Vector2 {
        var rect = this.ele.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    private move(event: MouseEvent): void {
        if (this.clicked) {
            this.dragCallback({
                x: event.movementX,
                y: event.movementY,
            })
        }

        this.moveCallback(this.mousePosition(event));
    }

    private moveTouch(event: TouchEvent): void {
        const rect = this.ele.getBoundingClientRect();
        const pos = {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        }
        this.moveCallback(pos);

        if (this.clicked) {
            this.dragCallback({
                x: pos.x - this.lastTouch.x,
                y: pos.y - this.lastTouch.y,
            });
        }

        CopyVector2(this.lastTouch, pos);
    }

    private down(event: MouseEvent): void {
        this.clicked = true;
        this.clickStart(this.mousePosition(event));
    }

    private touchDown(event: TouchEvent) {
        this.clicked = true;
        const rect = this.ele.getBoundingClientRect();
        this.lastTouch.x = event.touches[0].clientX - rect.left;
        this.lastTouch.y = event.touches[0].clientY - rect.top;
        this.clickStart(this.lastTouch);
    }

    private up(): void {
        this.clicked = false
        this.clickStop();
    }
}

interface OpenContextMenu {
    Menu: ContextMenu
    Position: Vector2
}

export class NodeFlowGraph {

    private ctx: CanvasRenderingContext2D;

    private canvas: HTMLCanvasElement;

    private backgroundRenderer: GraphRenderer

    private idleConnectionRenderer: ConnectionRenderer

    private nodes: Array<FlowNode>;

    private connections: Array<Connection>;

    private contextMenu: ContextMenu;

    private position: Vector2;

    private mousePosition: Vector2 | undefined;

    private scale: number;

    private nodeHovering: number;

    private nodeSelected: number;

    private connectionSelected: Connection | null;

    private portHovering: PortIntersection | null;

    private widgetHovering: Widget | null;

    private widgetCurrentlyClicking: Widget | null;

    private openContextMenu: OpenContextMenu | null;

    private contextMenuEntryHovering: ContextEntry | null;

    constructor(canvas: HTMLCanvasElement, config?: FlowNodeGraphConfiguration) {
        this.nodes = [];
        this.scale = 1;
        this.nodeHovering = -1;
        this.nodeSelected = -1;
        this.connectionSelected = null;
        this.portHovering = null;
        this.widgetHovering = null;
        this.widgetCurrentlyClicking = null;
        this.position = { x: 0, y: 0 };
        this.connections = new Array<Connection>();
        this.idleConnectionRenderer = BuildConnectionRenderer(config?.idleConnection);
        this.contextMenu = new ContextMenu(config?.contextMenu);
        this.openContextMenu = null;
        this.contextMenuEntryHovering = null;

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
            (mousePosition: Vector2) => {
                if (this.contextMenuEntryHovering !== null) {
                    this.contextMenuEntryHovering.click();
                }
                this.openContextMenu = null;
                this.contextMenuEntryHovering = null;
                this.mousePosition = mousePosition;

                if (this.nodeHovering > -1) {
                    this.nodeSelected = this.nodeHovering;
                }

                if (this.widgetHovering !== null) {
                    this.widgetHovering.ClickStart();
                    this.widgetCurrentlyClicking = this.widgetHovering;
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

            this.clickEnd.bind(this),

            (position) => {
                this.openContextMenu = {
                    Menu: this.contextMenu,
                    Position: {
                        x: -(this.position.x / this.scale) + (position.x / this.scale),
                        y: -(this.position.y / this.scale) + (position.y / this.scale),
                    }
                };
            }
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

        if (this.widgetCurrentlyClicking !== null) {
            this.widgetCurrentlyClicking.ClickEnd();
            this.widgetCurrentlyClicking = null;
        }

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

        // Different types, can't connect
        if (this.portHovering.InputPort && this.portHovering.Port.getType() !== conn.outPort()?.getType()) {
            this.clearCurrentlySelectedConnection();
            return;
        }

        // Different types, can't connect
        if (!this.portHovering.InputPort && this.portHovering.Port.getType() !== conn.inPort()?.getType()) {
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
        } else if (this.interactingWithWidget()) {
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

    private interactingWithWidget(): boolean {
        return this.widgetCurrentlyClicking !== null;
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
        performance.mark('Render_Background_Start');
        this.backgroundRenderer(this.ctx, this.position, this.scale);
        performance.mark('Render_Background_End');
        performance.measure('Render_Background', 'Render_Background_Start', 'Render_Background_End');

        performance.mark('Render_Connections_Start');
        this.renderConnections();
        performance.mark('Render_Connections_End');
        performance.measure('Render_Connections', 'Render_Connections_Start', 'Render_Connections_End');

        performance.mark('Render_Nodes_Start');
        this.renderNodes();
        performance.mark('Render_Nodes_End');
        performance.measure('Render_Nodes', 'Render_Nodes_Start', 'Render_Nodes_End');

        performance.mark('Render_Conext_Start');
        this.renderContextMenu();
        performance.mark('Render_Context_End');
        performance.measure('Render_Conext', 'Render_Conext_Start', 'Render_Context_End');

        window.requestAnimationFrame(this.render.bind(this));
    }

    private renderContextMenu(): void {
        if (this.openContextMenu !== null) {
            this.contextMenuEntryHovering = this.openContextMenu.Menu.render(this.ctx, {
                x: this.position.x + (this.openContextMenu.Position.x * this.scale),
                y: this.position.y + (this.openContextMenu.Position.y * this.scale),
            }, this.scale, this.mousePosition);
        }
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
        this.widgetHovering = null;
        this.nodeHovering = -1;
        let cursor = 'default';

        for (let i = 0; i < this.nodes.length; i++) {
            let state = NodeState.Idle;

            if (this.mousePosition !== undefined) {
                const intersection = this.nodes[i].inBounds(this.ctx, this.position, this.scale, this.mousePosition);

                if (intersection.Node !== undefined && intersection.PortIndex === undefined && intersection.Widget === undefined) {
                    state = NodeState.MouseOver;
                    this.nodeHovering = i;
                    cursor = 'grab';
                }

                if (intersection.Widget !== undefined) {
                    this.widgetHovering = intersection.Widget
                    cursor = 'pointer';
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
                cursor = 'grabbing';
            }

            this.nodes[i].render(this.ctx, this.position, this.scale, state, this.mousePosition);
        }

        this.canvas.style.cursor = cursor;
    }

}