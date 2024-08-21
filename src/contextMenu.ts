import { TextStyle, TextStyleConfig } from './styles/text';
import { Box, InBox } from './types/box';
import { Vector2 } from './types/vector2';

export interface ContextMenuItemConfig {
    name?: string;
    callback?: () => void;
    textStyle?: TextStyleConfig;
}

export class ContextMenuItem {
    private name: string;

    private callback?: () => void;

    private textStyle: TextStyle;

    constructor(config?: ContextMenuItemConfig) {
        this.name = config?.name === undefined ? "item" : config.name;
        this.callback = config?.callback;
        this.textStyle = new TextStyle(config?.textStyle);
    }

    getName(): string {
        return this.name;
    }
}

export interface ContextMenuConfig {
    name?: string;
    subMenus?: Array<ContextMenuConfig>;
    items?: Array<ContextMenuItemConfig>;
    textStyle?: TextStyleConfig;
}

interface ContextEntry {
    text: string;
}

export class ContextMenu {

    private name: string;

    private items: Array<ContextMenuItem>;

    private subMenus: Array<ContextMenu>;

    private textStyle: TextStyle;

    private entries: Array<ContextEntry>;

    constructor(config?: ContextMenuConfig) {
        this.name = config?.name === undefined ? "menu" : config?.name;
        this.items = new Array<ContextMenuItem>();
        this.subMenus = new Array<ContextMenu>();
        this.textStyle = new TextStyle(config?.textStyle);

        if (config?.subMenus !== undefined) {
            for (let i = 0; i < config?.subMenus.length; i++) {
                this.subMenus.push(new ContextMenu(config?.subMenus[i]));
            }
        }

        if (config?.items !== undefined) {
            for (let i = 0; i < config?.items.length; i++) {
                this.items.push(new ContextMenuItem(config?.items[i]));
            }
        }

        this.calculateEntries();
    }

    private calculateEntries(): void {
        this.entries = new Array<ContextEntry>();
        for (let i = 0; i < this.items.length; i++) {
            this.entries.push({
                text: this.items[i].getName(),
            });
        }
    }

    getName(): string {
        return this.name;
    }

    private tempBox: Box = { Position: { x: 0, y: 0 }, Size: { x: 0, y: 0 } };

    public render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        const height = scale * 30;
        const width = scale * 100;

        // for (let i = 0; i < this.subMenus.length; i++) {
        //     this.subMenus[i].render(ctx, { x: position.x + width, y: position.y + (height * this.entries.length) }, scale, mousePosition)
        //     this.entries.push({
        //         text: this.subMenus[i].getName(),
        //     });
        // }

        this.tempBox.Size.x = width;
        this.tempBox.Size.y = height;
        this.tempBox.Position.x = position.x;

        ctx.textAlign = "center";

        for (let i = 0; i < this.entries.length; i++) {
            this.tempBox.Position.y = position.y + (height * i);

            if (mousePosition !== undefined && InBox(this.tempBox, mousePosition)) {
                ctx.fillStyle = "#AAAAFF";
            } else {
                ctx.fillStyle = "#CCCCCC";
            }
            ctx.beginPath();
            ctx.rect(
                position.x,
                this.tempBox.Position.y,
                width,
                height,
            );
            ctx.fill();

            this.textStyle.setupStyle(ctx, scale);
            ctx.fillText(this.entries[i].text, position.x + (width / 2), this.tempBox.Position.y + (height / 2))
        }
    }

}