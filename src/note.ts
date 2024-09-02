import { BuildMarkdown } from "./markdown";
import { MarkdownEntry } from "./markdown/entry";
import { TextAlign } from "./styles/canvasTextAlign";
import { TextBaseline } from "./styles/canvasTextBaseline";
import { TextStyleConfig } from "./styles/text";
import { Theme } from "./theme";
import { Vector2 } from "./types/vector2";

export interface FlowNoteConfig {
    text?: string;
    style?: TextStyleConfig;
    position?: Vector2;
    width?: number;
}

export class FlowNote {

    #originalText: string;

    #document: Array<MarkdownEntry>;

    #position: Vector2;

    #width: number;

    constructor(config?: FlowNoteConfig) {
        this.#width = config?.width === undefined ? 500 : config.width;
        this.#originalText = config?.text === undefined ? "" : config?.text;
        this.#position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.#document = BuildMarkdown(this.#originalText);
    }

    #tempPosition: Vector2 = { x: 0, y: 0 };

    #tempTextSize: Vector2 = { x: 0, y: 0 };

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        this.#tempPosition.x = (this.#position.x * scale) + graphPosition.x;
        this.#tempPosition.y = (this.#position.y * scale) + graphPosition.y;

        const lineSpacing = Theme.Note.EntrySpacing * scale;

        ctx.textAlign = TextAlign.Left;
        ctx.textBaseline = TextBaseline.Alphabetic;
        for (let i = 0; i < this.#document.length; i++) {
            const text = this.#document[i];
            this.#tempPosition.y += text.render(ctx, this.#tempPosition, scale, this.#width) + lineSpacing;
        }
    }
}