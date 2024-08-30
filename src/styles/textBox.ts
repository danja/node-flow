import { Box } from "../types/box";
import { BoxStyle, BoxStyleConfig, BoxStyleWithFallback } from "./box";
import { TextStyle, TextStyleConfig, TextStyleFallback } from './text';


export interface TextBoxStyleConfig {
    box?: BoxStyleConfig;
    text?: TextStyleConfig;

    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
}

export function TextBoxStyleWithFallback(input?: TextBoxStyleConfig, fallback?: TextBoxStyleConfig): TextBoxStyleConfig {
    return {
        box: BoxStyleWithFallback(input?.box, fallback?.box),
        text: TextStyleFallback(input?.text, fallback?.text),

        textAlign: input?.textAlign === undefined ? fallback?.textAlign : input?.textAlign,
        textBaseline: input?.textBaseline === undefined ? fallback?.textBaseline : input?.textBaseline,
    };
}

export class TextBoxStyle {
    #box: BoxStyle;

    #text: TextStyle;

    #textAlign: CanvasTextAlign;

    #textBaseline: CanvasTextBaseline;

    constructor(config?: TextBoxStyleConfig) {
        this.#box = new BoxStyle(config?.box);
        this.#text = new TextStyle(config?.text);

        this.#textAlign = config?.textAlign === undefined ? "center" : config.textAlign;
        this.#textBaseline = config?.textBaseline === undefined ? "middle" : config.textBaseline;
    }

    Draw(ctx: CanvasRenderingContext2D, box: Box, scale: number, text: string) {
        this.#box.Draw(ctx, box, scale);

        ctx.textAlign = this.#textAlign;
        ctx.textBaseline = this.#textBaseline;
        this.#text.setupStyle(ctx, scale);

        ctx.fillText(
            text,
            box.Position.x + (box.Size.x / 2),
            box.Position.y + (box.Size.y / 2),
        );
    }

    setTextColor(color: string): void {
        this.#text.setColor(color);
    }

    setBoxColor(color: string): void {
        this.#box.setColor(color);
    }

    setBorderColor(color: string): void {
        this.#box.setBorderColor(color);
    }
}