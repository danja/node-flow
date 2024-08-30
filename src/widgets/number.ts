import { Default } from "../default";
import { Popup } from "../popup";
import { TextBoxStyle, TextBoxStyleConfig, TextBoxStyleWithFallback } from "../styles/textBox";
import { Box } from '../types/box';
import { Vector2 } from "../types/vector2";
import { height, width } from "./widget";

export interface NumberWidgetConfig {
    value?: number;

    textBoxStyle?: TextBoxStyleConfig;

    callback?: (newNumber: number) => void;
}

export class NumberWidget {
    
    private value: number;

    private textBoxStyle: TextBoxStyle;

    private text: string;

    private callback?: (newNumber: number) => void;

    constructor(config?: NumberWidgetConfig) {
        this.value = config?.value === undefined ? 0 : config?.value;
        this.textBoxStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.textBoxStyle, {
            box: { color: Default.Node.Widget.BackgroundColor, },
            text: { color: Default.Node.Widget.FontColor },
        }));
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
        const box = {
            Position: position,
            Size: {
                x: width * scale,
                y: height * scale
            }
        };

        this.textBoxStyle.Draw(ctx, box, scale, this.text)

        return box;
    }
}