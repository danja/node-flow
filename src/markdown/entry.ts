import { Theme } from "../theme";
import { Text } from "../types/text";
import { CopyVector2, Vector2 } from "../types/vector2";

export interface MarkdownEntry {
    render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, maxWidth: number): number
}

export class UnorderedListMarkdownEntry {

    #entries: Array<BasicMarkdownEntry>;

    constructor(entries: Array<BasicMarkdownEntry>) {
        this.#entries = entries;
    }

    render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, maxWidth: number): number {
        let offset = 0;
        let shift = 20;

        let pos = {
            x: position.x + (shift * scale),
            y: position.y
        }

        let dot = Theme.Note.DotSize * scale;

        for (let i = 0; i < this.#entries.length; i++) {

            ctx.beginPath();
            ctx.arc(position.x + dot, pos.y - (dot * 2), dot, 0, 2 * Math.PI);
            ctx.fill();

            offset += this.#entries[i].render(ctx, pos, scale, maxWidth - shift) + (scale * Theme.Note.LineSpacing * 2);
            pos.y = position.y + offset;
        }

        return offset;
    }
}

export class BasicMarkdownEntry {

    #underline: boolean;

    #entries: Array<Text>

    constructor(lines: Array<Text>, underline: boolean) {
        this.#entries = lines;
        this.#underline = underline;
    }

    render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, maxWidth: number): number {
        const curPosition = { x: 0, y: 0 };
        CopyVector2(curPosition, position);

        let curWidth = 0;
        let texSize: Vector2 = { x: 0, y: 0 };
        for (let entryIndex = 0; entryIndex < this.#entries.length; entryIndex++) {
            const entry = this.#entries[entryIndex];

            let lines = entry.splitAtWidth(ctx, maxWidth - (curWidth / scale));
            while (lines.length > 1) {
                if (lines[0].get() !== "") {
                    lines[0].size(ctx, scale, texSize);
                    lines[0].render(ctx, scale, curPosition);
                }

                curPosition.y += texSize.y + (scale * Theme.Note.LineSpacing);

                curWidth = 0;
                curPosition.x = position.x;
                lines = lines[1].splitAtWidth(ctx, maxWidth);
            }

            lines[0].size(ctx, scale, texSize);
            lines[0].render(ctx, scale, curPosition);
            curWidth += texSize.x;
            curPosition.x += texSize.x;
        }
        curPosition.x = position.x;
        curPosition.y += texSize.y;

        // Add underline 
        if (this.#underline) {
            const y = curPosition.y - (scale * 5)
            ctx.strokeStyle = Theme.Note.FontColor;
            ctx.lineWidth = Theme.Note.HeaderLineWidth * scale;
            ctx.beginPath();
            ctx.moveTo(curPosition.x, y);
            ctx.lineTo(curPosition.x + (maxWidth * scale), y);
            ctx.stroke();
        }

        // ctx.beginPath();
        // ctx.rect(position.x, position.y, maxWidth * scale, curPosition.y - position.y)
        // ctx.stroke();

        return curPosition.y - position.y;
    }
}
