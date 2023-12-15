
const bonjour = require('bonjour');
const mdnsParser = require('multicast-dns-service-types');

import type {IDiscoveryData} from './types';

export function start(port: number, serviceName: string, discoveryData: IDiscoveryData) {
// Validate and parse the input string
  const serviceParts = mdnsParser.parse(serviceName);
  // Publish the DNS-SD service
  const mdnsServer = bonjour();
  mdnsServer.publish({
    name: discoveryData.id,
    type: serviceParts.name,
    protocol: serviceParts.protocol,
    port,
    txt: discoveryData,
  });
  // Log query events from internal mDNS server
  mdnsServer._server.mdns.on('query', (query: any) => {
    if (query.questions[0].name === serviceName) {
      console.debug(`Received mDNS query for ${serviceName}`);
    }
  });

  console.log(`mDNS discovery advertising ${serviceName}`);
}
