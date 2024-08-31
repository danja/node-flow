import { Theme } from "./theme";
import { Text } from "./types/text";


export function BuildMarkdown(data: string): Array<Text> {
    const lines = data.split(/\r\n|\r|\n/);

    const document = new Array<Text>();

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (line === "") {
            continue;
        }

        let size = Theme.Note.FontSize;

        if (line.startsWith("# ")) {
            size = Theme.Note.H1.FontSize;
            line = line.substring(2);
        } else if (line.startsWith("## ")) {
            size = Theme.Note.H2.FontSize;
            line = line.substring(3);
        } else if (line.startsWith("### ")) {
            size = Theme.Note.H3.FontSize;
            line = line.substring(4);
        }

        document.push(new Text(line, {
            color: Theme.Note.FontColor,
            size: size,
        }));
    }

    return document;
}