import { TextStyle, TextStyleConfig } from "../styles/text";
import { CopyVector2, Vector2 } from "./vector2";

export class Text {

    #measured: boolean

    #size: Vector2;

    #style: TextStyle;

    #value: string

    constructor(value: string, style?: TextStyleConfig) {
        this.#value = value;
        this.#measured = false;
        this.#size = { x: 0, y: 0 };
        this.#style = new TextStyle(style);
    }

    set(newValue: string): void {
        this.#value = newValue;
        this.#measured = false;
    }

    get(): string {
        return this.#value;
    }

    #measure(ctx: CanvasRenderingContext2D): void {
        if (this.#measured) {
            return;
        }

        this.#style.setupStyle(ctx, 1);
        const measurements = ctx.measureText(this.#value);
        this.#size.x = measurements.width;
        this.#size.y = measurements.actualBoundingBoxAscent + measurements.actualBoundingBoxDescent;
        this.#measured = true;
    }

    size(ctx: CanvasRenderingContext2D, scale: number, out: Vector2): void {
        if (!this.#measured) {
            this.#measure(ctx);
        }

        CopyVector2(out, this.#size);
        out.x *= scale;
        out.y *= scale;
    }

    render(ctx: CanvasRenderingContext2D, scale: number, position: Vector2): void {
        this.#style.setupStyle(ctx, scale)
        ctx.fillText(this.#value, position.x, position.y);
    }
}