namespace Visitor {
    interface Node {
        appendTo(visitor: NodeVisitor): void;
    }

    interface NodeVisitor {
        appendText(text: Text): void;
        appendBold(text: BoldText): void;
        appendUnorderedList(list: UnorderedList): void;
        appendListItem(item: ListItem): void;
    }

    class Text implements Node {
        constructor(
            public content: string
        ) { }

        appendTo(visitor: NodeVisitor): void {
            visitor.appendText(this);
        }
    }

    class BoldText implements Node {
        constructor(
            public content: string
        ) { }

        appendTo(visitor: NodeVisitor): void {
            visitor.appendBold(this);
        }
    }

    class UnorderedList implements Node {
        constructor(
            public items: ListItem[]
        ) { }

        appendTo(visitor: NodeVisitor): void {
            visitor.appendUnorderedList(this);
        }
    }

    class ListItem implements Node {
        constructor(
            public content: string
        ) { }

        appendTo(visitor: NodeVisitor): void {
            visitor.appendListItem(this);
        }
    }

    class HTMLVisitor implements NodeVisitor {
        output = '';

        appendText(text: Text) {
            this.output += text.content;
        }

        appendBold(text: BoldText) {
            this.output += `<b>${text.content}</b>`;
        }

        appendUnorderedList(list: UnorderedList) {
            this.output += '<ul>';

            for (let item of list.items) {
                item.appendTo(this);
            }

            this.output += '</ul>';
        }

        appendListItem(item: ListItem) {
            this.output += `<li>${item.content}</li>`;
        }
    }

    class MarkdownVisitor implements NodeVisitor {
        output = '';

        appendText(text: Text) {
            this.output += text.content;
        }

        appendBold(text: BoldText) {
            this.output += `**${text.content}**`;
        }

        appendUnorderedList(list: UnorderedList) {
            this.output += '\n';

            for (let item of list.items) {
                item.appendTo(this);
            }
        }

        appendListItem(item: ListItem) {
            this.output += `- ${item.content}\n`;
        }
    }

    let nodes = [
        new Text('Hello, '),
        new BoldText('TypeScript'),
        new Text('! Popular editors:\n'),
        new UnorderedList([
            new ListItem('Visual Studio Code'),
            new ListItem('Visual Studio'),
            new ListItem('WebStorm')
        ])
    ];

    let htmlVisitor = new HTMLVisitor();
    let markdownVisitor = new MarkdownVisitor();

    for (let node of nodes) {
        node.appendTo(htmlVisitor);
        node.appendTo(markdownVisitor);
    }

    console.log(htmlVisitor.output);
    console.log(markdownVisitor.output);
}
