
import express from 'express';
import upnp from 'node-ssdp';
import xmlBuilder from 'xmlbuilder2';

import type {IDiscoveryData} from './types';

export function start(port: number, deviceType: string, serviceType: string, discoveryData: IDiscoveryData) {
  const descriptionPath = '/device.xml';

  // HTTP server to response to description requests
  const server = express();
  server.get(descriptionPath, (req, res) => {
    console.debug(`UPnP: received device description request.`);
    // UPnP HTTP server should return XML with device description
    // in compliance with schemas-upnp-org. See
    // http://upnp.org/specs/arch/UPnP-arch-DeviceArchitecture-v1.1.pdf
    const deviceDescription = xmlBuilder.create({
      root: {
        '@xmlns': 'urn:schemas-upnp-org:device-1-0',
        'specVersion': {
          major: '1',
          minor: '1',
        },
        'device': {
          deviceType,
          friendlyName: 'Virtual Light Device',
          UDN: `uuid:${discoveryData.id}`,
          modelName: discoveryData.model,
          serviceList: {
            service: discoveryData.channels.map((channel) => {
              return {
                serviceType,
                serviceId: `urn:sample:serviceId:strand-${channel}`,
              };
            }),
          },
        },
      },
    }).end({ prettyPrint: true });
    res.status(200).send(deviceDescription);
  });
  server.listen(port, () => {
    console.log(`UPnP: HTTP server listening on port ${port}`);
  });

  // Start the UPnP advertisements
  const upnpServer = new upnp.Server({
    location: {
      path: descriptionPath,
      port,
    },
    udn: `uuid:${discoveryData.id}`,
  });
  upnpServer.addUSN('upnp:rootdevice');
  upnpServer.addUSN(deviceType);
  upnpServer.addUSN(serviceType);
  upnpServer.start();

  console.log(`UPnP discovery advertising ${serviceType}`);
}
