const binarySearch = ({ max, getValue, match }) => {
    let min = 0;

    while (min <= max) {
        let guess = Math.floor((min + max) / 2);
        const compareVal = getValue(guess);

        if (compareVal === match) return guess;
        if (compareVal < match) min = guess + 1;
        else max = guess - 1;
    }

    return max;
};

export function fitString(ctx: CanvasRenderingContext2D, str: string, maxWidth: number) {
    let width = ctx.measureText(str).width;
    const ellipsis = '…';
    const ellipsisWidth = ctx.measureText(ellipsis).width;
    if (width <= maxWidth || width <= ellipsisWidth) {
        return str;
    }

    const index = binarySearch({
        max: str.length,
        getValue: guess => ctx.measureText(str.substring(0, guess)).width,
        match: maxWidth - ellipsisWidth,
    });

    return str.substring(0, index) + ellipsis;
};

// https://stackoverflow.com/a/18234317/4974261
export function Format(str: string, ...args: Array<string>): string {
    if (arguments.length) {
        for (let key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }
    return str;
};