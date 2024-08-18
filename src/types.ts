export interface Vector2 {
    x: number
    y: number
}

export interface Box {
    Position: Vector2
    Size: Vector2
}

export function CopyVector2(dst: Vector2, src: Vector2): void {
    dst.x = src.x;
    dst.y = src.y;
}

export function BoxCenter(box: Box, out: Vector2): Vector2 {
    out.x = box.Position.x + (box.Size.x / 2);
    out.y = box.Position.y + (box.Size.y / 2);
    return out
}

export function InBox(box: Box, position: Vector2): boolean {
    const min = box.Position
    if (position.x < min.x) {
        return false
    }
    if (position.y < min.y) {
        return false
    }

    if (position.x > min.x + box.Size.x) {
        return false
    }
    if (position.y > min.y + box.Size.y) {
        return false
    }

    return true
}