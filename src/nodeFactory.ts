import { FlowNode } from "./node";
import { Popup } from "./popup";
import { Publisher, PublisherConfig } from "./publisher";

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

    public openMenu(): void {
        const popup = new Popup({
            title: "Create Node",
            options: []
        });

        popup.Show();
    }
} 
