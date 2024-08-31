import { Theme } from "../theme";
import { Box, InBox } from "../types/box";
import { Vector2 } from "../types/vector2";
import { height, width } from "./widget";
import { TextBoxStyle, TextBoxStyleConfig, TextBoxStyleWithFallback } from "../styles/textBox";

export interface ToggleStyleConfig {
    idle?: TextBoxStyleConfig,
    hover?: TextBoxStyleConfig,
    lightColor?: string;
    lightBorderColor?: string;
    lightBlur?: number;
}

export interface ToggleWidgetConfig {
    value?: boolean;
    text?: string;
    callback?: () => void;
    enabledStyle?: ToggleStyleConfig;
    disabledStyle?: ToggleStyleConfig;
}

class ToggleStyle {

    #idleStyle: TextBoxStyle;

    #hoverStyle: TextBoxStyle;

    #lightColor: string;

    #lightBorderColor: string;

    #lightBlur?: number;

    constructor(config?: ToggleStyleConfig) {
        this.#idleStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.idle, {
            box: {
                color: Theme.Widget.BackgroundColor,
                border: {
                    size: Theme.Widget.Border.Size,
                    color: Theme.Widget.Border.Color,
                }
            },
            text: { color: Theme.Widget.FontColor },
        }));
        this.#hoverStyle = new TextBoxStyle(TextBoxStyleWithFallback(config?.hover, {
            box: {
                color: Theme.Widget.Hover.BackgroundColor,
                border: {
                    size: Theme.Widget.Border.Size,
                    color: Theme.Widget.Border.Color,
                }
            },
            text: { color: Theme.Widget.FontColor },
        }));
        this.#lightColor = config?.lightColor === undefined ? "#222222" : config.lightColor;
        this.#lightBorderColor = config?.lightBorderColor === undefined ? "black" : config.lightBorderColor;
        this.#lightBlur = config?.lightBlur;
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, text: string, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const box = { Position: position, Size: { x: scaledWidth, y: scaledHeight } };

        // Background
        let style: TextBoxStyle = this.#idleStyle;
        if (mousePosition !== undefined) {
            if (InBox(box, mousePosition)) {
                style = this.#hoverStyle;
            }
        }
        style.Draw(ctx, box, scale, text);

        // Light
        const lightScale = Math.min(scaledWidth, scaledHeight);
        ctx.strokeStyle = this.#lightBorderColor;
        ctx.fillStyle = this.#lightColor
        ctx.beginPath();
        ctx.roundRect(
            position.x + (lightScale * .2),
            position.y + (lightScale * .2),
            lightScale * .6,
            lightScale * .6,
            Theme.Widget.Border.Radius * scale
        );
        if (this.#lightBlur) {
            ctx.shadowBlur = this.#lightBlur * scale;
            ctx.shadowColor = this.#lightColor;
        }
        ctx.fill();
        if (this.#lightBlur) {
            ctx.shadowBlur = 0;
        }
        // ctx.stroke();

        return {
            Position: position,
            Size: {
                x: scaledWidth,
                y: scaledHeight
            }
        }
    }
}

export class ToggleWidget {

    #enabled: boolean;

    #text: string;

    #enabledStyle: ToggleStyle;

    #disabledStyle: ToggleStyle;

    #callback?: (value: boolean) => void;

    constructor(config?: ToggleWidgetConfig) {
        this.#text = config?.text === undefined ? "Toggle" : config?.text;
        this.#enabled = config?.value === undefined ? false : config?.value;
        this.#callback = config?.callback
        this.#enabledStyle = new ToggleStyle({
            idle: TextBoxStyleWithFallback(config?.enabledStyle?.idle, {
                box: {
                    color: Theme.Widget.BackgroundColor,
                    border: {
                        size: Theme.Widget.Border.Size,
                        color: Theme.Widget.Border.Color,
                    }
                },
                text: { color: Theme.Widget.FontColor },
            }),
            lightBorderColor: config?.enabledStyle?.lightBorderColor,
            lightColor: config?.enabledStyle?.lightColor === undefined ? "#00FF00" : config?.enabledStyle?.lightColor,
            lightBlur: config?.enabledStyle?.lightBlur === undefined ? 15 : config?.enabledStyle?.lightBlur
        });
        this.#disabledStyle = new ToggleStyle({
            idle: TextBoxStyleWithFallback(config?.disabledStyle?.idle, {
                box: {
                    color: Theme.Widget.BackgroundColor,
                    border: {
                        size: Theme.Widget.Border.Size,
                        color: Theme.Widget.Border.Color,
                    }
                },
                text: { color: Theme.Widget.FontColor },
            }),
            lightBorderColor: config?.disabledStyle?.lightBorderColor,
            lightColor: config?.disabledStyle?.lightColor === undefined ? "#004400" : config?.enabledStyle?.lightColor,
        });
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {
        let style = this.#enabled ? this.#enabledStyle : this.#disabledStyle;
        return style.Draw(ctx, position, scale, this.#text, mousePosition);
    }

    ClickStart(): void {
        this.#enabled = !this.#enabled;
        if (this.#callback !== undefined) {
            this.#callback(this.#enabled);
        }
    }

    ClickEnd(): void {

    }
}