
require('array.prototype.flatmap/auto');

import cbor from 'cbor';

import type {ICustomData, IDiscoveryData} from './types';

export class HomeApp {
  constructor(private readonly app: smarthome.App) {
    this.app = app;
  }

  async identifyHandler(identifyRequest: smarthome.IntentFlow.IdentifyRequest): Promise<smarthome.IntentFlow.IdentifyResponse> {
    // TODO(proppy): handle multiple inputs.
    const device = identifyRequest.inputs[0].payload.device;
    const discoveryData = await cbor.decodeFirst(Buffer.from(device.udpScanData!.data, 'hex')) as IDiscoveryData;
    console.debug('discoveryData:', JSON.stringify(discoveryData, null, 2));
    return {
      requestId: identifyRequest.requestId,
      intent: smarthome.Intents.IDENTIFY,
      payload: {
        device: {
          deviceInfo: {
            manufacturer: 'fakecandy corp',
            model: discoveryData.model,
            hwVersion: discoveryData.hw_rev || '',
            swVersion: discoveryData.fw_rev || '',
          },
          ...((discoveryData.channels.length > 1) ?
            {id: discoveryData.id, isProxy: true, isLocalOnly: true} :
            {
              id: discoveryData.id || 'deviceId',
              verificationId: discoveryData.id,
            }),
        },
      },
    };
  }

  async reachableDevicesHandler(
    reachableDevicesRequest: smarthome.IntentFlow.ReachableDevicesRequest):
  Promise<smarthome.IntentFlow.ReachableDevicesResponse> {
    const proxyDeviceId =
      reachableDevicesRequest.inputs[0].payload.device.id;
    const devices = reachableDevicesRequest.devices.flatMap((d) => {
      const customData = d.customData as ICustomData;
      if (customData.proxy === proxyDeviceId) {
        return [{verificationId: `${proxyDeviceId}-${customData.channel}`}];
      }
      return [];
    });
    return {
      intent: smarthome.Intents.REACHABLE_DEVICES,
      requestId: reachableDevicesRequest.requestId,
      payload: {
        devices,
      },
    };
  }

}
