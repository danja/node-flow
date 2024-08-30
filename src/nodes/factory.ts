import { FlowNode } from "../node";
import { Publisher, PublisherConfig } from "./publisher";
import { ContextMenuConfig } from "../contextMenu";
import { contextMenuGroup, NodeFlowGraph } from "../graph";
import { Vector2 } from "../types/vector2";

interface NodeFactoryPublishers {
    [name: string]: PublisherConfig
}

export interface NodeFactoryConfig {
    publishers?: NodeFactoryPublishers
}

export class NodeFactory {
    #registeredPublishers: Map<string, Publisher>

    constructor(config?: NodeFactoryConfig) {
        this.#registeredPublishers = new Map<string, Publisher>();

        if (config?.publishers !== undefined) {
            for (let entry in config.publishers) {
                this.addPublisher(entry, new Publisher(config.publishers[entry]));
            }
        }
    }

    public addPublisher(identifier: string, publisher: Publisher): void {
        this.#registeredPublishers.set(identifier, publisher);
    }

    // I'm not even sure if I want this here? You can register on Publishers...
    // So why not just make people register with the publisher.
    // public register(publisher: string, nodeType: string, config: FlowNodeConfiguration): void {
    //     const foundPublisher = this.#registeredPublishers.get(publisher);
    //     if (foundPublisher === undefined) {
    //         console.error("no publisher registered with identifier:" + publisher);
    //         return;
    //     }

    //     foundPublisher.register(nodeType, config);
    // }

    public create(publisher: string, nodeType: string): FlowNode {
        const publisherIdentifier = this.#registeredPublishers.get(publisher)
        if (publisherIdentifier === undefined) {
            throw new Error("no publisher registered with identifier: " + publisher);
        }
        return publisherIdentifier.create(nodeType);
    }

    public openMenu(graph: NodeFlowGraph, position: Vector2): ContextMenuConfig {
        const menus: Array<ContextMenuConfig> = [];
        for (let [_, publisher] of this.#registeredPublishers) {
            menus.push(publisher.contextMenu(graph, position))
        }
        return {
            name: "New Node",
            group: contextMenuGroup,
            subMenus: menus,
        };
    }
} 
