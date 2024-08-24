import { TextStyle, TextStyleConfig } from './styles/text';
import { Box, InBox } from './types/box';
import { List } from './types/list';
import { Vector2 } from './types/vector2';

const contextEntryHeight = 30;
const contextEntryWidth = 200;

export interface ContextMenuItemConfig {
    name?: string;
    textStyle?: TextStyleConfig;
    group?: string;

    callback?: () => void;
}

export interface ContextMenuConfig {
    name?: string;
    textStyle?: TextStyleConfig;
    group?: string;

    subMenus?: Array<ContextMenuConfig>;
    items?: Array<ContextMenuItemConfig>;
}


export class ContextMenuItem {
    private name: string;

    private callback?: () => void;

    private textStyle: TextStyle;

    public group?: string;

    constructor(config?: ContextMenuItemConfig) {
        this.name = config?.name === undefined ? "item" : config.name;
        this.callback = config?.callback;
        this.textStyle = new TextStyle(config?.textStyle);
        this.group = config?.group;
    }

    getName(): string {
        return this.name;
    }

    execute(): void {
        if (this.callback === undefined) {
            return;
        }
        this.callback();
    }
}

class ContextGroup {

    private calculatedHeight: number;

    constructor(public entries: Array<ContextEntry>) {
        this.calculatedHeight = entries.length * contextEntryHeight
    }

    height() {
        return this.calculatedHeight;
    }

}

export class ContextEntry {

    constructor(public text: string, public subMenu: ContextMenu | undefined, public item: ContextMenuItem | undefined) {

    }

    click(): void {
        this.item?.execute();
    }
}

export class ContextMenu {

    private name: string;

    private items: Array<ContextMenuItem>;

    private subMenus: Array<ContextMenu>;

    private textStyle: TextStyle;

    private groups: List<ContextGroup>;

    private group?: string;

    constructor(config?: ContextMenuConfig) {
        this.groups = new List<ContextGroup>();
        this.name = config?.name === undefined ? "menu" : config?.name;
        this.items = new Array<ContextMenuItem>();
        this.subMenus = new Array<ContextMenu>();
        this.textStyle = new TextStyle(config?.textStyle);
        this.group = config?.group;

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

        const groupLUT = new Map<string, number>();
        const workingGroups = new Array<Array<ContextEntry>>();

        // Initialize first group for undefined entries
        workingGroups.push(new Array<ContextEntry>());

        for (let i = 0; i < this.items.length; i++) {
            let group = 0; // index to undefined entries

            // Find collection that this entry belongs too
            const sub = this.items[i]
            if (sub.group !== undefined) {
                const groupIndex = groupLUT.get(sub.group)
                if (groupIndex !== undefined) {
                    group = groupIndex
                } else {
                    group = workingGroups.length
                    groupLUT.set(sub.group, group)
                    workingGroups.push(new Array<ContextEntry>());
                }
            }

            workingGroups[group].push(new ContextEntry(
                this.items[i].getName(),
                undefined,
                this.items[i]
            ));
        }

        for (let i = 0; i < this.subMenus.length; i++) {
            let group = 0; // index to undefined entries

            // Find collection that this entry belongs too
            const sub = this.subMenus[i]
            if (sub.group !== undefined) {
                const groupIndex = groupLUT.get(sub.group)
                if (groupIndex !== undefined) {
                    group = groupIndex
                } else {
                    group = workingGroups.length
                    groupLUT.set(sub.group, group)
                    workingGroups.push(new Array<ContextEntry>());
                }
            }

            workingGroups[group].push(new ContextEntry(
                this.subMenus[i].getName(),
                this.subMenus[i],
                undefined
            ));
        }

        this.groups.Clear();
        for (let i = 0; i < workingGroups.length; i++) {
            const groupContent = workingGroups[i];
            if (groupContent.length === 0) {
                continue;
            }
            this.groups.Push(new ContextGroup(groupContent));
        }

    }

    getName(): string {
        return this.name;
    }

    private tempBox: Box = { Position: { x: 0, y: 0 }, Size: { x: 0, y: 0 } };

    private openSubMenu: ContextMenu | undefined;

    private submenuPosition: Vector2;

