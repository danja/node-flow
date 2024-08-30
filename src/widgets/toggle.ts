import { Default } from "../default";
import { TextStyle, TextStyleConfig, TextStyleFallback } from '../styles/text';
import { Box } from "../types/box";
import { Vector2 } from "../types/vector2";
import { borderRadius, height, width } from "./widget";

export interface ToggleStyleConfig {
    textStyle?: TextStyleConfig;
    backgroundColor?: string;
    borderColor?: string;
    lightColor?: string;
    lightBorderColor?: string;
    lightBlur?: number;
}

export interface ToggleWidgetConfig {
    value?: boolean;
    text?: string;
    callback?: () => void;
    enabledStyle?: ToggleStyleConfig;
    disabledStyle?: ToggleStyleConfig;
}

class ToggleStyle {

    private textStyle: TextStyle;

    private backgroundColor: string;

    private borderColor: string;

    private lightColor: string;

    private lightBorderColor: string;

    private lightBlur?: number;

    constructor(config?: ToggleStyleConfig) {
        this.textStyle = new TextStyle(TextStyleFallback(config?.textStyle, {
            color: Default.Node.Widget.FontColor,
        }));
        this.backgroundColor = config?.backgroundColor === undefined ? Default.Node.Widget.BackgroundColor : config.backgroundColor;
        this.lightColor = config?.lightColor === undefined ? "#222222" : config.lightColor;
        this.borderColor = config?.borderColor === undefined ? "black" : config.borderColor;
        this.lightBorderColor = config?.lightBorderColor === undefined ? "black" : config.lightBorderColor;
        this.lightBlur = config?.lightBlur;
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, text: string, mousePosition: Vector2 | undefined): Box {
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;

        // Background
        ctx.fillStyle = this.backgroundColor
        ctx.strokeStyle = this.borderColor;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            position.y,
            scaledWidth,
            scaledHeight,
            borderRadius * scale
        );
        ctx.fill();
        ctx.stroke();

        // Light
        const lightScale = Math.min(scaledWidth, scaledHeight);
        ctx.strokeStyle = this.lightBorderColor;
        ctx.fillStyle = this.lightColor
        ctx.beginPath();
        ctx.roundRect(
            position.x + (lightScale * .2),
            position.y + (lightScale * .2),
            lightScale * .6,
            lightScale * .6,
            borderRadius * scale
        );
        if (this.lightBlur) {
            ctx.shadowBlur = this.lightBlur * scale;
            ctx.shadowColor = this.lightColor;
        }
        ctx.fill();
        if (this.lightBlur) {
            ctx.shadowBlur = 0;
        }
        ctx.stroke();


        //  Text
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

export class ToggleWidget {

    enabled: boolean;

    text: string;

    enabledStyle: ToggleStyle;

    disabledStyle: ToggleStyle;

    callback?: (value: boolean) => void;

    constructor(config?: ToggleWidgetConfig) {
        this.text = config?.text === undefined ? "Toggle" : config?.text;
        this.enabled = config?.value === undefined ? false : config?.value;
        this.callback = config?.callback
        this.enabledStyle = new ToggleStyle({
            backgroundColor: config?.enabledStyle?.backgroundColor,
            borderColor: config?.enabledStyle?.borderColor,
            textStyle: config?.enabledStyle?.textStyle,
            lightBorderColor: config?.enabledStyle?.lightBorderColor,
            lightColor: config?.enabledStyle?.lightColor === undefined ? "#00FF00" : config?.enabledStyle?.lightColor,
            lightBlur: config?.enabledStyle?.lightBlur === undefined ? 15 : config?.enabledStyle?.lightBlur
        });
        this.disabledStyle = new ToggleStyle({
            backgroundColor: config?.disabledStyle?.backgroundColor,
            borderColor: config?.disabledStyle?.borderColor,
            textStyle: config?.disabledStyle?.textStyle,
            lightBorderColor: config?.disabledStyle?.lightBorderColor,
            lightColor: config?.disabledStyle?.lightColor === undefined ? "#004400" : config?.enabledStyle?.lightColor,
        });
    }

    Size(): Vector2 {
        return { "x": width, "y": height }
    }

    Draw(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): Box {
        let style = this.enabled ? this.enabledStyle : this.disabledStyle;
        return style.Draw(ctx, position, scale, this.text, mousePosition);
    }

    ClickStart(): void {
        this.enabled = !this.enabled;
        if (this.callback !== undefined) {
            this.callback(this.enabled);
        }
    }

    ClickEnd(): void {

    }
}