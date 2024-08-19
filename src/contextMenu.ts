import { TextStyle, TextStyleConfig } from './textStyle';
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
    }

    getName(): string {
        return this.name;
    }

    public render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): void {
        const height = scale * 30;
        const width = scale * 100;

        var entries = new Array<ContextEntry>();
        for (let i = 0; i < this.items.length; i++) {
            entries.push({
                text: this.items[i].getName(),
            });
        }

        for (let i = 0; i < this.subMenus.length; i++) {
            this.subMenus[i].render(ctx, { x: position.x + width, y: position.y + (height * entries.length) }, scale, mousePosition)
            entries.push({
                text: this.subMenus[i].getName(),
            });
        }


        ctx.textAlign = "center";

        for (let i = 0; i < entries.length; i++) {
            const startY = position.y + (height * i);

            ctx.fillStyle = "#CCCCCC";
            ctx.beginPath();
            ctx.rect(
                position.x,
                startY,
                width,
                height,
            );
            ctx.fill();

            this.textStyle.setupStyle(ctx, scale);
            ctx.fillText(entries[i].text, position.x + (width / 2), startY + (height / 2))
        }
    }

}