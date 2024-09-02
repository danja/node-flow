import { Theme } from "../theme";
import { Text } from "../types/text";
import { CopyVector2, Vector2 } from "../types/vector2";

export class MarkdownEntry {

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
        let tempTextSize: Vector2 = { x: 0, y: 0 };
        for (let entryIndex = 0; entryIndex < this.#entries.length; entryIndex++) {
            const entry = this.#entries[entryIndex];
            


            const lines = entry.breakIntoLines(ctx, maxWidth);

            for (let i = 0; i < lines.length; i++) {
                
                lines[i].size(ctx, scale, tempTextSize);


                lines[i].render(ctx, scale, curPosition);
                curPosition.y += tempTextSize.y + (scale * 5);
            }
        }

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

        return curPosition.y - position.y;
    }
}
