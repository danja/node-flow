import { BuildMarkdown } from "./markdown";
import { TextAlign } from "./styles/canvasTextAlign";
import { TextBaseline } from "./styles/canvasTextBaseline";
import { TextStyleConfig, TextStyleFallback } from "./styles/text";
import { Theme } from "./theme";
import { Text } from "./types/text";
import { Vector2 } from "./types/vector2";

export interface FlowNoteConfig {
    text?: string;
    style?: TextStyleConfig;
    position?: Vector2;
}

export class FlowNote {

    #originalText: string;

    #document: Array<Text>;

    #position: Vector2;

    constructor(config?: FlowNoteConfig) {
        this.#originalText = config?.text === undefined ? "" : config?.text;
        this.#position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.#document = BuildMarkdown(this.#originalText);
    }

    #tempPosition: Vector2 = { x: 0, y: 0 };

    #tempTextSize: Vector2 = { x: 0, y: 0 };

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        this.#tempPosition.x = (this.#position.x * scale) + graphPosition.x;
        this.#tempPosition.y = (this.#position.y * scale) + graphPosition.y;

        const lineSpacing = 20 * scale;

        ctx.textAlign = TextAlign.Left;
        ctx.textBaseline = TextBaseline.Alphabetic;
        for (let i = 0; i < this.#document.length; i++) {
            const text = this.#document[i];
            text.size(ctx, scale, this.#tempTextSize);
            text.render(ctx, scale, this.#tempPosition);
            this.#tempPosition.y += this.#tempTextSize.y + lineSpacing;
        }
    }
}