import { HexToColor } from "../utils/color";
import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box } from "../types/box";
import { Vector2 } from "../types/vector2";
import { borderRadius, height, width } from "./widget";
import { Popup } from "../popup";

export interface ColorWidgetConfig {
    value?: string;

    textStyle?: TextStyleConfig;

    callback?: (newColor: string) => void;
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

    private value: string;

    private contrast: string;

    private textStyle: TextStyle;

    private callback?: (newColor: string) => void;

    constructor(config?: ColorWidgetConfig) {
        this.value = config?.value === undefined ? "#000000" : config?.value;
        this.contrast = contrastColor(this.value);
        this.textStyle = new TextStyle(config?.textStyle);
        this.callback = config?.callback;
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(value: string): void {
        this.value = value;
        this.contrast = contrastColor(this.value);
        if (this.callback !== undefined) {
            this.callback(this.value);
        }
    }
    
    ClickStart(): void {
    }

    ClickEnd(): void {
        let input: HTMLInputElement | null = null;

        const popup = new Popup({
            title: "Set Color",
            options: ["Set", "Cancel"],
            content: () => {
                const container = document.createElement('div');
                
                input = document.createElement('input')
                input.type = "color";
                input.value = this.value;
                input.name="color"
                container.append(input);

                const label = document.createElement("label");
                label.htmlFor = "color";
                label.textContent = "Color";
                container.append(label);

                return container;
            },
            onClose: (button: string | null): void => {
                if (button !== "Set" || input === null) {
                    return;
                }

                this.Set(input.value);
            },
        });

        popup.Show();
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        ctx.fillStyle = this.value;
        ctx.strokeStyle = this.contrast;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth,
            scaledHeight,
            borderRadius * scale
        );
        ctx.fill();
        ctx.stroke();

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