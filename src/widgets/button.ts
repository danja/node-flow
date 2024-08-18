import { TextStyle, TextStyleConfig } from "../textStyle";
import { Box, InBox } from "../types/box";
import { Vector2 } from "../types/vector2";
import { borderRadius, height, width } from "./widget";

export interface ButtonStyleConfig {
    textStyle?: TextStyleConfig;
    backgroundColor?: string;
    borderColor?: string;
}

export interface ButtonWidgetConfig {
    text?: string;
    callback?: () => void;
    idleStyle?: ButtonStyleConfig;
    hoverStyle?: ButtonStyleConfig;
    clickStyle?: ButtonStyleConfig;
}

class ButtonStyle {

    textStyle: TextStyle;

    backgroundColor: string;

    borderColor: string;

    constructor(config?: ButtonStyleConfig) {
        this.textStyle = new TextStyle(config?.textStyle);
        this.backgroundColor = config?.backgroundColor === undefined ? "#666666" : config.backgroundColor;
        this.borderColor = config?.borderColor === undefined ? "black" : config.borderColor;
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, text: string, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        ctx.fillStyle = this.backgroundColor
        ctx.strokeStyle = this.borderColor;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            width * scale,
            height * scale,
            borderRadius * scale
        );
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        this.textStyle.setupStyle(ctx, scale);

        ctx.fillText(
            text,
            position.x + (scaledWidth / 2),
            position.y + (scaledHeight / 2),
        );

        return {
            Position: position,
            Size: {
                x: scaledWidth,
                y: scaledHeight
            }
        }
    }
}

export class ButtonWidget {

    text: string;

    idleStyle: ButtonStyle;

    hoverStyle: ButtonStyle;

    clickStyle: ButtonStyle;

    callback?: () => void;

    gettingClicked: boolean;

    constructor(config?: ButtonWidgetConfig) {
        this.text = config?.text === undefined ? "Button" : config?.text;
        this.callback = config?.callback
        this.gettingClicked = false;

        this.idleStyle = new ButtonStyle(config?.idleStyle);
        this.hoverStyle = new ButtonStyle({
            backgroundColor: config?.hoverStyle?.backgroundColor === undefined ? "#888888" : config?.hoverStyle?.backgroundColor,
            borderColor: config?.hoverStyle?.borderColor,
            textStyle: config?.hoverStyle?.textStyle
        });
        this.clickStyle = new ButtonStyle({
            backgroundColor: config?.clickStyle?.backgroundColor === undefined ? "#CCCCCC" : config?.clickStyle?.backgroundColor,
            borderColor: config?.clickStyle?.borderColor,
            textStyle: config?.clickStyle?.textStyle
        });
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {

        let style: ButtonStyle = this.idleStyle;

        if (mousePosition !== undefined && !this.gettingClicked) {
            const box = {
                Position: position,
                Size: { x: width * scale, y: height * scale }
            }
            if (InBox(box, mousePosition)) {
                style = this.hoverStyle;
            }
        }

        if(this.gettingClicked) {
            style = this.clickStyle;
        }

        return style.Draw(ctx, position, scale, this.text, mousePosition);
    }

    ClickStart(): void {
        this.gettingClicked = true;
    }

    ClickEnd(): void {
        this.gettingClicked = false;
        if (this.callback !== undefined) {
            this.callback();
        }
    }
}