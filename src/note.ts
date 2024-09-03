import { BuildMarkdown } from "./markdown";
import { MarkdownEntry } from "./markdown/entry";
import { Popup } from "./popup";
import { TextAlign } from "./styles/canvasTextAlign";
import { TextBaseline } from "./styles/canvasTextBaseline";
import { TextStyleConfig } from "./styles/text";
import { Theme } from "./theme";
import { Box } from "./types/box";
import { CopyVector2, Vector2 } from "./types/vector2";

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

    #lastRenderedBox: Box;

    constructor(config?: FlowNoteConfig) {
        this.#width = config?.width === undefined ? 500 : config.width;
        this.#position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.setText(config?.text === undefined ? "" : config?.text);
        this.#lastRenderedBox = { Position: { x: 0, y: 0 }, Size: { x: 0, y: 0 } };
    }

    setText(text: string): void {
        this.#originalText = text;
        this.#document = BuildMarkdown(this.#originalText);
    }

    #tempPosition: Vector2 = { x: 0, y: 0 };

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        this.#tempPosition.x = (this.#position.x * scale) + graphPosition.x;
        this.#tempPosition.y = (this.#position.y * scale) + graphPosition.y;
        CopyVector2(this.#lastRenderedBox.Position, this.#tempPosition)

        const lineSpacing = Theme.Note.EntrySpacing * scale;

        ctx.textAlign = TextAlign.Left;
        ctx.textBaseline = TextBaseline.Alphabetic;
        for (let i = 0; i < this.#document.length; i++) {
            const text = this.#document[i];
            this.#tempPosition.y += text.render(ctx, this.#tempPosition, scale, this.#width) + lineSpacing;
        }

        this.#lastRenderedBox.Size.x = scale * this.#width;
        this.#lastRenderedBox.Size.y = this.#tempPosition.y - graphPosition.y;
    }

    edit(): void {
        let input: HTMLTextAreaElement | null = null;
        let saveText = "Save";

        const popup = new Popup({
            title: "Edit Note",
            options: [saveText, "Cancel"],
            content: () => {
                const container = document.createElement('div');
                input = document.createElement('textarea')
                input.rows = 8;
                input.cols = 50;
                input.value = this.#originalText;
                container.append(input);
                return container;
            },
            onClose: (button: string | null): void => {
                if (button !== saveText || input === null) {
                    return;
                }
                this.setText(input.value);
            },
        });

        popup.Show();
    }

    bounds(): Box {
        return this.#lastRenderedBox;
    }
}