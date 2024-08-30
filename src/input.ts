import { CopyVector2, Vector2 } from "./types/vector2";

export class MouseObserver {

    #clicked: boolean;

    #lastTouch: Vector2;

    #ele: HTMLElement
    #dragCallback: (delta: Vector2) => void
    #moveCallback: (position: Vector2) => void
    #clickStart: (position: Vector2) => void
    #clickStop: () => void
    #contextMenu: (position: Vector2) => void

    constructor(
        ele: HTMLElement,
        dragCallback: (delta: Vector2) => void,
        moveCallback: (position: Vector2) => void,
        clickStart: (position: Vector2) => void,
        clickStop: () => void,
        contextMenu: (position: Vector2) => void
    ) {
        this.#ele = ele;
        this.#dragCallback = dragCallback;
        this.#moveCallback = moveCallback;
        this.#clickStart = clickStart;
        this.#clickStop = clickStop;
        this.#contextMenu = contextMenu;

        this.#clicked = false;
        this.#lastTouch = {
            x: 0,
            y: 0
        }

        // Down
        ele.addEventListener('mousedown', this.#down.bind(this), false);
        ele.addEventListener('touchstart', this.#touchDown.bind(this), false);

        // Up
        ele.addEventListener('mouseup', this.#up.bind(this), false);
        ele.addEventListener('touchend', this.#up.bind(this), false);

        // Move
        ele.addEventListener('mousemove', this.#move.bind(this), false);
        ele.addEventListener('touchmove', this.#moveTouch.bind(this), false);

        // Context
        ele.addEventListener('contextmenu', (evt) => {
            contextMenu(this.#mousePosition(evt));
            evt.preventDefault()
        }, false);
    }

    #mousePosition(event: MouseEvent): Vector2 {
        var rect = this.#ele.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    #move(event: MouseEvent): void {
        if (this.#clicked) {
            this.#dragCallback({
                x: event.movementX,
                y: event.movementY,
            })
        }

        this.#moveCallback(this.#mousePosition(event));
    }

    #moveTouch(event: TouchEvent): void {
        const rect = this.#ele.getBoundingClientRect();
        const pos = {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        }
        this.#moveCallback(pos);

        if (this.#clicked) {
            this.#dragCallback({
                x: pos.x - this.#lastTouch.x,
                y: pos.y - this.#lastTouch.y,
            });
        }

        CopyVector2(this.#lastTouch, pos);
    }

    #down(event: MouseEvent): void {
        this.#clicked = true;
        this.#clickStart(this.#mousePosition(event));
    }

    #touchDown(event: TouchEvent) {
        this.#clicked = true;
        const rect = this.#ele.getBoundingClientRect();
        this.#lastTouch.x = event.touches[0].clientX - rect.left;
        this.#lastTouch.y = event.touches[0].clientY - rect.top;
        this.#clickStart(this.#lastTouch);
    }

    #up(): void {
        this.#clicked = false
        this.#clickStop();
    }
}