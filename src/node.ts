import { BorderStyle, BorderStyleConfig } from "./borderStyle";
import { Port, PortConfig } from "./port";
import { TextStyle, TextStyleConfig } from "./textStyle";
import { Box, InBox, Vector2 } from "./types";
import { Widget } from './widgets/widget';

export interface FlowNodeConfiguration {
    position?: Vector2;
    title?: string;

    // Callbacks
    onSelect?: () => void;

    // Styling
    idleBorder?: BorderStyleConfig;
    mouseOverBorder?: BorderStyleConfig;
    selectedBorder?: BorderStyleConfig;
    titleTextStyle?: TextStyleConfig;
    portTextStyle?: TextStyleConfig;
    padding?: number;
    fillColor?: string;
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

    private title: string;

    private input: Array<Port>;

    private output: Array<Port>;

    private widgets: Array<Widget>;

    // Styling ================================================================

    private borderStyle: Map<NodeState, BorderStyle>;

    private padding: number;

    private fillColor: string;

    private titleTextStyle: TextStyle;

    private portTextStyle: TextStyle;

    private elementSpacing: number;

    private inputPortPositions: Array<Box>;
    private outputPortPositions: Array<Box>;
    private widgetPositions: Array<Box>;

    constructor(config?: FlowNodeConfiguration) {
        this.input = new Array<Port>();
        this.output = new Array<Port>();
        this.widgets = new Array<Widget>();
        this.elementSpacing = 10;
        this.inputPortPositions = new Array<Box>();
        this.outputPortPositions = new Array<Box>();
        this.widgetPositions = new Array<Box>();

        this.position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.title = config?.title === undefined ? "" : config.title;

        this.fillColor = config?.fillColor === undefined ? "#999999" : config.fillColor;
        this.padding = config?.padding === undefined ? 15 : config.padding;

        this.borderStyle = new Map<NodeState, BorderStyle>();
        this.borderStyle.set(NodeState.Idle, new BorderStyle({
            color: config?.idleBorder?.color === undefined ? "#1c1c1c" : config?.idleBorder?.color,
            radius: config?.idleBorder?.radius === undefined ? 15 : config?.idleBorder?.radius,
            size: config?.idleBorder?.size === undefined ? 1 : config?.idleBorder?.size,
        }));
        this.borderStyle.set(NodeState.MouseOver, new BorderStyle({
            color: config?.mouseOverBorder?.color === undefined ? "#6e6e6e" : config?.mouseOverBorder?.color,
            radius: config?.mouseOverBorder?.radius === undefined ? 15 : config?.mouseOverBorder?.radius,
            size: config?.mouseOverBorder?.size === undefined ? 1.1 : config?.mouseOverBorder?.size,
        }));
        this.borderStyle.set(NodeState.Selected, new BorderStyle({
            color: config?.selectedBorder?.color === undefined ? "white" : config?.selectedBorder?.color,
            radius: config?.selectedBorder?.radius === undefined ? 15 : config?.selectedBorder?.radius,
            size: config?.selectedBorder?.size === undefined ? 1 : config?.selectedBorder?.size,
        }));


        this.titleTextStyle = new TextStyle({
            size: config?.titleTextStyle?.size === undefined ? 16 : config?.titleTextStyle?.size,
            color: config?.titleTextStyle?.color === undefined ? "black" : config?.titleTextStyle?.color,
        });

        this.portTextStyle = new TextStyle({
            size: config?.portTextStyle?.size === undefined ? 14 : config?.portTextStyle?.size,
            color: config?.portTextStyle?.color === undefined ? "black" : config?.portTextStyle?.color,
        });
    }

    private setupTitleStyle(ctx: CanvasRenderingContext2D, scale: number): void {
        this.titleTextStyle.setupStyle(ctx, scale);
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
    }

    private measureTitleText(ctx: CanvasRenderingContext2D, scale: number): Vector2 {
        return this.titleTextStyle.measure(ctx, scale, this.title);
    }

