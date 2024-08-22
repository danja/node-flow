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
    subMenu?: ContextMenu;
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

        for (let i = 0; i < this.subMenus.length; i++) {
            this.entries.push({
                text: this.subMenus[i].getName(),
                subMenu: this.subMenus[i],
            });
        }

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

    private openSubMenu: ContextMenu | undefined;

    private submenuPosition: Vector2;

    public open(): void {
        this.openSubMenu = undefined;
        for (let i = 0; i < this.subMenus.length; i++) {
            this.subMenus[i].open();
        }
    }

    public render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): boolean {
        const height = scale * 30;
        const width = scale * 200;

        this.tempBox.Size.x = width;
        this.tempBox.Size.y = height;
        this.tempBox.Position.x = position.x;
        this.tempBox.Position.y = position.y;

        ctx.textAlign = "left";

        ctx.fillStyle = "#CCCCCC";
        ctx.beginPath();
        ctx.rect(
            position.x,
            this.tempBox.Position.y,
            width,
            height * this.entries.length,
        );
        ctx.fill();

        let mouseIsOver = false;
        let subOpenedThisFrame = false;

        for (let i = 0; i < this.entries.length; i++) {
            this.tempBox.Position.y = position.y + (height * i);

            let entryMousedOver = false;
            if (mousePosition !== undefined && InBox(this.tempBox, mousePosition)) {
                mouseIsOver = true;
                entryMousedOver = true
                if (this.entries[i].subMenu !== undefined) {
                    this.openSubMenu = this.entries[i].subMenu;
                    this.submenuPosition = { x: position.x + width, y: this.tempBox.Position.y }
                    subOpenedThisFrame = true;
                } else {
                    this.openSubMenu = undefined;
                }
            }

            if (entryMousedOver || (this.openSubMenu !== undefined && this.entries[i].subMenu === this.openSubMenu)) {
                ctx.fillStyle = "#AAAAFF";
                ctx.beginPath();
                ctx.roundRect(
                    position.x + (height / 10),
                    this.tempBox.Position.y + (height / 10),
                    width - (height / 5),
                    height - (height / 5),
                    5 * scale
                );
                ctx.fill();
            }

            this.textStyle.setupStyle(ctx, scale);
            ctx.fillText(this.entries[i].text, position.x + (height / 5), this.tempBox.Position.y + (height / 2))

            // Render arrows
            if (this.entries[i].subMenu !== undefined) {
                ctx.beginPath()
                ctx.strokeStyle = "black"
                ctx.lineWidth = 1 * scale;
                ctx.lineTo(position.x + width - (height / 3), this.tempBox.Position.y + (height / 3))
                ctx.lineTo(position.x + width - (height / 5), this.tempBox.Position.y + (height / 2))
                ctx.lineTo(position.x + width - (height / 3), this.tempBox.Position.y + height - (height / 3))
                ctx.stroke();
            }
        }

        if (this.openSubMenu !== undefined) {
            if (this.openSubMenu.render(ctx, this.submenuPosition, scale, mousePosition)) {
                mouseIsOver = true;
            } else if (!subOpenedThisFrame) {
                this.openSubMenu = undefined;
            }
        }

        return mouseIsOver;
    }
}