import { BuildMarkdown } from "../markdown/markdown";
import { MarkdownEntry } from "../markdown/entry";
import { Popup } from "../popup";
import { BoxStyle } from "../styles/box";
import { TextAlign } from "../styles/canvasTextAlign";
import { TextBaseline } from "../styles/canvasTextBaseline";
import { TextStyleConfig } from "../styles/text";
import { Theme } from "../theme";
import { Box } from "../types/box";
import { CopyVector2, Vector2 } from "../types/vector2";

export interface FlowNoteConfig {
    text?: string;
    style?: TextStyleConfig;
    position?: Vector2;
    width?: number;
}

export class FlowNote {

    #originalText: string;

    #document: Array<MarkdownEntry>;

    #width: number;

    #edittingStyle: BoxStyle;

    // Runtime ================================================================

    #position: Vector2;

    #lastMousePosition: Vector2;

    #edittingLayout: boolean;

    #lastRenderedBox: Box;

    // ========================================================================

    constructor(config?: FlowNoteConfig) {
        this.#edittingLayout = false;
        this.#width = config?.width === undefined ? 500 : config.width;
        this.#position = config?.position === undefined ? { x: 0, y: 0 } : config.position;
        this.#lastMousePosition = { x: 0, y: 0 }
        this.setText(config?.text === undefined ? "" : config?.text);
        this.#lastRenderedBox = { Position: { x: 0, y: 0 }, Size: { x: 0, y: 0 } };

        this.#edittingStyle = new BoxStyle({
            border: {
                color: "white",
                size: 1
            },
        })
    }

    setText(text: string): void {
        this.#originalText = text;
        this.#document = BuildMarkdown(this.#originalText);
    }

    translate(delta: Vector2): void {
        this.#position.x += delta.x;
        this.#position.y += delta.y;
    }

    #tempPosition: Vector2 = { x: 0, y: 0 };

    render(ctx: CanvasRenderingContext2D, graphPosition: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        if (this.#edittingLayout) {

            if (mousePosition) {
                CopyVector2(this.#lastMousePosition, mousePosition);
                this.#width = Math.max(mousePosition.x - (this.#position.x + graphPosition.x), 1)
            }

            const boxSize = 10;
            const spacing = 20;

            const smallBox: Box = {
                Position: {
                    x: this.#lastRenderedBox.Position.x - spacing - (boxSize / 2),
                    y: this.#lastRenderedBox.Position.y + (this.#lastRenderedBox.Size.y / 2) - (boxSize / 2),
                },
                Size: { x: boxSize, y: boxSize, }
            }
            this.#edittingStyle.Outline(ctx, smallBox, scale, 2);
            smallBox.Position.x += this.#lastRenderedBox.Size.x + (spacing * 2);
            this.#edittingStyle.Outline(ctx, smallBox, scale, 2);

            ctx.beginPath();
            const left = this.#lastRenderedBox.Position.x - spacing;
            const right = this.#lastRenderedBox.Position.x + spacing + this.#lastRenderedBox.Size.x;
            const bottom = this.#lastRenderedBox.Position.y - spacing;
            const top = this.#lastRenderedBox.Position.y + spacing + this.#lastRenderedBox.Size.y;
            ctx.moveTo(left, bottom + (this.#lastRenderedBox.Size.y / 2) - (boxSize));
            ctx.lineTo(left, bottom);
            ctx.lineTo(right, bottom);
            ctx.lineTo(right, bottom + (this.#lastRenderedBox.Size.y / 2) - (boxSize));

            ctx.moveTo(left, top - (this.#lastRenderedBox.Size.y / 2) + (boxSize));
            ctx.lineTo(left, top);
            ctx.lineTo(right, top);
            ctx.lineTo(right, top - (this.#lastRenderedBox.Size.y / 2) + (boxSize));
            ctx.stroke();
            // this.#edittingStyle.Outline(ctx, bigBox, scale, 2);
        }
        const startY = (this.#position.y * scale) + graphPosition.y;

        this.#tempPosition.x = (this.#position.x * scale) + graphPosition.x;
        this.#tempPosition.y = startY;
        CopyVector2(this.#lastRenderedBox.Position, this.#tempPosition)

        const lineSpacing = Theme.Note.EntrySpacing * scale;

        ctx.textAlign = TextAlign.Left;
        ctx.textBaseline = TextBaseline.Alphabetic;
        for (let i = 0; i < this.#document.length; i++) {
            const text = this.#document[i];
            this.#tempPosition.y += text.render(ctx, this.#tempPosition, scale, this.#width) + lineSpacing;
        }

        this.#lastRenderedBox.Size.x = scale * this.#width;
        this.#lastRenderedBox.Size.y = this.#tempPosition.y - startY;
    }

    editContent(): void {
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

    editLayout(): void {
        this.#edittingLayout = true;
    }

    bounds(): Box {
        return this.#lastRenderedBox;
    }
}