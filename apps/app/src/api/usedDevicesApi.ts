import { http } from './http'
import type {
  CreatedUsedDevice,
  CreateUsedDevicePayload,
  EvaluateUsedDevicePayload,
  NegotiationUsedDevices,
  RefuseUsedDevicePayload,
  UpdateUsedDevicePayload,
  UsedDevice,
  UsedDeviceDetail,
  UsedDeviceQueue,
  UsedDeviceQueueFilter,
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

  listQueue(status: UsedDeviceQueueFilter): Promise<UsedDeviceQueue> {
    return http.get<UsedDeviceQueue>(`/used-devices?status=${status}`)
  },

  findOne(id: number): Promise<UsedDeviceDetail> {
    return http.get<UsedDeviceDetail>(`/used-devices/${id}`)
  },

  evaluate(id: number, payload: EvaluateUsedDevicePayload): Promise<UsedDevice> {
    return http.post<UsedDevice>(`/used-devices/${id}/evaluate`, payload)
  },

  refuse(id: number, payload: RefuseUsedDevicePayload): Promise<UsedDevice> {
    return http.post<UsedDevice>(`/used-devices/${id}/refuse`, payload)
  },
}
