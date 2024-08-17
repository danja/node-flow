import { HexToColor, RgbToHex } from "../utils/color";
import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box, Vector2 } from "../types";
import { borderRadius, height, width } from "./widget";

export interface ColorWidgetConfig {
    value?: string;

    textStyle?: TextStyleConfig;
}

function contrastColor(color: string): string {
    const c = HexToColor(color);
    if (c === null) {
        return "black";
    }

    if ((c.r + c.g + c.b) / 3 > 128) {
        return "black"
    }

    return "white";
}

export class ColorWidget {

    value: string;

    contrast: string

    textStyle: TextStyle

    constructor(config?: ColorWidgetConfig) {
        this.value = config?.value === undefined ? "#000000" : config?.value;
        this.contrast = contrastColor(this.value);
        this.textStyle = new TextStyle(config?.textStyle);
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        ctx.fillStyle = this.value;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth,
            scaledHeight,
            borderRadius * scale
        );
        ctx.fill();
        // ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        this.textStyle.setupStyle(ctx, scale);
        ctx.fillStyle = this.contrast;
        ctx.fillText(
            this.value,
            position.x + (scaledWidth / 2),
            position.y + (scaledHeight / 2),
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