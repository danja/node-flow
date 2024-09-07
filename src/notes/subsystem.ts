import { ContextMenuConfig } from "../contextMenu";
import { RenderResults } from "../graphSubsystem";
import { InBox } from "../types/box";
import { Vector2 } from "../types/vector2";
import { FlowNote, FlowNoteConfig } from './note';

export class NoteSubsystem {

    #notes: Array<FlowNote>;

    #noteHovering: FlowNote | null;

    constructor(notes?: Array<FlowNoteConfig>) {
        this.#notes = [];
        this.#noteHovering = null;

        if (notes !== undefined) {
            for (let i = 0; i < notes.length; i++) {
                this.addNote(new FlowNote(notes[i]));
            }
        }
    }

    addNote(note: FlowNote): void {
        this.#notes.push(note);
    }

    openContextMenu(position: Vector2): ContextMenuConfig | null {
        const group = "node-flow-graph-note-menu";

        const result: ContextMenuConfig = {
            items: [
                {
                    name: "New Note",
                    group: group,
                    callback: () => {
                        this.addNote(new FlowNote({
                            text: "#Note\n\nRight-click this note and select \"edit note\" to put what you want here.",
                            width: 300,
                            position: position
                        }))
                    }
                }
            ],
            subMenus: [],
        }

        if (this.#noteHovering !== null) {
            const noteToReview = this.#noteHovering;
            result.subMenus?.push({
                name: "Edit Note",
                group: group,
                items: [
                    {
                        name: "Contents",
                        callback: noteToReview.editContent.bind(noteToReview),
                    },
                    {
                        name: "Layout",
                        callback: noteToReview.editLayout.bind(noteToReview),
                    }
                ]
            });

            result.items?.push({
                name: "Delete Note",
                group: group,
                callback: () => {
                    this.#removeNote(noteToReview);
                    // this.#removeNodeConnections(nodeToReview);
                }
            });
        }

        return result;
    }

    clickStart(mousePosition: Vector2, ctrlKey: boolean): boolean {
        // Left intentionally blank
        return false;
    }

    clickEnd(): void {
        // Left intentionally blank
    }

    mouseDragEvent(delta: Vector2, scale: number): boolean {
        // Left intentionally blank
        return false;
    }

    #removeNote(note: FlowNote): void {
        const index = this.#notes.indexOf(note);
        if (index > -1) {
            this.#notes.splice(index, 1);
        } else {
            console.error("no note found to remove");
        }
    }

    render(ctx: CanvasRenderingContext2D, scale: number, position: Vector2, mousePosition: Vector2 | undefined): RenderResults | undefined {
        this.#noteHovering = null;
        for (let i = 0; i < this.#notes.length; i++) {
            this.#notes[i].render(ctx, position, scale, mousePosition);

            if (mousePosition) {
                if (InBox(this.#notes[i].bounds(), mousePosition)) {
                    this.#noteHovering = this.#notes[i];
                }
            }
        }
        return;
    }
}