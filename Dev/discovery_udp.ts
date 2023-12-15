
import dgram from 'dgram';

import cbor from 'cbor';

import type {IDiscoveryData} from './types';

export function start(port: number, discoveryPayload: string, discoveryData: IDiscoveryData) {
  const discoveryPacket = Buffer.from(discoveryPayload, 'hex');
  const socket = dgram.createSocket('udp4');
  // Handle discovery request.
  socket.on('message', (msg, rinfo) => {
    if (msg.compare(discoveryPacket) !== 0) {
      console.warn('UDP received unknown payload:', msg, 'from:', rinfo);
      return;
    }
    console.debug('UDP received discovery payload:', msg, 'from:', rinfo);
    // Reply to discovery request with device parameters encoded in CBOR.
    // note: any encoding/properties could be used as long as the app-side can
    // interpret the payload.
    const responsePacket = cbor.encode(discoveryData);
    socket.send(responsePacket, rinfo.port, rinfo.address, (error) => {
      if (error !== null) {
        console.error('UDP failed to send ack:', error);
        return;
      }
      console.debug(
          'UDP sent discovery response:', responsePacket, 'to:', rinfo);
    });
  });
  socket.on('listening', () => {
    console.log('UDP discovery listening', socket.address());
  });
  socket.bind(port);
}
