import { CopyVector2, Vector2 } from "./types/vector2";

export class MouseObserver {

    private clicked: boolean;

    private lastTouch: Vector2;

    constructor(
        private ele: HTMLElement,
        private dragCallback: (delta: Vector2) => void,
        private moveCallback: (position: Vector2) => void,
        private clickStart: (position: Vector2) => void,
        private clickStop: () => void,
        private contextMenu: (position: Vector2) => void
    ) {
        this.clicked = false;
        this.lastTouch = {
            x: 0,
            y: 0
        }

        // Down
        ele.addEventListener('mousedown', this.down.bind(this), false);
        ele.addEventListener('touchstart', this.touchDown.bind(this), false);

        // Up
        ele.addEventListener('mouseup', this.up.bind(this), false);
        ele.addEventListener('touchend', this.up.bind(this), false);

        // Move
        ele.addEventListener('mousemove', this.move.bind(this), false);
        ele.addEventListener('touchmove', this.moveTouch.bind(this), false);

        // Context
        ele.addEventListener('contextmenu', (evt) => {
            contextMenu(this.mousePosition(evt));
            evt.preventDefault()
        }, false);
    }

    private mousePosition(event: MouseEvent): Vector2 {
        var rect = this.ele.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        }
    }

    private move(event: MouseEvent): void {
        if (this.clicked) {
            this.dragCallback({
                x: event.movementX,
                y: event.movementY,
            })
        }

        this.moveCallback(this.mousePosition(event));
    }

    private moveTouch(event: TouchEvent): void {
        const rect = this.ele.getBoundingClientRect();
        const pos = {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top
        }
        this.moveCallback(pos);

        if (this.clicked) {
            this.dragCallback({
                x: pos.x - this.lastTouch.x,
                y: pos.y - this.lastTouch.y,
            });
        }

        CopyVector2(this.lastTouch, pos);
    }

    private down(event: MouseEvent): void {
        this.clicked = true;
        this.clickStart(this.mousePosition(event));
    }

    private touchDown(event: TouchEvent) {
        this.clicked = true;
        const rect = this.ele.getBoundingClientRect();
        this.lastTouch.x = event.touches[0].clientX - rect.left;
        this.lastTouch.y = event.touches[0].clientY - rect.top;
        this.clickStart(this.lastTouch);
    }

    private up(): void {
        this.clicked = false
        this.clickStop();
    }
}