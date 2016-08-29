namespace Command {
    class TextContext {
        content = 'text content';
    }

    abstract class TextCommand {
        constructor(
            public context: TextContext
        ) { }

        abstract execute(...args: any[]): void;
    }

    class ReplaceCommand extends TextCommand {
        execute(index: number, length: number, text: string): void {
            let content = this.context.content;

            this.context.content =
                content.substr(0, index) +
                text +
                content.substr(index + length);
        }
    }

    class InsertCommand extends TextCommand {
        execute(index: number, text: string): void {
            let content = this.context.content;

            this.context.content =
                content.substr(0, index) +
                text +
                content.substr(index);
        }
    }

    interface TextCommandInfo {
        command: TextCommand,
        args: any[];
    }

    class MacroTextCommand {
        constructor(
            public infos: TextCommandInfo[]
        ) { }

        execute(): void {
            for (let info of this.infos) {
                info.command.execute(...info.args);
            }
        }
    }

    class Client {
        private context = new TextContext();

        replaceCommand = new ReplaceCommand(this.context);
        insertCommand = new InsertCommand(this.context);
    }

    let client = new Client();

    $('.replace-button').click(() => {
        client.replaceCommand.execute(0, 4, 'the');
    });

    $('.insert-button').click(() => {
        client.insertCommand.execute(0, 'awesome ');
    });
}