    private calculateBounds(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number): Box {
        const scaledPadding = this.padding * scale;
        const position: Vector2 = {
            x: (this.position.x * scale) + graphPosition.x,
            y: (this.position.y * scale) + graphPosition.y
        }
        const scaledTitleMeasurement = this.measureTitleText(ctx, scale);
        const size = {
            x: scaledTitleMeasurement.x + (scaledPadding * 2),
            y: scaledTitleMeasurement.y + (scaledPadding * 2),
        }

        size.y += (this.elementSpacing * this.input.length * scale);

        for (let i = 0; i < this.input.length; i++) {
            const port = this.input[i];
            const measurement = this.portTextStyle.measure(ctx, scale, port.getDisplayName());
            size.y += measurement.y;
            size.x = Math.max(size.x, measurement.x + (scaledPadding * 2))
        }

        size.y += (this.elementSpacing * this.output.length * scale);

        for (let i = 0; i < this.output.length; i++) {
            const port = this.output[i];
            const measurement = this.portTextStyle.measure(ctx, scale, port.getDisplayName());
            size.y += measurement.y;
            size.x = Math.max(size.x, measurement.x + (scaledPadding * 2))
        }

        size.y += (this.elementSpacing * this.widgets.length * scale);
        for (let i = 0; i < this.widgets.length; i++) {
            const element = this.widgets[i];
            const eleSize = element.Size();
            size.y += eleSize.y * scale
            size.x = Math.max(size.x, (eleSize.x * scale) + (scaledPadding * 2))
        }

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

        for (let i = 0; i < this.inputPortPositions.length; i++) {
            if (InBox(this.inputPortPositions[i], position)) {
                intersection.Node = this;
                intersection.PortIndex = i;
                intersection.PortIsInput = true;
                intersection.Port = this.input[i]
            }
        }

        for (let i = 0; i < this.outputPortPositions.length; i++) {
            if (InBox(this.outputPortPositions[i], position)) {
                intersection.Node = this;
                intersection.PortIndex = i;
                intersection.PortIsInput = false;
                intersection.Port = this.output[i];
            }
        }

        for (let i = 0; i < this.widgetPositions.length; i++) {
            if (InBox(this.widgetPositions[i], position)) {
                intersection.Node = this;
                intersection.WidgetIndex = i;
                intersection.Widget = this.widgets[i];
            }
        }


        return intersection;
    }

    inputPortPosition(index: number): Box {
        return this.inputPortPositions[index];
    }

    inputPort(index: number): Port {
        return this.input[index];
    }

    outputPortPosition(index: number): Box {
        return this.outputPortPositions[index];
    }

    outputPort(index: number): Port {
        return this.output[index];
    }

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, state: NodeState, mousePosition: Vector2 | undefined): void {
        this.inputPortPositions = new Array<Box>();
        this.outputPortPositions = new Array<Box>();
        this.widgetPositions = new Array<Box>();
        const scaledPadding = this.padding * scale;
        const scaledElementSpacing = this.elementSpacing * scale;

        const box = this.calculateBounds(ctx, graphPosition, scale);

        // Background
        const borderStyle = this.borderStyle.get(state);
        if (borderStyle === undefined) {
            throw new Error("no registered border style for state: " + state)
        }

        borderStyle.setupStyle(ctx, scale);
        ctx.fillStyle = this.fillColor;
        ctx.shadowColor = "black";
        ctx.shadowBlur = 15 * scale;
        ctx.beginPath();
        ctx.roundRect(
            box.Position.x,
            box.Position.y,
            box.Size.x,
            box.Size.y,
            borderStyle.getRadius(scale)
        );
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;


        ctx.textBaseline = 'middle';

        // Title
        this.setupTitleStyle(ctx, scale);
        const titleHeight = this.titleTextStyle.getSize() * scale;
        ctx.fillText(
            this.title,
            box.Position.x + (box.Size.x / 2),
            box.Position.y + scaledPadding + (titleHeight / 2)
        );

        // Input Ports 
        let startY = box.Position.y + scaledPadding + titleHeight + scaledElementSpacing;
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
            this.inputPortPositions.push(port.render(ctx, position, scale));

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
            this.outputPortPositions.push(port.render(ctx, position, scale));

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
            this.widgetPositions.push(widget.Draw(ctx, position, scale, mousePosition));
            startY += (widgetSize.y * scale) + scaledElementSpacing;
        }
    }
}
