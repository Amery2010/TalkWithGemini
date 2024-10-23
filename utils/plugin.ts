import { entries } from 'lodash-es'

export function findOperationById(plugin: OpenAPIDocument, id: string) {
  for (const [path, operations] of entries(plugin.paths)) {
    for (const [method, operation] of entries(operations) as [string, OpenAPIOperation][]) {
      if (operation?.operationId === id) {
        return { ...operation, path, method }
      }
    }
  }
}
