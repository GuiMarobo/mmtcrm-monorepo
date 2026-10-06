import { http } from './http'
import type {
  CreatedUsedDevice,
  CreateUsedDevicePayload,
  NegotiationUsedDevices,
  UpdateUsedDevicePayload,
  UsedDevice,
} from '../types'

export const usedDevicesApi = {
  listByNegotiation(negotiationId: number): Promise<NegotiationUsedDevices> {
    return http.get<NegotiationUsedDevices>(`/negotiations/${negotiationId}/used-devices`)
  },

  create(negotiationId: number, payload: CreateUsedDevicePayload): Promise<CreatedUsedDevice> {
    return http.post<CreatedUsedDevice>(`/negotiations/${negotiationId}/used-devices`, payload)
  },

  update(id: number, payload: UpdateUsedDevicePayload): Promise<UsedDevice> {
    return http.patch<UsedDevice>(`/used-devices/${id}`, payload)
  },

  remove(id: number): Promise<UsedDevice> {
    return http.delete<UsedDevice>(`/used-devices/${id}`)
  },
}
