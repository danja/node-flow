import { Default } from "../default";
import { Popup } from "../popup";
import { TextBoxStyle, TextBoxStyleConfig, TextBoxStyleWithFallback } from "../styles/textBox";
import { Box } from "../types/box";
import { Vector2 } from "../types/vector2";
import { fitString } from "../utils/string";
import { height, width } from "./widget";

export interface StringWidgetConfig {
    value?: string;

    textBoxStyle?: TextBoxStyleConfig;

    callback?: (newString: string) => void;
}

export class StringWidget {

    #value: string;

    #textBoxStyle: TextBoxStyle

    #callback?: (newString: string) => void;

    constructor(config?: StringWidgetConfig) {
        this.#value = config?.value === undefined ? "" : config?.value;
        this.#textBoxStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.textBoxStyle, {
            box: { color: Default.Node.Widget.BackgroundColor, },
            text: { color: Default.Node.Widget.FontColor },
        }));
        this.#callback = config?.callback;
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(value: string): void {
        this.#value = value;
        if (this.#callback !== undefined) {
            this.#callback(this.#value);
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
                input.value = this.#value;
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
        const box = {
            Position: position,
            Size: {
                x: width * scale,
                y: height * scale
            }
        };

        this.#textBoxStyle.Draw(ctx, box, scale, fitString(ctx, this.#value, box.Size.x - (20 * scale)))

        return box;
    }
}