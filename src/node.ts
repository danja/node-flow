import { Port, PortConfig } from "./port";
import { FontWeight, TextStyle, TextStyleConfig, TextStyleFallback } from "./styles/text";
import { Box, InBox } from "./types/box";
import { CopyVector2, Vector2 } from "./types/vector2";
import { Widget } from './widgets/widget';
import { List } from './types/list';
import { BoxStyle, BoxStyleConfig, BoxStyleWithFallback } from "./styles/box";
import { Text } from "./types/text";
import { GlobalWidgetFactory } from "./widgets/factory";

export interface WidgetConfig {
    type?: string,
    config?: any
}

export interface FlowNodeConfiguration {
    position?: Vector2;
    title?: string;
    locked?: boolean;

    // Ports
    inputs?: Array<PortConfig>;
    outputs?: Array<PortConfig>;

    // Callbacks
    onSelect?: () => void;

    // Widgets
    widgets?: Array<WidgetConfig>;

    // Styling
    idleBorder?: BoxStyleConfig;
    mouseOverBorder?: BoxStyleConfig;
    selectedBorder?: BoxStyleConfig;
    titleTextStyle?: TextStyleConfig;
    portTextStyle?: TextStyleConfig;
    padding?: number;
}

export enum NodeState {
    Idle,
    MouseOver,
    Selected,
}

export interface NodeIntersection {
    Node?: FlowNode

    // Port
    Port?: Port
    PortIndex?: number
    PortIsInput?: boolean

    // Widget
    Widget?: Widget
    WidgetIndex?: number

}

export class FlowNode {

    private position: Vector2;

    private title: Text;

    private input: Array<Port>;

    private output: Array<Port>;

    private widgets: Array<Widget>;

    private locked: boolean;

    // Styling ================================================================

    private boxStyle: Map<NodeState, BoxStyle>;

    private padding: number;

    private portTextStyle: TextStyle;

    private elementSpacing: number;

    private inputPortPositions: List<Box>;
    private outputPortPositions: List<Box>;
    private widgetPositions: List<Box>;

    constructor(config?: FlowNodeConfiguration) {
        this.input = new Array<Port>();
        this.output = new Array<Port>();
        this.widgets = new Array<Widget>();
        this.inputPortPositions = new List<Box>();
        this.outputPortPositions = new List<Box>();
        this.widgetPositions = new List<Box>();
        this.elementSpacing = 10;
        this.locked = config?.locked === undefined ? false : config.locked;

        this.position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.title = new Text(
            config?.title === undefined ? "" : config.title,
            TextStyleFallback(config?.titleTextStyle, {
                size: 16,
                weight: FontWeight.Bold
            })
        );

        this.padding = config?.padding === undefined ? 15 : config.padding;

        this.boxStyle = new Map<NodeState, BoxStyle>();
        this.boxStyle.set(NodeState.Idle, new BoxStyle(BoxStyleWithFallback(config?.idleBorder, {
            border: { color: "#1c1c1c", size: 1, },
            color: "#999999",
        })));
        this.boxStyle.set(NodeState.MouseOver, new BoxStyle(BoxStyleWithFallback(config?.mouseOverBorder, {
            border: { color: "#6e6e6e", size: 1.1, },
            color: "#999999",
        })));
        this.boxStyle.set(NodeState.Selected, new BoxStyle(BoxStyleWithFallback(config?.selectedBorder, {
            border: { color: "white", size: 1, },
            color: "#999999",
        })));

        this.portTextStyle = new TextStyle({
            size: config?.portTextStyle?.size === undefined ? 14 : config?.portTextStyle?.size,
            color: config?.portTextStyle?.color === undefined ? "black" : config?.portTextStyle?.color,
            font: config?.titleTextStyle?.font,
            weight: config?.titleTextStyle?.weight,
        });

        if (config?.inputs !== undefined) {
            for (let i = 0; i < config.inputs.length; i++) {
                this.addInput(config.inputs[i]);
            }
        }

        if (config?.outputs !== undefined) {
            for (let i = 0; i < config.outputs.length; i++) {
                this.addOutput(config.outputs[i]);
            }
        }

        if (config?.widgets !== undefined) {
            for (let i = 0; i < config.widgets.length; i++) {
                const widget = config.widgets[i];
                if (widget.type === undefined) {
                    continue;
                }
                this.addWidget(GlobalWidgetFactory.create(widget.type, widget.config))
            }
        }
    }

    public isLocked(): boolean {
        return this.locked;
    }

    public lock(): void {
        this.locked = true;
    }

    public unlock(): void {
        this.locked = false;
    }

    public setPosition(position: Vector2): void {
        CopyVector2(this.position, position);
    }

    // private measureTitleText(ctx: CanvasRenderingContext2D, scale: number): Vector2 {
    //     return this.titleTextStyle.measure(ctx, scale, this.title);
    // }

