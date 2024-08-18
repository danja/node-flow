export interface Vector2 {
    x: number
    y: number
}

export function CopyVector2(dst: Vector2, src: Vector2): void {
    dst.x = src.x;
    dst.y = src.y;
}
