import type { DeviceCondition, EvaluationStatus } from './enums'

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
}

export interface CreateUsedDevicePayload {
  model: string
  serialNumber: string
  imei: string | null
}

export type UpdateUsedDevicePayload = Partial<CreateUsedDevicePayload>
