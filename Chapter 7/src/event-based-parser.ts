import * as Net from 'net';
import { EventEmitter } from 'events';

const enum State {
    header,
    body
}

const UINT32_SIZE = 4;

class Parser extends EventEmitter {
    private buffer = new Buffer(0);
    private state = State.header;

    private pendingBodyLength: number;

    append(buffer: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, buffer]);
        this.parse();
    }

    private parse(): void {
        while (this.buffer.length) {
            let consumed: boolean;

            switch (this.state) {
                case State.header:
                    consumed = this.parseHeader();
                    break;
                case State.body:
                    consumed = this.parseBody();
                    break;
                default:
                    throw new Error('Unknown state');
            }

            if (!consumed) {
                break;
            }
        }
    }

    private parseHeader(): boolean {
        if (this.buffer.length < UINT32_SIZE) {
            return false;
        }

        this.pendingBodyLength = this.buffer.readUInt32BE(0);
        this.consume(UINT32_SIZE);
        this.state = State.body;

        return true;
    }

    private parseBody(): boolean {
        let bodyLength = this.pendingBodyLength;

        if (this.buffer.length < bodyLength) {
            return false;
        }

        let jsonBuffer = this.buffer.slice(0, bodyLength);
        this.consume(bodyLength);
        this.state = State.header;

        let json = jsonBuffer.toString();

        try {
            let data = JSON.parse(json);
            this.emit('data', data);
        } catch (error) {
            this.emit('error', error);
        }

        return true;
    }

    private consume(count: number): void {
        this.buffer = this.buffer.slice(count);
    }
}

function buildPacket(data: any): Buffer {
    let json = JSON.stringify(data);
    let jsonBuffer = new Buffer(json);

    let packet = new Buffer(4 + jsonBuffer.length);

    packet.writeUInt32BE(jsonBuffer.length, 0);
    jsonBuffer.copy(packet, 4, 0);

    return packet;
}

let server = Net.createServer(client => {
    console.log('Client connected.');

    client.write(buildPacket({}));

    client.write(buildPacket({
        key: 'value'
    }));
});

server.listen((error: Error) => {
    if (error) {
        console.error(error);
    }
});

let parser = new Parser();
let client = Net.connect(server.address().port);

client.on('data', (data: Buffer) => {
    parser.append(data);
});

parser.on('data', (data: any) => {
    console.log('Data received:', data);
});
