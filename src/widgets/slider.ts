import { TextStyle, TextStyleConfig } from "../textStyle";
import { Vector2, Box, CopyVector2 } from '../types';
import { Clamp01 } from "../utils/math";
import { borderRadius, height, width } from "./widget";

export interface SliderWidgetConfig {
    min?: number;

    max?: number;

    value?: number;

    backgroundColor?: string;

    borderColor?: string;

    fillColor?: string;

    textStyle?: TextStyleConfig;
}

export class SliderWidget {

    // Data Variables =========================================================

    min: number;

    max: number;

    value: number;

    text: string;

    // Styling Variables ======================================================

    textStyle: TextStyle

    backgroundColor: string;

    borderColor: string;

    fillColor: string;

    // Runtime Variables ======================================================

    lastMousePosition: Vector2;

    clickStartMousePosition: Vector2;

    clicking: boolean;

    constructor(config?: SliderWidgetConfig) {
        this.value = config?.value === undefined ? 0 : config?.value;
        this.min = config?.min === undefined ? 0 : config?.min;
        this.max = config?.max === undefined ? 1 : config?.max;

        this.backgroundColor = config?.backgroundColor === undefined ? "#666666" : config?.backgroundColor;
        this.fillColor = config?.fillColor === undefined ? "#AAAAAA" : config?.fillColor;
        this.borderColor = config?.borderColor === undefined ? "black" : config?.borderColor;
        this.textStyle = new TextStyle(config?.textStyle);

        this.lastMousePosition = { x: 0, y: 0 };
        this.clickStartMousePosition = { x: 0, y: 0 };
        this.clicking = false;

        this.text = this.value.toFixed(3);
    }

    SetValue(newValue: number): void {
        this.value = newValue;
        this.text = this.value.toFixed(3);
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    ClickStart(): void {
        this.clicking = true;
        CopyVector2(this.clickStartMousePosition, this.lastMousePosition)
    }

    ClickEnd(): void {
        this.clicking = false;
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Render background
        ctx.fillStyle = this.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth,
            scaledHeight,
            borderRadius * scale
        );
        ctx.fill();

        // Render Fill
        const fill = Clamp01((this.value - this.min) / (this.max - this.min));
        ctx.fillStyle = this.fillColor;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth * fill,
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

        // Update value based on mouse position
        if (mousePosition !== undefined) {
            CopyVector2(this.lastMousePosition, mousePosition);
            if (this.clicking) {
                const min = position.x;
                const max = min + scaledWidth;
                const p = Clamp01((this.lastMousePosition.x - min) / (max - min));
                this.SetValue((p * (this.max - this.min)) + this.min);
            }
        }

        return {
            Position: position,
            Size: {
                x: scaledWidth,
                y: scaledHeight
            }
        };
    }
}