import { Connection, ConnectionRenderer, DefaultConnectionRenderer } from "../connection";
import { ContextMenuConfig } from "../contextMenu";
import { RenderResults } from "../graphSubsystem";
import { FlowNode, NodeState } from "../node";
import { TimeExecution } from "../performance";
import { Port } from "../port";
import { CursorStyle } from "../styles/cursor";
import { Vector2 } from "../types/vector2";
import { Widget } from "../widgets/widget";
import { NodeFactory, NodeFactoryConfig } from "./factory";

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
        config?.mouseOverSize === undefined ? 4 : config.mouseOverSize,
        undefined, // config?.mouseOverColor === undefined ? "#00FF22" : config.mouseOverColor
    );
}

interface PortIntersection {
    Node: FlowNode;
    Port: Port;
    Index: number;
    InputPort: boolean;
}

interface NodeSubsystemConfig {
    idleConnection?: ConnectionRendererConfiguration
    nodes?: NodeFactoryConfig
}

export class NodeSubsystem {

    #nodes: Array<FlowNode>;

    #connections: Array<Connection>;

    #nodeHovering: number;

    #nodeGrabbed: number;

    #connectionSelected: Connection | null;

    #idleConnectionRenderer: ConnectionRenderer

    #portHovering: PortIntersection | null;

    #widgetHovering: Widget | null;

    #widgetCurrentlyClicking: Widget | null;

    #cursor: CursorStyle;

    #nodeFactory: NodeFactory;

    constructor(config?: NodeSubsystemConfig) {
        this.#nodes = [];
        this.#nodeHovering = -1;
        this.#nodeGrabbed = -1;
        this.#connectionSelected = null;
        this.#portHovering = null;
        this.#widgetHovering = null;
        this.#widgetCurrentlyClicking = null;
        this.#connections = new Array<Connection>();
        this.#nodeFactory = new NodeFactory(config?.nodes);
        this.#idleConnectionRenderer = BuildConnectionRenderer(config?.idleConnection);
    }

