
import dgram from 'dgram';
import {Readable} from 'stream';

const opcParser = require('opc/parser');

import * as opcDevice from './opc_device';

export function start(port: number, opcHandler: opcDevice.Handler) {
  const server = dgram.createSocket('udp4');
  server.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
    console.debug(`UDP: from ${rinfo.address} got`, msg);
    Readable.from(msg).pipe(opcParser()).on('data', (message: opcDevice.IMessage) => {
      opcHandler.handle(message);
      const response = opcHandler.handle(message);
      if (response !== undefined) {
        server.send(response, rinfo.port, rinfo.address, (error) => {
          if (error !== null) {
            console.error('UDP failed to send OPC command response:', error);
            return;
          }
          console.debug(`UDP: sent response to ${rinfo.address}:${rinfo.port}:`, response);
        });
      }
    });
  });
  server.on('listening', () => {
    console.log(`UDP control listening on port ${port}`);
  });
  server.bind(port);
}
