export enum MarkdownTokenType {
    Text = "Text",
    H1 = "H1",
    H2 = "H2",
    H3 = "H3",
    NewLine = "New Line",
    Star = "Star",
    Space = "Space"
}

export class MarkdownToken {

    #type: MarkdownTokenType;

    #lexeme: string

    constructor(type: MarkdownTokenType, lexeme: string) {
        this.#type = type;
        this.#lexeme = lexeme;
    }

    type(): MarkdownTokenType {
        return this.#type;
    }

    lexeme(): string {
        return this.#lexeme;
    }
}
