import type { Operation } from './operation'
import prompts from 'prompts'
import { prerelease } from 'semver'

export type PublishConfig = Partial<{
  tag: string
  access: string
  provenance: boolean
  registry: string
}>

export async function resolvePublishTag(operation: Operation) {
  if (!operation.options.publishTag) {
    return
  }

  if (typeof operation.options.publishTag === 'string') {
    operation.update({
      publishTag: operation.options.publishTag,
    })
    return
  }

  const { newVersion } = operation.state
  const pre = prerelease(newVersion)
  const defaultTag = pre ? String(pre[0]) : 'latest'

  const response = await prompts({
    type: 'text',
    name: 'tag',
    message: 'Publish Tag',
    initial: defaultTag,
  })

  const { tag } = response

  if (tag) {
    operation.update({
      publishTag: tag,
    })
  }
}
