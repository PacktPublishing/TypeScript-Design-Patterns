import * as FS from 'fs';

import * as request from 'request';

namespace TemplateMethod {
    abstract class TextReader {
        async readAllText(): Promise<string> {
            let bytes = await this.readAllBytes();
            let text = this.decodeBytes(bytes);

            return text;
        }

        abstract async readAllBytes(): Promise<Buffer>;

        abstract decodeBytes(bytes: Buffer): string;
    }

    abstract class AsciiTextReader extends TextReader {
        decodeBytes(bytes: Buffer): string {
            return bytes.toString('ascii');
        }
    }

    class FileAsciiTextReader extends AsciiTextReader {
        constructor(
            public path: string
        ) {
            super();
        }

        async readAllBytes(): Promise<Buffer> {
            return new Promise<Buffer>((resolve, reject) => {
                FS.readFile(this.path, (error, bytes) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(bytes);
                    }
                });
            });
        }
    }

    class HttpAsciiTextReader extends AsciiTextReader {
        constructor(
            public url: string
        ) {
            super();
        }

        async readAllBytes(): Promise<Buffer> {
            return new Promise<Buffer>((resolve, reject) => {
                request(this.url, {
                    encoding: null
                }, (error, bytes, body) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(body);
                    }
                });
            });
        }
    }
}