    public render(ctx: CanvasRenderingContext2D, position: Vector2, scale: number, mousePosition: Vector2 | undefined): ContextEntry | null {
        const scaledEntryHeight = scale * contextEntryHeight;
        const scaledEntryWidth = scale * contextEntryWidth;

        let totalScaledHeight = 0
        for (let i = 0; i < this.groups.Count(); i++) {
            totalScaledHeight += this.groups.At(i).height();
        }
        totalScaledHeight *= scale;

        this.tempBox.Size.x = scaledEntryWidth;
        this.tempBox.Size.y = scaledEntryHeight;
        this.tempBox.Position.x = position.x;
        this.tempBox.Position.y = position.y;

        ctx.textAlign = "left";

        ctx.fillStyle = "#CCCCCC";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 5 * scale;
        ctx.beginPath();
        ctx.roundRect(
            position.x,
            this.tempBox.Position.y,
            scaledEntryWidth,
            totalScaledHeight,
            5 * scale
        );
        ctx.fill();
        ctx.shadowBlur = 0;

        let mouseIsOver: ContextEntry | null = null;
        let subOpenedThisFrame = false;

        let optionsRendered = 0;
        for (let groupIndex = 0; groupIndex < this.groups.Count(); groupIndex++) {
            const group = this.groups.At(groupIndex);
            for (let entryIndex = 0; entryIndex < group.entries.length; entryIndex++) {
                const entry = group.entries[entryIndex];

                this.tempBox.Position.y = position.y + (scaledEntryHeight * optionsRendered);

                let entryMousedOver = false;
                if (mousePosition !== undefined && InBox(this.tempBox, mousePosition)) {
                    mouseIsOver = entry;
                    entryMousedOver = true
                    if (entry.subMenu !== undefined) {
                        this.openSubMenu = entry.subMenu;
                        this.submenuPosition = { x: position.x + scaledEntryWidth, y: this.tempBox.Position.y }
                        subOpenedThisFrame = true;
                    } else {
                        this.openSubMenu = undefined;
                    }
                }

                if (entryMousedOver || (this.openSubMenu !== undefined && entry.subMenu === this.openSubMenu)) {
                    ctx.fillStyle = "#AAAAFF";
                    ctx.beginPath();
                    ctx.roundRect(
                        position.x + (scaledEntryHeight / 10),
                        this.tempBox.Position.y + (scaledEntryHeight / 10),
                        scaledEntryWidth - (scaledEntryHeight / 5),
                        scaledEntryHeight - (scaledEntryHeight / 5),
                        5 * scale
                    );
                    ctx.fill();
                }

                this.textStyle.setupStyle(ctx, scale);
                ctx.fillText(entry.text, position.x + (scaledEntryHeight / 5), this.tempBox.Position.y + (scaledEntryHeight / 2))

                // Render arrows
                if (entry.subMenu !== undefined) {
                    ctx.beginPath()
                    ctx.strokeStyle = "black"
                    ctx.lineWidth = 1 * scale;
                    ctx.lineTo(position.x + scaledEntryWidth - (scaledEntryHeight / 2.5), this.tempBox.Position.y + (scaledEntryHeight / 3))
                    ctx.lineTo(position.x + scaledEntryWidth - (scaledEntryHeight / 4), this.tempBox.Position.y + (scaledEntryHeight / 2))
                    ctx.lineTo(position.x + scaledEntryWidth - (scaledEntryHeight / 2.5), this.tempBox.Position.y + scaledEntryHeight - (scaledEntryHeight / 3))
                    ctx.stroke();
                }

                optionsRendered++;
            }

            // Draw a line seperating the groups
            if (groupIndex !== this.groups.Count() - 1) {
                ctx.strokeStyle = "black"
                ctx.lineWidth = .5 * scale;
                ctx.beginPath();
                const startX = position.x + (scaledEntryHeight / 10);
                const y = this.tempBox.Position.y + scaledEntryHeight
                ctx.lineTo(startX, y);
                ctx.lineTo(startX + scaledEntryWidth - (scaledEntryHeight / 5), y);
                ctx.stroke();
            }
        }

        if (this.openSubMenu !== undefined) {
            const mouseOverSub = this.openSubMenu.render(ctx, this.submenuPosition, scale, mousePosition)
            if (mouseOverSub !== null) {
                mouseIsOver = mouseOverSub;
            } else if (!subOpenedThisFrame) {
                this.openSubMenu = undefined;
            }
        }

        return mouseIsOver;
    }
}