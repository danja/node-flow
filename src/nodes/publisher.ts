import { ContextMenuConfig, ContextMenuItemConfig } from "../contextMenu";
import { FlowNode, FlowNodeConfiguration } from '../node';

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

    recurseBuildMenu(name: string, subMenu: Map<string, FlowNodeConfiguration>): ContextMenuConfig {
        const items: Array<ContextMenuItemConfig> = [];
        const subMenus = new Map<string, Map<string, FlowNodeConfiguration>>();

        for (let [key, node] of subMenu) {
            const elements = key.split("/");
            if (elements.length === 1) {
                items.push({
                    name: key,
                    callback: () => {
                        console.log("creating: " + key)
                    },
                });
            } else {
                if (!subMenus.has(elements[0])) {
                    subMenus.set(elements[0], new Map<string, FlowNodeConfiguration>());
                }

                const menu = subMenus.get(elements[0]);
                elements.shift();
                menu?.set(elements.join("/"), node)
            }
        }

        const menus: Array<ContextMenuConfig> = [];
        for (let [key, nodes] of subMenus) {
            menus.push(this.recurseBuildMenu(key, nodes))
        }

        return {
            name: name,
            items: items,
            subMenus: menus
        }
    }

    contextMenu(): ContextMenuConfig {
        return this.recurseBuildMenu(this.name, this.registeredNodes);
    }

    create(nodeType: string): FlowNode {
        const config = this.registeredNodes.get(nodeType)
        if (config === undefined) {
            throw new Error("no builder registered for node: " + nodeType);
        }
        return new FlowNode(config);
    }
}