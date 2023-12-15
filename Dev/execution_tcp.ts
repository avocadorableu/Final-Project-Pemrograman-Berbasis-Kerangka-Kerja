
import net from 'net';

const opcParser = require('opc/parser');

import * as opcDevice from './opc_device';

export function start(port: number, opcHandler: opcDevice.Handler) {
  const server = net.createServer((conn) => {
    conn.pipe(opcParser()).on('data', (message: opcDevice.IMessage) => {
      const response = opcHandler.handle(message);
      if (response !== undefined) {
        conn.write(response);
        console.debug(`TCP: sent response:`, response);
      }
    });
  });
  server.listen(port, () => {
    console.log(`TCP control listening on port ${port}`);
  });
}
