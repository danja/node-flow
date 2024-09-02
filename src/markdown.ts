import { MarkdownEntry } from "./markdown/entry";
import { MarkdownLexicalParser } from "./markdown/lexicalParser";
import { MarkdownSyntaxParser } from "./markdown/syntaxParser";

export function BuildMarkdown(data: string): Array<MarkdownEntry> {
    const lexicalParser = new MarkdownLexicalParser(data);
    lexicalParser.parse();
    console.log(lexicalParser.tokens());

    const syntaxParser = new MarkdownSyntaxParser(lexicalParser.tokens());
    const contents = syntaxParser.parse()
    console.log(contents);
    return contents;
}