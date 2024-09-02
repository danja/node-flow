import { FontWeight, TextStyle, TextStyleConfig } from "../styles/text";
import { splitString, splitStringIntoLines } from "../utils/string";
import { CopyVector2, Vector2 } from "./vector2";

export class Text {

    #measured: boolean

    #size: Vector2;

    #style: TextStyle;

    #value: string

    #lastUpdated: number;

    constructor(value: string, style?: TextStyleConfig) {
        this.#value = value;
        this.#measured = false;
        this.#size = { x: 0, y: 0 };
        this.#style = new TextStyle(style);
        this.#lastUpdated = Date.now();
    }

    set(newValue: string): void {
        this.#value = newValue;
        this.#measured = false;
    }

    get(): string {
        return this.#value;
    }

    breakIntoLines(ctx: CanvasRenderingContext2D, maxWidth: number): Array<Text> {
        const results = new Array<Text>();

        this.#style.setupStyle(ctx, 1);
        const entries = splitStringIntoLines(ctx, this.#value, maxWidth);
        if (entries.length === 1) {
            return [this];
        }
        for (let i = 0; i < entries.length; i++) {
            const text = new Text(entries[i])
            text.#style = this.#style;
            results.push(text)
        }

        return results;
    }

    splitAtWidth(ctx: CanvasRenderingContext2D, maxWidth: number): Array<Text> {
        this.#style.setupStyle(ctx, 1);
        const entries = splitString(ctx, this.#value, maxWidth);
        if (entries.length === 1) {
            return [this];
        }

        const results = new Array<Text>();
        for (let i = 0; i < entries.length; i++) {
            const text = new Text(entries[i])
            text.#style = this.#style;
            results.push(text)
        }
        return results;
    }

    #measure(ctx: CanvasRenderingContext2D): void {
        if (this.#measured && Date.now() - this.#lastUpdated < 1000) {
            return;
        }

        this.#style.setupStyle(ctx, 1);
        const measurements = ctx.measureText(this.#value);
        this.#size.x = measurements.width;
        this.#size.y = measurements.actualBoundingBoxAscent + measurements.actualBoundingBoxDescent;
        this.#measured = true;
        this.#lastUpdated = Date.now();
    }

    size(ctx: CanvasRenderingContext2D, scale: number, out: Vector2): void {
        this.#measure(ctx);

        CopyVector2(out, this.#size);
        out.x *= scale;
        out.y *= scale;
    }

    setColor(color: string): void {
        this.#style.setColor(color);
    }

    setSize(size: number): void {
        this.#style.setSize(size);
    }

    setWeight(weight: FontWeight): void {
        this.#style.setWeight(weight);
    }

    render(ctx: CanvasRenderingContext2D, scale: number, position: Vector2): void {
        this.#style.setupStyle(ctx, scale)
        ctx.fillText(this.#value, position.x, position.y);
    }
}