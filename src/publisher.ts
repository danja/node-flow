import { FlowNode, FlowNodeConfiguration } from "./node";

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

    register(nodeType: string, config: FlowNodeConfiguration): void {
        this.registeredNodes.set(nodeType, config);
    }

    create(nodeType: string): FlowNode {
        const config = this.registeredNodes.get(nodeType)
        if (config === undefined) {
            throw new Error("no builder registered for node: " + nodeType);
        }
        return new FlowNode(config);
    }
}