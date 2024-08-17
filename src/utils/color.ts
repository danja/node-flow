export interface Color {
    r: number,
    g: number,
    b: number,
}

function componentToHex(c: number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

export function RgbToHex(c: Color): string {
    return "#" + componentToHex(c.r) + componentToHex(c.g) + componentToHex(c.b);
}

export function HexToColor(hex: string): Color | null {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}