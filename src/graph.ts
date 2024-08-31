import { Connection, ConnectionRenderer, DefaultConnectionRenderer } from "./connection";
import { CombineContextMenus, ContextEntry, ContextMenu, ContextMenuConfig } from './contextMenu';
import { Theme } from "./theme";
import { MouseObserver } from "./input";
import { FlowNode, NodeState } from "./node";
import { NodeFactory, NodeFactoryConfig } from "./nodes/factory";
import { TimeExecution } from "./performance";
import { Port } from "./port";
import { CursorStyle } from "./styles/cursor";
import { Vector2 } from './types/vector2';
import { Widget } from "./widgets/widget";
import { Clamp01 } from "./utils/math";

export type GraphRenderer = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, position: Vector2, scale: number) => void;

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

function BuildBackgroundRenderer(backgroundColor: string): GraphRenderer {
    return (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, position: Vector2, scale: number) => {
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const alpha = Clamp01(scale - 0.3) * 255
        if (alpha <= 0) {
            return;
        }

        const spacing = 100;
        context.fillStyle = `rgba(41, 54, 57, ${alpha})`;
        for (let x = -100; x < 100; x++) {
            const xPos = (x * spacing * scale) + position.x;
            for (let y = -100; y < 100; y++) {
                const yPos = (y * spacing * scale) + position.y;
                context.beginPath();
                context.arc(xPos, yPos, 2 * scale, 0, 2 * Math.PI);
                context.fill();
            }
        }
    }
}

export const contextMenuGroup = "graph-context-menu";

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
    nodes?: NodeFactoryConfig
}

interface OpenContextMenu {
    Menu: ContextMenu
    Position: Vector2
}

export class NodeFlowGraph {

    #ctx: CanvasRenderingContext2D;

    #canvas: HTMLCanvasElement;

    #backgroundRenderer: GraphRenderer

    #idleConnectionRenderer: ConnectionRenderer

    #nodes: Array<FlowNode>;

    #connections: Array<Connection>;

    #contextMenuConfig: ContextMenuConfig;

    #position: Vector2;

    #mousePosition: Vector2 | undefined;

    #scale: number;

    #nodeHovering: number;

    #nodeGrabbed: number;

    #connectionSelected: Connection | null;

    #portHovering: PortIntersection | null;

    #widgetHovering: Widget | null;

    #widgetCurrentlyClicking: Widget | null;

    #openedContextMenu: OpenContextMenu | null;

    #contextMenuEntryHovering: ContextEntry | null;

    #nodeFactory: NodeFactory;

