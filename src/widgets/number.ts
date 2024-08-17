import { TextStyle, TextStyleConfig } from "../textStyle";
import { Vector2, Box } from '../types';
import { borderRadius, height, width } from "./widget";

export interface NumberWidgetConfig {
    value?: number;

    textStyle?: TextStyleConfig;
}

export class NumberWidget {

    value: number;

    textStyle: TextStyle

    text: string;

    constructor(config?: NumberWidgetConfig) {
        this.value = config?.value === undefined ? 0 : config?.value;
        this.textStyle = new TextStyle(config?.textStyle);

        // https://stackoverflow.com/questions/5765398/whats-the-best-way-to-convert-a-number-to-a-string-in-javascript
        this.text = '' + this.value;
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Render background
        ctx.fillStyle = "#666666";
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth,
            scaledHeight,
            borderRadius * scale
        );
        ctx.fill();

        // Render Number
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        // const size = this.textStyle.measure(ctx, scale, this.text);
        this.textStyle.setupStyle(ctx, scale);
        ctx.fillText(
            this.text,
            position.x + (scaledWidth / 2),
            position.y + (scaledHeight / 2),
        );

        return {
            Position: position,
            Size: {
                x: scaledWidth,
                y: scaledHeight
            }
        };
    }
}