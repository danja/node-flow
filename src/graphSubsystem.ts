import { ContextMenuConfig } from "./contextMenu";
import { Vector2 } from "./types/vector2";

export interface GraphSubsystem {

    render(ctx: CanvasRenderingContext2D, scale: number, position: Vector2, mousePosition: Vector2 | undefined): void;

    openContextMenu(position: Vector2): ContextMenuConfig | null;

}