    constructor(canvas: HTMLCanvasElement, config?: FlowNodeGraphConfiguration) {
        this.#nodes = [];
        this.#scale = 1;

        this.#nodeHovering = -1;
        this.#nodeGrabbed = -1;

        this.#connectionSelected = null;
        this.#portHovering = null;
        this.#widgetHovering = null;
        this.#widgetCurrentlyClicking = null;
        this.#position = { x: 0, y: 0 };
        this.#connections = new Array<Connection>();
        this.#idleConnectionRenderer = BuildConnectionRenderer(config?.idleConnection);
        this.#nodeFactory = new NodeFactory(config?.nodes);

        this.#contextMenuConfig = CombineContextMenus({
            items: [
                {
                    name: "Reset View",
                    group: contextMenuGroup,
                    callback: this.#resetView.bind(this)
                }
            ],
        }, config?.contextMenu);

        this.#openedContextMenu = null;
        this.#contextMenuEntryHovering = null;

        this.#canvas = canvas;
        const ctx = canvas.getContext("2d")
        if (ctx === null) {
            throw new Error("could not create canvas context")
        }
        this.#ctx = ctx;

        if (config?.backgroundRenderer !== undefined) {
            this.#backgroundRenderer = config?.backgroundRenderer
        } else {
            const backgroundColor = config?.backgroundColor === undefined ? Theme.Graph.BackgroundColor : config.backgroundColor;
            this.#backgroundRenderer = BuildBackgroundRenderer(backgroundColor);
        }

        window.requestAnimationFrame(this.#render.bind(this));

        this.#canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.#scale += (event.deltaY / 100) * this.#scale;
        }, false);

        new MouseObserver(this.#canvas,
            this.#mouseDragEvent.bind(this),

            // Mouse move event
            (mousePosition) => {
                this.#mousePosition = mousePosition;
            },

            this.#clickStart.bind(this),
            this.#clickEnd.bind(this),
            this.#openContextMenu.bind(this)
        );
    }

    #clickStart(mousePosition: Vector2): void {
        if (this.#contextMenuEntryHovering !== null) {
            this.#contextMenuEntryHovering.click();
        }
        this.#openedContextMenu = null;
        this.#contextMenuEntryHovering = null;
        this.#mousePosition = mousePosition;

        if (this.#nodeHovering > -1) {
            this.#nodeGrabbed = this.#nodeHovering;
            this.#nodes[this.#nodeHovering].select();
        } else {
            this.#unselectAllNodes();
        }

        if (this.#widgetHovering !== null) {
            this.#widgetHovering.ClickStart();
            this.#widgetCurrentlyClicking = this.#widgetHovering;
        }

        if (this.#portHovering === null) {
            return
        }

        if (this.#portHovering.InputPort) {
            for (let i = 0; i < this.#connections.length; i++) {
                if (this.#connections[i].inPort() === this.#portHovering.Port) {
                    this.#connections[i].clearInput();
                    this.#connectionSelected = this.#connections[i];
                }
            }
        } else {
            let inNode: FlowNode | null = this.#portHovering.Node
            let inNodeIndex = this.#portHovering.Index
            let outNode: FlowNode | null = this.#portHovering.Node
            let outNodeIndex = this.#portHovering.Index

            if (this.#portHovering.InputPort) {
                outNode = null;
                outNodeIndex = -1;
            } else {
                inNode = null;
                inNodeIndex = -1;
            }

            const connection = new Connection(inNode, inNodeIndex, outNode, outNodeIndex, this.#idleConnectionRenderer);
            this.#connectionSelected = connection;
            this.#connections.push(connection);
        }
    }

    #openContextMenu(position: Vector2): void {
        let finalConfig = this.#contextMenuConfig;

        if (this.#nodeHovering > -1) {
            const nodeToReview = this.#nodeHovering;
            const group = "node-flow-graph-node-menu";

            let lockOption = {
                name: "Lock Node Position",
                group: group,
                callback: () => {
                    this.#lockNode(nodeToReview);
                }
            }
            if (this.#nodes[nodeToReview].locked()) {
                lockOption = {
                    name: "Unlock Node Position",
                    group: group,
                    callback: () => {
                        this.#unlockNode(nodeToReview);
                    }
                }
            }

            finalConfig = CombineContextMenus(finalConfig, {
                items: [
                    {
                        name: "Delete Node",
                        group: group,
                        callback: () => {
                            this.#removeNodeByIndex(nodeToReview);
                        }
                    },
                    {
                        name: "Clear Node Connections",
                        group: group,
                        callback: () => {
                            this.#removeNodeConnections(nodeToReview);
                        }
                    },
                    lockOption
                ]
            })
        }

        const contextMenuPosition = {
            x: -(this.#position.x / this.#scale) + (position.x / this.#scale),
            y: -(this.#position.y / this.#scale) + (position.y / this.#scale),
        }

        finalConfig = CombineContextMenus(finalConfig, {
            subMenus: [
                this.#nodeFactory.openMenu(this, contextMenuPosition)
            ]
        })

        this.#openedContextMenu = {
            Menu: new ContextMenu(finalConfig),
            Position: contextMenuPosition,
        };
    }

    #resetView(): void {
        this.#scale = 1;
        this.#position.x = 0;
        this.#position.y = 0;
    }

    #unselectAllNodes() {
        for (let i = 0; i < this.#nodes.length; i++) {
            this.#nodes[i].unselect();
        }
    }

    // Somethings wrong here. Needs more testing
    // #fitView(): void {
    //     if (this.#nodes.length === 0) {
    //         return;
    //     }

    //     const curBox: Box = {
    //         Position: { x: 0, y: 0 },
    //         Size: { x: 0, y: 0 }
    //     };
    //     CopyBox(curBox, this.#nodes[0].calculateBounds(this.#ctx, this.#position, this.#scale));

    //     for (let i = 1; i < this.#nodes.length; i++) {
    //         ExpandBox(curBox, this.#nodes[i].calculateBounds(this.#ctx, this.#position, this.#scale));
    //     }

    //     CopyVector2(this.#position, curBox.Position);
    // }

    #clearCurrentlySelectedConnection(): void {
        if (this.#connectionSelected === null) {
            return;
        }
        this.#removeConnection(this.#connectionSelected);
        this.#connectionSelected = null;
    }

    #clickEnd(): void {
        this.#nodeGrabbed = -1;

        if (this.#widgetCurrentlyClicking !== null) {
            this.#widgetCurrentlyClicking.ClickEnd();
            this.#widgetCurrentlyClicking = null;
        }

        if (this.#connectionSelected === null) {
            return;
        }

        if (this.#portHovering === null) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        const port = this.#portHovering.Port;
        const conn = this.#connectionSelected;

        // If the port we're hovering is the one we started the connection 
        // with...
        if (port === conn.inPort() || port === conn.outPort()) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        // If the port we're hoving is input, and also we started the 
        // connection with an input, we can't do anything. We can't connect
        // input to input
        if (this.#portHovering.InputPort && conn.inPort() !== null) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        // Same with out. Can't connect output to output
        if (!this.#portHovering.InputPort && conn.outPort() !== null) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        // Different types, can't connect
        if (this.#portHovering.InputPort && this.#portHovering.Port.getType() !== conn.outPort()?.getType()) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        // Different types, can't connect
        if (!this.#portHovering.InputPort && this.#portHovering.Port.getType() !== conn.inPort()?.getType()) {
            this.#clearCurrentlySelectedConnection();
            return;
        }

        // Ight. Let's make the connection.
        if (this.#portHovering.InputPort) {
            this.clearNodeInputPortConnection(this.#portHovering.Node, this.#portHovering.Index);
            conn.setInput(this.#portHovering.Node, this.#portHovering.Index)
        } else {
            conn.setOutput(this.#portHovering.Node, this.#portHovering.Index);
        }

        this.#connectionSelected = null;
    }

    clearNodeInputPortConnection(node: FlowNode, index: number): void {
        const port = node.inputPort(index);
        for (let i = this.#connections.length - 1; i >= 0; i--) {
            if (this.#connections[i].inPort() === port) {
                this.#removeConnection(this.#connections[i]);
            }
        }
    }

    #mouseDragEvent(delta: Vector2): void {
        if (this.#interactingWithNode() && !this.#nodes[this.#nodeGrabbed].locked()) {
            this.#nodes[this.#nodeGrabbed].translate({
                x: delta.x * (1 / this.#scale),
                y: delta.y * (1 / this.#scale)
            });
        } else if (this.#interactingWithConnection()) {
            // intentionally left blank
        } else if (this.#interactingWithWidget()) {
            // intentionally left blank
        } else {
            this.#position.x += delta.x;
            this.#position.y += delta.y;
        }
    }

    #interactingWithNode(): boolean {
        return this.#nodeGrabbed > -1;
    }

    #interactingWithConnection(): boolean {
        return this.#connectionSelected !== null;
    }

    #interactingWithWidget(): boolean {
        return this.#widgetCurrentlyClicking !== null;
    }

    #removeNodeConnections(nodeIndex: number): void {
        if (nodeIndex >= this.#nodes.length || nodeIndex < 0) {
            console.error("invalid node connection");
            return;
        }
        for (let i = this.#connections.length - 1; i >= 0; i--) {
            if (this.#connections[i].referencesNode(this.#nodes[nodeIndex])) {
                this.#removeConnectionByIndex(i);
            }
        }
    }

    #lockNode(nodeIndex: number): void {
        this.#nodes[nodeIndex].lock();
    }

    #unlockNode(nodeIndex: number): void {
        this.#nodes[nodeIndex].unlock();
    }

    #removeNodeByIndex(nodeIndex: number): void {
        this.#removeNodeConnections(nodeIndex);
        this.#nodes.splice(nodeIndex, 1);
    }

    #removeConnectionByIndex(index: number): void {
        this.#connections[index].clearPorts();
        this.#connections.splice(index, 1);
    }

    #removeConnection(connection: Connection): void {
        const index = this.#connections.indexOf(connection);
        if (index > -1) {
            this.#removeConnectionByIndex(index);
        } else {
            console.error("no connection found to remove");
        }
    }

    connectNodes(nodeOut: FlowNode, outPort: number, nodeIn: FlowNode, inPort): Connection | undefined {
        if (nodeOut.outputPort(outPort).getType() !== nodeIn.inputPort(inPort).getType()) {
            console.error("can't connect nodes of different types");
            return;
        }

        const connection = new Connection(
            nodeIn, inPort,
            nodeOut, outPort,
            this.#idleConnectionRenderer,
        );
        this.#connections.push(connection);
        return connection;
    }

    addNode(node: FlowNode): void {
        this.#nodes.push(node);
    }

    #lastFrameCursor: CursorStyle;

    #cursor: CursorStyle;

    #render(): void {
        this.#cursor = CursorStyle.Default;

        TimeExecution("Render_Background", this.#renderBackground.bind(this));
        TimeExecution("Render_Connections", this.#renderConnections.bind(this));
        TimeExecution("Render_Nodes", this.#renderNodes.bind(this));
        TimeExecution("Render_Conext", this.#renderContextMenu.bind(this));

        // Only update CSS style if things have changed
        // TODO: Does this actually have any measurable performance savings?
        if (this.#lastFrameCursor !== this.#cursor) {
            this.#canvas.style.cursor = this.#cursor;
        }
        this.#lastFrameCursor = this.#cursor;

        window.requestAnimationFrame(this.#render.bind(this));
    }

    #renderBackground(): void {
        this.#backgroundRenderer(this.#canvas, this.#ctx, this.#position, this.#scale);
    }

    #renderContextMenu(): void {
        if (this.#openedContextMenu !== null) {
            this.#contextMenuEntryHovering = this.#openedContextMenu.Menu.render(this.#ctx, {
                x: this.#position.x + (this.#openedContextMenu.Position.x * this.#scale),
                y: this.#position.y + (this.#openedContextMenu.Position.y * this.#scale),
            }, this.#scale, this.#mousePosition);

            if (this.#contextMenuEntryHovering !== null) {
                this.#cursor = CursorStyle.Pointer;
            }
        }
    }

    #renderConnections(): void {
        for (let i = 0; i < this.#connections.length; i++) {
            let portMousedOver = false;
            if (this.#mousePosition !== undefined) {
                portMousedOver = this.#connections[i].mouseOverPort(this.#mousePosition) !== null;
            }
            this.#connections[i].render(this.#ctx, this.#scale, portMousedOver, this.#mousePosition);
        }
    }

    #renderNodes() {
        this.#portHovering = null;
        this.#widgetHovering = null;
        this.#nodeHovering = -1;

        for (let i = 0; i < this.#nodes.length; i++) {
            let state = NodeState.Idle;

            if (this.#mousePosition !== undefined) {
                const intersection = this.#nodes[i].inBounds(this.#ctx, this.#position, this.#scale, this.#mousePosition);

                if (intersection.Node !== undefined && intersection.PortIndex === undefined && intersection.Widget === undefined) {
                    state = NodeState.MouseOver;
                    this.#nodeHovering = i;
                    this.#cursor = CursorStyle.Grab;
                }

                if (intersection.Widget !== undefined) {
                    this.#widgetHovering = intersection.Widget
                    this.#cursor = CursorStyle.Pointer;
                }

                if (intersection.Port !== undefined && intersection.Node !== undefined && intersection.PortIndex !== undefined && intersection.PortIsInput !== undefined) {
                    this.#portHovering = {
                        Index: intersection.PortIndex,
                        Node: intersection.Node,
                        Port: intersection.Port,
                        InputPort: intersection.PortIsInput
                    };
                }
            }

            // if (i === this.#nodeSelected) {
            //     state = NodeState.Selected;
            // }

            if (i === this.#nodeGrabbed) {
                state = NodeState.Grabbed;
                this.#cursor = CursorStyle.Grabbing;
            }

            this.#nodes[i].render(this.#ctx, this.#position, this.#scale, state, this.#mousePosition);
        }
    }
}