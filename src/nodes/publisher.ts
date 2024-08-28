import { ContextMenuConfig, ContextMenuItemConfig } from "../contextMenu";
import { NodeFlowGraph } from "../graph";
import { FlowNode, FlowNodeConfiguration } from '../node';
import { Vector2 } from "../types/vector2";

interface PublisherNodes {
    [name: string]: FlowNodeConfiguration
}

export interface PublisherConfig {
    name?: string;
    description?: string;
    version?: string;
    nodes?: PublisherNodes
}

export class Publisher {

    private name: string;

    private description: string;

    private version: string;

    private registeredNodes: Map<string, FlowNodeConfiguration>

    constructor(config?: PublisherConfig) {
        this.name = config?.name === undefined ? "Unknown" : config.name;
        this.description = config?.description === undefined ? "" : config.description;
        this.version = config?.version === undefined ? "v0.0.0" : config.version;

        this.registeredNodes = new Map<string, FlowNodeConfiguration>();

        if (config?.nodes !== undefined) {
            for (const nodeKey in config.nodes) {
                this.register(nodeKey, config.nodes[nodeKey]);
            }
        }
    }

    nodes(): Map<string, FlowNodeConfiguration> {
        return this.registeredNodes;
    }

    register(nodeType: string, config: FlowNodeConfiguration): void {
        this.registeredNodes.set(nodeType, config);
    }

    private recurseBuildMenu(graph: NodeFlowGraph, name: string, subMenu: Map<string, FlowNodeConfiguration>, position: Vector2): ContextMenuConfig {
        const items: Array<ContextMenuItemConfig> = [];
        const subMenus = new Map<string, Map<string, FlowNodeConfiguration>>();

        for (let [key, nodeConfig] of subMenu) {
            const elements = key.split("/");
            if (elements.length === 1) {
                items.push({
                    name: key,
                    callback: () => {
                        const node = new FlowNode(nodeConfig);
                        node.setPosition(position);
                        graph.addNode(node);
                    },
                });
            } else {
                if (!subMenus.has(elements[0])) {
                    subMenus.set(elements[0], new Map<string, FlowNodeConfiguration>());
                }

                const menu = subMenus.get(elements[0]);
                elements.shift();
                menu?.set(elements.join("/"), nodeConfig)
            }
        }

        const menus: Array<ContextMenuConfig> = [];
        for (let [key, nodes] of subMenus) {
            menus.push(this.recurseBuildMenu(graph, key, nodes, position))
        }

        return {
            name: name,
            items: items,
            subMenus: menus
        }
    }

    contextMenu(graph: NodeFlowGraph, position: Vector2): ContextMenuConfig {
        return this.recurseBuildMenu(graph, this.name, this.registeredNodes, position);
    }

    create(nodeType: string): FlowNode {
        const config = this.registeredNodes.get(nodeType)
        if (config === undefined) {
            throw new Error("no builder registered for node: " + nodeType);
        }
        return new FlowNode(config);
    }
}