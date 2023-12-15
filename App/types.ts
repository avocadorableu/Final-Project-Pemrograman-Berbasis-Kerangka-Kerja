
import type {ControlKind, IDiscoveryData} from '../device/types';
export {ControlKind, IDiscoveryData};

export interface ICustomData {
  channel: number;
  leds: number;
  port: number;
  proxy: string;
  control_protocol: ControlKind;
}

export interface IColorAbsolute {
  color: {name: string; spectrumRGB: number;};
}
