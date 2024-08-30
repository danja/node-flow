import { HexToColor } from "../utils/color";
import { TextStyleConfig } from "../styles/text";
import { Box } from "../types/box";
import { Vector2 } from "../types/vector2";
import { height, width } from "./widget";
import { Popup } from "../popup";
import { TextBoxStyle } from '../styles/textBox';

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

    if ((c.r + c.g + c.b) / 3 > 0.5) {
        return "black"
    }

    return "white";
}

export class ColorWidget {

    #value: string;

    #contrast: string;

    #textBoxStyle: TextBoxStyle;

    #callback?: (newColor: string) => void;

    constructor(config?: ColorWidgetConfig) {
        this.#value = config?.value === undefined ? "#000000" : config?.value;
        this.#contrast = contrastColor(this.#value);
        this.#textBoxStyle = new TextBoxStyle({
            box: {
                color: this.#value,
                border: {
                    color: this.#contrast
                }
            },
            text: config?.textStyle
        });
        this.#callback = config?.callback;


        this.#textBoxStyle.setTextColor(this.#contrast);
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(value: string): void {
        this.#value = value;
        this.#contrast = contrastColor(this.#value);

        this.#textBoxStyle.setBoxColor(this.#value);
        this.#textBoxStyle.setBorderColor(this.#contrast);
        this.#textBoxStyle.setTextColor(this.#contrast);

        if (this.#callback !== undefined) {
            this.#callback(this.#value);
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
                input.value = this.#value;
                input.name = "color"
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
        const box = {
            Position: position,
            Size: {
                x: width * scale,
                y: height * scale
            }
        };

        this.#textBoxStyle.Draw(ctx, box, scale, this.#value)

        return box;
    }
}