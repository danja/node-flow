import { FlowNode } from "../node";
import { Popup } from "../popup";
import { Publisher, PublisherConfig } from "./publisher";
import { HtmlFromString, CssToString } from '../utils/html';
import { ContextMenuConfig } from "../contextMenu";
import { contextMenuGroup } from "../graph";

interface NodeFactoryPublishers {
    [name: string]: PublisherConfig
}

export interface NodeFactoryConfig {
    publishers?: NodeFactoryPublishers
}

export class NodeFactory {
    private registeredPublishers: Map<string, Publisher>

    constructor(config?: NodeFactoryConfig) {
        this.registeredPublishers = new Map<string, Publisher>();

        if (config?.publishers !== undefined) {
            for (let entry in config.publishers) {
                this.addPublisher(entry, new Publisher(config.publishers[entry]));
            }
        }
    }

    public addPublisher(identifier: string, publisher: Publisher): void {
        this.registeredPublishers.set(identifier, publisher);
    }

    // I'm not even sure if I want this here? You can register on Publishers...
    // So why not just make people register with the publisher.
    // public register(publisher: string, nodeType: string, config: FlowNodeConfiguration): void {
    //     const foundPublisher = this.registeredPublishers.get(publisher);
    //     if (foundPublisher === undefined) {
    //         console.error("no publisher registered with identifier:" + publisher);
    //         return;
    //     }

    //     foundPublisher.register(nodeType, config);
    // }

    public create(publisher: string, nodeType: string): FlowNode {
        const publisherIdentifier = this.registeredPublishers.get(publisher)
        if (publisherIdentifier === undefined) {
            throw new Error("no publisher registered with identifier: " + publisher);
        }
        return publisherIdentifier.create(nodeType);
    }

    public openMenu(): ContextMenuConfig {
        const menus: Array<ContextMenuConfig> = [];
        for (let [_, publisher] of this.registeredPublishers) {
            menus.push(publisher.contextMenu())
        }
        return {
            name: "New Node",
            group: contextMenuGroup,
            subMenus: menus,
        };
    }
} 
