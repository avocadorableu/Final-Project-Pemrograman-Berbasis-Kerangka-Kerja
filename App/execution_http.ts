
const opcStream = require('opc');
const opcStrand = require('opc/strand');

import type {IColorAbsolute, ICustomData} from './types';

export class HomeApp {
  constructor(private readonly app: smarthome.App) {
    this.app = app;
  }

  async executeHandler(executeRequest: smarthome.IntentFlow.ExecuteRequest): Promise<smarthome.IntentFlow.ExecuteResponse> {
    // TODO(proppy): handle multiple inputs/commands.
    const command = executeRequest.inputs[0].payload.commands[0];
    // TODO(proppy): handle multiple executions.
    const execution = command.execution[0];
    if (execution.command !== 'action.devices.commands.ColorAbsolute') {
      throw new Error(`Unsupported command: ${execution.command}`);
    }
    // Create execution response to capture individual command
    // success/failure for each devices.
    const executeResponse =
      new smarthome.Execute.Response.Builder().setRequestId(
        executeRequest.requestId);
    // Handle light device commands for all devices.
    await Promise.all(command.devices.map(async (device) => {
      // Create OPC set-pixel-color 8-bit message from ColorAbsolute command.
      const params = execution.params as IColorAbsolute
      const customData = device.customData as ICustomData;
      const rgb = params.color.spectrumRGB;
      const colorBuf = Buffer.alloc(customData.leds * 3);
      for (let i = 0; i < colorBuf.length; i += 3) {
        colorBuf.writeUInt8(rgb >> 16 & 0xff, i + 0);  // R
        colorBuf.writeUInt8(rgb >> 8 & 0xff, i + 1);   // G
        colorBuf.writeUInt8(rgb >> 0 & 0xff, i + 2);   // B
      }
      const stream = opcStream();
      stream.writePixels(customData.channel, colorBuf);
      const opcMessage = stream.read();
      const setPixelColorCommand = new smarthome.DataFlow.HttpRequestData();
      setPixelColorCommand.requestId = executeRequest.requestId;
      setPixelColorCommand.deviceId = device.id;
      setPixelColorCommand.port = customData.port;
      setPixelColorCommand.method = smarthome.Constants.HttpOperation.POST;
      setPixelColorCommand.path = `/${customData.channel}`
      setPixelColorCommand.dataType = 'application/octet-stream';
      setPixelColorCommand.data = colorBuf.toString('base64');
      console.debug('HTTP setPixelColorCommand:', setPixelColorCommand);
      // Dispatch command.
      try {
        const setPixelColorResponse =
          await this.app.getDeviceManager().send(setPixelColorCommand);
        console.debug('HTTP setPixelColorResponse:', setPixelColorResponse);
        const state = {
          ...params,
          online: true,
        };
        executeResponse.setSuccessState(setPixelColorResponse.deviceId, state);
      } catch (e) {
        executeResponse.setErrorState(device.id, e.errorCode);
      }
    }));
    // Return execution response to smarthome infrastructure.
    return executeResponse.build();
  }

  async queryHandler(queryRequest: smarthome.IntentFlow.QueryRequest): Promise<smarthome.IntentFlow.QueryResponse> {
    // TODO(proppy): handle multiple devices.
    const device = queryRequest.inputs[0].payload.devices[0];
    const customData = device.customData as ICustomData;
    const stream = opcStream();
    stream.writeMessage(customData.channel,
                        0xff, // SYSEX
                        Buffer.from([
                          0x00, 0x03, // System IDs
                          0x00, 0x01 // get-pixel-color
                        ]));
    const opcMessage = stream.read();
    const getPixelColorCommand = new smarthome.DataFlow.HttpRequestData();
    getPixelColorCommand.requestId = queryRequest.requestId;
    getPixelColorCommand.deviceId = device.id;
    getPixelColorCommand.port = customData.port;
    getPixelColorCommand.method = smarthome.Constants.HttpOperation.GET;
    getPixelColorCommand.path = `/${customData.channel}`
    console.debug('HTTP getPixelColorCommand:', getPixelColorCommand);
    const getPixelColorResponse = await this.app.getDeviceManager().send(getPixelColorCommand) as smarthome.DataFlow.HttpResponseData;
    console.debug('HTTP getPixelColorResponse:', getPixelColorResponse);
    if (getPixelColorResponse.httpResponse.statusCode !== 200) {
      throw new Error(`Unsupported protocol for OPC get-pixel-color: HTTP`);
    }
    const opcPayload = Buffer.from(getPixelColorResponse.httpResponse.body as string, 'base64');
    console.debug('HTTP opcPayload:', opcPayload);
    const opcChannel = opcPayload.readUInt8(0);
    const opcCommand = opcPayload.readUInt8(1); // SYSEX
    const opcDataSize = opcPayload.readUInt16BE(2);
    const opcData = opcPayload.slice(4);
    if (opcDataSize !== opcData.length) {
      throw new Error(`Unexpected message size: expected: ${opcDataSize} got: ${opcData.length}`);
    }
    const strand = opcStrand(opcData);
    const pixel = strand.getPixel(0); // get  first pixel of the strand.
    const rgb = pixel[0] << 16 | pixel[1] << 8 | pixel[2];
    return {
      requestId: queryRequest.requestId,
      payload: {
        devices: {
          [device.id]: {
            online: true,
            color: {
              spectrumRgb: rgb
            }
          }
        }
      }
    };
  }
}
