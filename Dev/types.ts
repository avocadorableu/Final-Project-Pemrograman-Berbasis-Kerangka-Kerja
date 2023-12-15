
export enum DiscoveryKind {
  UDP = 'UDP',
  UPNP = 'UPNP',
  MDNS = 'MDNS',
}

export enum ControlKind {
  UDP = 'UDP',
  TCP = 'TCP',
  HTTP = 'HTTP',
}

export interface IDiscoveryData {
  id: string;
  model: string;
  hw_rev?: string;
  fw_rev?: string;
  channels: number[];
}
