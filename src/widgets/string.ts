import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box, Vector2 } from "../types";
import { fitString } from "../utils/string";
import { borderRadius, height, width } from "./widget";

export interface StringWidgetConfig {
    value?: string;

    textStyle?: TextStyleConfig;
}

export class StringWidget {

    value: string;

    textStyle: TextStyle

    constructor(config?: StringWidgetConfig) {
        this.value = config?.value === undefined ? "" : config?.value;
        this.textStyle = new TextStyle(config?.textStyle);
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
            fitString(ctx, this.value, scaledWidth- (20*scale)),
            position.x + (scaledWidth / 2),
            position.y + (scaledHeight / 2),
            scaledWidth- (20*scale)
        );
        

        return {
            Position: position,
            Size: {
                x: scaledWidth,
                y: scaledHeight
            }
        }
    }
}