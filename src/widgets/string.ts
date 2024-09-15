import { Theme } from "../theme";
import { Popup } from "../popup";
import { TextBoxStyle, TextBoxStyleConfig, TextBoxStyleWithFallback } from "../styles/textBox";
import { Box, InBox } from "../types/box";
import { Vector2 } from "../types/vector2";
import { fitString } from "../utils/string";
import { height, width } from "./widget";
import { FlowNode } from '../node';

export interface StringWidgetConfig {
    property?: string;

    value?: string;

    textBoxStyle?: TextBoxStyleConfig;

    callback?: (newString: string) => void;
}

export class StringWidget {

    #value: string;

    #idleStyle: TextBoxStyle;

    #hoverStyle: TextBoxStyle;

    #callback?: (newString: string) => void;

    #node: FlowNode

    #nodeProperty: string | undefined;

    constructor(node: FlowNode, config?: StringWidgetConfig) {
        this.#node = node;
        this.#nodeProperty = config?.property;
        this.#idleStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.textBoxStyle, {
            box: {
                color: Theme.Widget.BackgroundColor,
                border: {
                    size: Theme.Widget.Border.Size,
                    color: Theme.Widget.Border.Color,
                },
                radius: Theme.Widget.Border.Radius
            },
            text: { color: Theme.Widget.FontColor },
        }));

        this.#hoverStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.textBoxStyle, {
            box: {
                color: Theme.Widget.Hover.BackgroundColor,
                border: {
                    size: Theme.Widget.Border.Size,
                    color: Theme.Widget.Border.Color,
                },
                radius: Theme.Widget.Border.Radius
            },
            text: { color: Theme.Widget.FontColor },
        }));

        this.Set(config?.value === undefined ? "" : config?.value);
        this.#callback = config?.callback;
        if (this.#nodeProperty !== undefined) {
            this.#node.subscribeToProperty(this.#nodeProperty, (oldVal, newVal) => {
                this.Set(newVal);
            });
        }
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Set(value: string): void {
        if (this.#value === value) {
            return;
        }
        this.#value = value;

        if (this.#nodeProperty !== undefined) {
            this.#node.setProperty(this.#nodeProperty, this.#value)
        }

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

        let style: TextBoxStyle = this.#idleStyle;

        if (mousePosition !== undefined) {
            if (InBox(box, mousePosition)) {
                style = this.#hoverStyle;
            }
        }

        style.DrawUnderline(ctx, box, scale, fitString(ctx, this.#value, box.Size.x - (20 * scale)))

        return box;
    }
}