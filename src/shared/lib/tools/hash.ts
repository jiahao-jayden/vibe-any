import { SnowflakeIdv1 } from "simple-flakeid"
import { v4 as uuidv4 } from "uuid"

export function getSnowId(): string {
  const gen = new SnowflakeIdv1({ workerId: 1 })
  const snowId = gen.NextId()
  return snowId.toString()
}

export function getUuid(): string {
  return uuidv4()
}
