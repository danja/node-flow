import { Popup } from "../popup";
import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box } from '../types/box';
import { Vector2 } from "../types/vector2";
import { borderRadius, height, width } from "./widget";

export interface NumberWidgetConfig {
    value?: number;

    textStyle?: TextStyleConfig;

    callback?: (newNumber: number) => void;
}

export class NumberWidget {
    
    private value: number;

    private textStyle: TextStyle

    private text: string;

    private callback?: (newNumber: number) => void;

    constructor(config?: NumberWidgetConfig) {
        this.value = config?.value === undefined ? 0 : config?.value;
        this.textStyle = new TextStyle(config?.textStyle);
        this.callback = config?.callback;

        // https://stackoverflow.com/questions/5765398/whats-the-best-way-to-convert-a-number-to-a-string-in-javascript
        this.text = '' + this.value;
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(newNumber: number): void {
        this.value = newNumber;
        this.text = '' + this.value;
        if (this.callback !== undefined) {
            this.callback(this.value);
        }
    }

    ClickStart(): void {
    }

    ClickEnd(): void {
        let input: HTMLInputElement | null = null;

        const popup = new Popup({
            title: "Set Number",
            options: ["Set", "Cancel"],
            content: () => {
                const container = document.createElement('div');
                input = document.createElement('input')
                input.type = "number";
                input.valueAsNumber = this.value;
                container.append(input);
                return container;
            },
            onClose: (button: string | null): void => {
                if (button !== "Set" || input === null) {
                    return;
                }

                this.Set(input.valueAsNumber);
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