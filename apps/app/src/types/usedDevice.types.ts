import type { DeviceCondition, EvaluationStatus, NegotiationStatus } from './enums'

export interface UsedDevicePerson {
  id: number
  name: string
}

export interface UsedDevice {
  id: number
  negotiationId: number
  model: string
  serialNumber: string
  imei: string | null
  evaluationStatus: EvaluationStatus
  condition: DeviceCondition | null
  estimatedValue: number | null
  report: string | null
  icloudUnlocked: boolean | null
  evaluatedAt: string | null
  evaluator: UsedDevicePerson | null
  createdAt: string
  createdBy: UsedDevicePerson | null
}

export interface CreatedUsedDevice extends UsedDevice {
  serialSeenBefore: number
}

export interface NegotiationUsedDevices {
  devices: UsedDevice[]
  tradeInTotal: number
  amountDue: number
}

export interface CreateUsedDevicePayload {
  model: string
  serialNumber: string
  imei: string | null
}

export type UpdateUsedDevicePayload = Partial<CreateUsedDevicePayload>

export type UsedDeviceQueueFilter = EvaluationStatus | 'TODOS'

export interface UsedDeviceNegotiation {
  id: number
  status: NegotiationStatus
  client: { id: string; name: string }
  vendedor: UsedDevicePerson | null
}

export interface QueueUsedDevice extends UsedDevice {
  negotiation: UsedDeviceNegotiation
}

export interface SerialHistoryEntry {
  id: number
  createdAt: string
  evaluatedAt: string | null
  evaluationStatus: EvaluationStatus
  condition: DeviceCondition | null
  estimatedValue: number | null
}

export interface UsedDeviceDetail extends QueueUsedDevice {
  serialHistory: SerialHistoryEntry[]
}

export interface UsedDeviceQueue {
  devices: QueueUsedDevice[]
}

export interface EvaluateUsedDevicePayload {
  condition: DeviceCondition
  estimatedValue: number
  report: string | null
  icloudUnlocked: boolean
}

export interface RefuseUsedDevicePayload {
  report: string
}
