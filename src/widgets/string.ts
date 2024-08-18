import { Popup } from "../popup";
import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box } from "../types/box";
import { Vector2 } from "../types/vector2";
import { fitString } from "../utils/string";
import { borderRadius, height, width } from "./widget";

export interface StringWidgetConfig {
    value?: string;

    textStyle?: TextStyleConfig;

    callback?: (newString: string) => void;
}

export class StringWidget {

    private value: string;

    private textStyle: TextStyle

    private callback?: (newString: string) => void;

    constructor(config?: StringWidgetConfig) {
        this.value = config?.value === undefined ? "" : config?.value;
        this.textStyle = new TextStyle(config?.textStyle);
        this.callback = config?.callback;
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(value: string): void {
        this.value = value;
        if (this.callback !== undefined) {
            this.callback(this.value);
        }
    }

    ClickStart(): void {
    }

    ClickEnd(): void {
        let input: HTMLInputElement | null = null;

        const popup = new Popup({
            title: "Set String",
            options: ["Set", "Cancel"],
            content: () => {
                const container = document.createElement('div');
                input = document.createElement('input')
                input.value = this.value;
                container.append(input);
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
            fitString(ctx, this.value, scaledWidth - (20 * scale)),
            position.x + (scaledWidth / 2),
            position.y + (scaledHeight / 2),
            scaledWidth - (20 * scale)
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