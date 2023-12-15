
import chalk from 'chalk';

const opcStream = require('opc');
const opcParser = require('opc/parser');
const opcStrand = require('opc/strand');

export interface IMessage {
  channel: number;
  command: number;
  data: Buffer;
}

interface IStrand {
  buffer: Buffer;
  length: number;
  getPixel(i: number): [number, number, number];
}

export class Handler {
  private readonly strands: Map<number, IStrand>;
  private readonly char: string;

  constructor(char: string, count: number, channel: number[]) {
    this.char = char;
    // Default strands color is white.
    this.strands = new Map(
      channel.map((c) => [c, opcStrand(Buffer.alloc(count * 3).fill(0xff))]),
    );
  }

  handle(message: IMessage): Buffer|undefined {
    console.debug('received command:', message.command, message.data);
    switch (message.command) {
      case 0: { // set-pixel-color
        // TODO(proppy): implement channel 0 broadcast
        if (!this.strands.has(message.channel)) {
          console.warn('unknown OPC channel:', message.command);
          return;
        }
        this.strands.set(message.channel, opcStrand(message.data));
        // Display updated strands to the console.
        for (const [c, strand] of this.strands) {
          for (let i = 0; i < strand.length; i++) {
            const pixel = strand.getPixel(i);
            process.stdout.write(chalk.rgb(
              pixel[0],
              pixel[1],
              pixel[2],
            )(this.char));
          }
          process.stdout.write('\n');
        }
        break;
      }
      case 0xff: { // SYSEX
        if (message.data[0] === 0x00 && // System IDs[0]
          message.data[1] === 0x03 && // System IDs[1]
          message.data[2] === 0x00 && // get-pixel-color[0]
          message.data[3] === 0x01) { // get-pixel-color[1]
          const stream = opcStream();
          stream.writeMessage(message.channel,
                              0xff, // SYSEX
                              this.strands.get(message.channel)!.buffer);
          return stream.read();
        }
        break;
      }
      default:
        console.warn('Unsupported OPC command:', message.command);
        break;
    }
  }
}
