import type { OpenAPI, OpenAPIV3_1 } from 'openapi-types'
import { entries } from 'lodash-es'

export function findOperationById(plugin: OpenAPIV3_1.Document, id: string) {
  for (const [path, operations] of entries(plugin.paths)) {
    for (const [method, operation] of entries(operations) as [string, OpenAPI.Operation][]) {
      if (operation?.operationId === id) {
        return { ...operation, path, method }
      }
    }
  }
}
