import { FontStyle, FontWeight, TextStyleConfig } from "../styles/text";
import { Theme } from "../theme";
import { List } from "../types/list";
import { Text } from "../types/text";
import { MarkdownEntry } from "./entry";
import { MarkdownToken, MarkdownTokenType } from "./token";

export class MarkdownSyntaxParser {

    #tokens: Array<MarkdownToken>;

    #index: number;

    constructor(tokens: Array<MarkdownToken>) {
        this.#index = 0;
        this.#tokens = tokens;
    }

    current(): MarkdownToken | null {
        if (this.#index >= this.#tokens.length - 1) {
            return null
        }
        return this.#tokens[this.#index];
    }

    inc(): void {
        this.#index++
    }

    next(): MarkdownToken | null {
        if (this.#index >= this.#tokens.length - 1) {
            return null
        }
        this.#index++
        return this.#tokens[this.#index];
    }

    star(): Array<Text> {

        // Cases to consider
        // =================
        // 1.  *a*:      <i>a</i>
        // 2.  **a**:    <b>a</b>
        // 3.  **a*:     *<i>a</i> <----- fuck this one
        // 4.  ***a**:   *<b>a</b> <----- fuck this one
        // 5.  *a**:     <i>a</i>*
        // 6.  **a***:   <b>a</b>*
        // 7.  * a *:    * a *
        // 8.  ** a **:  ** a **
        // 9.  **a **:   **a **
        // 10. **a f**:  <b>a f<b>

        let token = this.next();

        let bold = false;
        // Read off all leading stars
        while (token !== null && token.type() === MarkdownTokenType.Star) {
            bold = true;
            token = this.next();
        }

        let textContent = "";

        let boldClosed = false;
        let startingClose = false;
        let validClose = false;
        while (token !== null && token.type() !== MarkdownTokenType.NewLine) {
            if (token.type() === MarkdownTokenType.Star) {

                // This is the second star we've seen in a row. We're done!
                if (startingClose) {
                    boldClosed = true;
                    break;
                }

                // If we're not bold, we just need a single star to close this off.
                if (bold === false) {
                    break;
                } else {
                    startingClose = true;
                }
            }

            if (startingClose && token.type() !== MarkdownTokenType.Star) {
                break;
            }

            // Add to string content...
            if (token.type() === MarkdownTokenType.Text) {
                textContent += token.lexeme();
                validClose = true;
            }

            if (token.type() === MarkdownTokenType.Space) {
                textContent += token.lexeme();
                validClose = false;
            }

            token = this.next();
        }

        const textStlye: TextStyleConfig = {}

        if (validClose) {
            if (boldClosed) {
                textStlye.weight = FontWeight.Bold;
            } else {
                textStlye.style = FontStyle.Italic;
            }
        }

        return [
            new Text(textContent, textStlye)
        ]
    }

    text(): Array<Text> {
        let contents: Array<Text> = new Array<Text>();
        let textContent = "";

        let token = this.current();
        while (token !== null && token.type() !== MarkdownTokenType.NewLine) {
            switch (token.type()) {
                case MarkdownTokenType.Text:
                case MarkdownTokenType.H1:
                case MarkdownTokenType.H2:
                case MarkdownTokenType.H3:
                case MarkdownTokenType.Text:
                case MarkdownTokenType.Space:
                    textContent += token.lexeme();
                    break;

                case MarkdownTokenType.Star:
                    if (textContent !== "") {
                        contents.push(new Text(textContent))
                        textContent = "";
                    }
                    let starText = this.star()
                    for (let i = 0; i < starText.length; i++) {
                        contents.push(starText[i]);
                    }
                    break;
            }

            token = this.next();
        }

        if (textContent !== "") {
            contents.push(new Text(textContent))
        }


        return contents;
    }

    h1(): MarkdownEntry {
        // Move off of the header token
        this.inc();

        const text = this.text();
        for (let i = 0; i < text.length; i++) {
            text[i].setColor(Theme.Note.FontColor);
            text[i].setSize(Theme.Note.H1.FontSize);
            text[i].setWeight(FontWeight.Bold);
        }

        return new MarkdownEntry(text, true);
    }

    parse(): Array<MarkdownEntry> {
        let token = this.current();

        const entries = new Array<MarkdownEntry>();

        while (token !== null) {
            switch (token.type()) {
                case MarkdownTokenType.H1:
                    entries.push(this.h1());
                    break;

                case MarkdownTokenType.Text:
                case MarkdownTokenType.Star:
                    const textEntries = this.text();
                    for (let i = 0; i < textEntries.length; i++) {
                        textEntries[i].setColor(Theme.Note.FontColor);
                        textEntries[i].setSize(Theme.Note.FontSize);
                    }
                    entries.push(new MarkdownEntry(textEntries, false));
                    break;

                case MarkdownTokenType.NewLine:
                    this.inc();
                    break;

                default:
                    this.inc();
            }

            token = this.current();
        }

        return entries;
    }
}