    public calculateBounds(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number): Box {
        const scaledPadding = this.padding;
        const position: Vector2 = {
            x: (this.position.x * scale) + graphPosition.x,
            y: (this.position.y * scale) + graphPosition.y
        }

        const scaledTitleMeasurement = { x: 0, y: 0 };
        this.title.getSize(ctx, 1, scaledTitleMeasurement);

        const size = {
            x: scaledTitleMeasurement.x + (scaledPadding * 2),
            y: scaledTitleMeasurement.y + (scaledPadding * 2),
        }

        size.y += (this.elementSpacing * this.input.length);

        for (let i = 0; i < this.input.length; i++) {
            const port = this.input[i];
            const measurement = this.portTextStyle.measure(ctx, 1, port.getDisplayName());
            size.y += measurement.y;
            size.x = Math.max(size.x, measurement.x + (scaledPadding * 2))
        }

        size.y += (this.elementSpacing * this.output.length);

        for (let i = 0; i < this.output.length; i++) {
            const port = this.output[i];
            const measurement = this.portTextStyle.measure(ctx, 1, port.getDisplayName());
            size.y += measurement.y;
            size.x = Math.max(size.x, measurement.x + (scaledPadding * 2))
        }

        size.y += (this.elementSpacing * this.widgets.length);
        for (let i = 0; i < this.widgets.length; i++) {
            const element = this.widgets[i];
            const eleSize = element.Size();
            size.y += eleSize.y
            size.x = Math.max(size.x, (eleSize.x) + (scaledPadding * 2))
        }

        size.x *= scale;
        size.y *= scale;

        return {
            Position: position,
            Size: size,
        }
    }

    addInput(port: PortConfig): void {
        this.input.push(new Port(port));
    }

    addOutput(port: PortConfig): void {
        this.output.push(new Port(port));
    }

    addWidget(widget: Widget): void {
        this.widgets.push(widget);
    }

    translate(delta: Vector2): void {
        this.position.x += delta.x;
        this.position.y += delta.y;
    }

    inBounds(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, position: Vector2): NodeIntersection {
        var intersection: NodeIntersection = {
        }

        const box = this.calculateBounds(ctx, graphPosition, scale);
        if (InBox(box, position)) {
            intersection.Node = this;
        }

        for (let i = 0; i < this.inputPortPositions.Count(); i++) {
            if (InBox(this.inputPortPositions.At(i), position)) {
                intersection.Node = this;
                intersection.PortIndex = i;
                intersection.PortIsInput = true;
                intersection.Port = this.input[i]
            }
        }

        for (let i = 0; i < this.outputPortPositions.Count(); i++) {
            if (InBox(this.outputPortPositions.At(i), position)) {
                intersection.Node = this;
                intersection.PortIndex = i;
                intersection.PortIsInput = false;
                intersection.Port = this.output[i];
            }
        }

        for (let i = 0; i < this.widgetPositions.Count(); i++) {
            if (InBox(this.widgetPositions.At(i), position)) {
                intersection.Node = this;
                intersection.WidgetIndex = i;
                intersection.Widget = this.widgets[i];
            }
        }

        return intersection;
    }

    inputPortPosition(index: number): Box {
        return this.inputPortPositions.At(index);
    }

    inputPort(index: number): Port {
        return this.input[index];
    }

    outputPortPosition(index: number): Box {
        return this.outputPortPositions.At(index);
    }

    outputPort(index: number): Port {
        return this.output[index];
    }

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, state: NodeState, mousePosition: Vector2 | undefined): void {
        this.inputPortPositions.Clear();
        this.outputPortPositions.Clear();
        this.widgetPositions.Clear();
        const scaledPadding = this.padding * scale;
        const scaledElementSpacing = this.elementSpacing * scale;

        const box = this.calculateBounds(ctx, graphPosition, scale);

        // Background
        const boxStyle = this.boxStyle.get(state);
        if (boxStyle === undefined) {
            throw new Error("no registered border style for state: " + state)
        }

        boxStyle.Draw(ctx, box, scale);

        // Title
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        const titleSize = { x: 0, y: 0 };
        this.title.getSize(ctx, scale, titleSize);
        this.title.render(ctx, scale, {
            x: box.Position.x + (box.Size.x / 2),
            y: box.Position.y + scaledPadding + (titleSize.y / 2)
        });

        // Input Ports 
        let startY = box.Position.y + scaledPadding + titleSize.y + scaledElementSpacing;
        const leftSide = box.Position.x + scaledPadding;
        ctx.textAlign = "left";
        for (let i = 0; i < this.input.length; i++) {
            const port = this.input[i];
            const measurement = this.portTextStyle.measure(ctx, scale, port.getDisplayName());
            const position = { x: box.Position.x, y: startY + (measurement.y / 2) }

            // Text
            this.portTextStyle.setupStyle(ctx, scale);
            ctx.fillText(port.getDisplayName(), leftSide, position.y);

            // Port
            this.inputPortPositions.Push(port.render(ctx, position, scale));

            startY += measurement.y + scaledElementSpacing;
        }

        // Output Ports 
        const rightSide = box.Position.x + box.Size.x;
        ctx.textAlign = "right";
        for (let i = 0; i < this.output.length; i++) {
            const port = this.output[i];
            const measurement = this.portTextStyle.measure(ctx, scale, port.getDisplayName());
            const position = { x: rightSide, y: startY + (measurement.y / 2) };

            // Text
            this.portTextStyle.setupStyle(ctx, scale);
            ctx.fillText(port.getDisplayName(), rightSide - scaledPadding, position.y);

            // Port
            this.outputPortPositions.Push(port.render(ctx, position, scale));

            startY += measurement.y + scaledElementSpacing;
        }

        for (let i = 0; i < this.widgets.length; i++) {
            const widget = this.widgets[i];
            const widgetSize = widget.Size();
            const scaledWidgetWidth = widgetSize.x * scale;
            const position = {
                x: box.Position.x + ((box.Size.x - scaledWidgetWidth) / 2),
                y: startY
            };
            this.widgetPositions.Push(widget.Draw(ctx, position, scale, mousePosition));
            startY += (widgetSize.y * scale) + scaledElementSpacing;
        }
    }
}