    clickStart(mousePosition: Vector2, ctrlKey: boolean): boolean {
        let hoveringSomething = false;
        if (this.#nodeHovering > -1) {
            this.#nodeGrabbed = this.#nodeHovering;
            this.#selectNode(this.#nodeHovering, !ctrlKey);
            hoveringSomething = true;
        }

        if (this.#widgetHovering !== null) {
            this.#widgetHovering.ClickStart();
            this.#widgetCurrentlyClicking = this.#widgetHovering;
            hoveringSomething = true;
        }

        if (this.#portHovering === null) {
            return hoveringSomething;
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

        return true;
    }

    mouseDragEvent(delta: Vector2, scale: number): boolean {
        if (this.#interactingWithNode() && !this.#nodes[this.#nodeGrabbed].locked()) {
            this.#nodes[this.#nodeGrabbed].translate({
                x: delta.x * (1 / scale),
                y: delta.y * (1 / scale)
            });
            return true
        } else if (this.#interactingWithConnection()) {
            // intentionally left blank
            return true
        } else if (this.#interactingWithWidget()) {
            // intentionally left blank
            return true
        }
        return false
    }

    clearNodeInputConnection(node: FlowNode, index: number): void {
        const port = node.inputPort(index);
        for (let i = this.#connections.length - 1; i >= 0; i--) {
            if (this.#connections[i].inPort() === port) {
                this.#removeConnection(this.#connections[i]);
            }
        }
    }

    clickEnd(): void {
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
            this.clearNodeInputConnection(this.#portHovering.Node, this.#portHovering.Index);
            conn.setInput(this.#portHovering.Node, this.#portHovering.Index)
        } else {
            conn.setOutput(this.#portHovering.Node, this.#portHovering.Index);
        }

        this.#connectionSelected = null;
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

    getNodes(): Array<FlowNode> {
        return this.#nodes;
    }

    /**
     * Returns all nodes who are connected to the inputs of the 
     * node in question
     * 
     * @param nodeIndex index of the node to examine inputs to
     */
    connectedInputsNodeReferences(nodeIndex: number): Array<FlowNode> {
        const node = this.#nodes[nodeIndex]
        const connections = new Array<FlowNode>();
        for (let i = 0; i < this.#connections.length; i++) {
            const connection = this.#connections[i];
            if (node !== connection.inNode()) {
                continue;
            }

            const outNode = connection.outNode();
            if (outNode === null) {
                continue;
            }

            connections.push(outNode);
        }
        return connections;
    }

    connectedOutputsNodeReferences(nodeIndex: number): Array<FlowNode> {
        const node = this.#nodes[nodeIndex]
        const connections = new Array<FlowNode>();
        for (let i = 0; i < this.#connections.length; i++) {
            const connection = this.#connections[i];
            if (node !== connection.outNode()) {
                continue;
            }

            const inNode = connection.inNode();
            if (inNode === null) {
                continue;
            }

            connections.push(inNode);
        }
        return connections;
    }

    addNode(node: FlowNode): void {
        this.#nodes.push(node);
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

    #interactingWithNode(): boolean {
        return this.#nodeGrabbed > -1;
    }

    #interactingWithConnection(): boolean {
        return this.#connectionSelected !== null;
    }

    #interactingWithWidget(): boolean {
        return this.#widgetCurrentlyClicking !== null;
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

    openContextMenu(position: Vector2): ContextMenuConfig | null {

        let config: ContextMenuConfig = {
            items: [],
            subMenus: [
                this.#nodeFactory.openMenu(this, position)
            ]
        }

        if (this.#nodeHovering > -1) {
            const nodeToReview = this.#nodeHovering;
            const group = "node-flow-graph-node-menu";

            config.items?.push({
                name: "Delete Node",
                group: group,
                callback: () => {
                    this.#removeNodeByIndex(nodeToReview);
                }
            }, {
                name: "Clear Node Connections",
                group: group,
                callback: () => {
                    this.#removeNodeConnections(nodeToReview);
                }
            });

            if (this.#nodes[nodeToReview].locked()) {
                config.items?.push({
                    name: "Unlock Node Position",
                    group: group,
                    callback: () => {
                        this.#unlockNode(nodeToReview);
                    }
                });
            } else {
                config.items?.push({
                    name: "Lock Node Position",
                    group: group,
                    callback: () => {
                        this.#lockNode(nodeToReview);
                    }
                })
            }
        }

        return config;
    }

    #selectNode(nodeIndex: number, unselectOthers: boolean): void {
        for (let i = 0; i < this.#nodes.length; i++) {
            if (nodeIndex === i) {
                this.#nodes[i].select();
            } else if (unselectOthers) {
                this.#nodes[i].unselect();
            }
        }
    }

    #clearCurrentlySelectedConnection(): void {
        if (this.#connectionSelected === null) {
            return;
        }
        this.#removeConnection(this.#connectionSelected);
        this.#connectionSelected = null;
    }

    #renderConnections(ctx: CanvasRenderingContext2D, scale: number, position: Vector2, mousePosition: Vector2 | undefined): void {
        for (let i = 0; i < this.#connections.length; i++) {
            let portMousedOver = false;
            if (mousePosition !== undefined) {
                portMousedOver = this.#connections[i].mouseOverPort(mousePosition) !== null;
            }
            this.#connections[i].render(ctx, scale, portMousedOver, mousePosition);
        }
    }

    #renderNodes(ctx: CanvasRenderingContext2D, scale: number, position: Vector2, mousePosition: Vector2 | undefined) {
        this.#portHovering = null;
        this.#widgetHovering = null;
        this.#nodeHovering = -1;

        for (let i = 0; i < this.#nodes.length; i++) {
            let state = NodeState.Idle;

            if (mousePosition !== undefined) {
                const intersection = this.#nodes[i].inBounds(ctx, position, scale, mousePosition);

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

            this.#nodes[i].render(ctx, position, scale, state, mousePosition);
        }
    }

    render(ctx: CanvasRenderingContext2D, scale: number, position: Vector2, mousePosition: Vector2 | undefined): RenderResults | undefined {
        this.#cursor = CursorStyle.Default;
        TimeExecution("Render_Connections", () => {
            this.#renderConnections(ctx, scale, position, mousePosition);
        })
        TimeExecution("Render_Nodes", () => {
            this.#renderNodes(ctx, scale, position, mousePosition);
        })
        return {
            cursorStyle: this.#cursor,
        }
    }

}