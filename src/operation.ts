import type { NormalizedOptions } from './normalize-options'
import { normalizeOptions } from './normalize-options'
import type { ReleaseType } from './release-type'
import type { VersionBumpOptions } from './types/version-bump-options'
import type { NpmScript, ProgressEvent, VersionBumpProgress } from './types/version-bump-progress'
import type { VersionBumpResults } from './types/version-bump-results'

type ProgressCallback = (progress: VersionBumpProgress) => void

interface OperationState {
  release: ReleaseType | undefined
  oldVersionSource: string
  oldVersion: string
  newVersion: string
  commitMessage: string
  tagName: string
  updatedFiles: string[]
  skippedFiles: string[]
}

interface UpdateOperationState extends Partial<OperationState> {
  event?: ProgressEvent
  script?: NpmScript
}

/**
 * All of the inputs, outputs, and state of a single `versionBump()` call.
 */
export class Operation {
  /**
   * The options for this operation.
   */
  public options: NormalizedOptions

  /**
   * The current state of the operation.
   */
  public readonly state: Readonly<OperationState> = {
    release: undefined,
    oldVersion: '',
    oldVersionSource: '',
    newVersion: '',
    commitMessage: '',
    tagName: '',
    updatedFiles: [],
    skippedFiles: [],
  }

  /**
   * The results of the operation.
   */
  public get results(): VersionBumpResults {
    const options = this.options
    const state = this.state

    return {
      release: state.release,
      oldVersion: state.oldVersion,
      newVersion: state.newVersion,
      commit: options.commit ? state.commitMessage : false,
      tag: options.tag ? state.tagName : false,
      updatedFiles: state.updatedFiles.slice(),
      skippedFiles: state.skippedFiles.slice(),
    }
  }

  /**
   * The callback that's used to report the progress of the operation.
   */
  private readonly _progress?: ProgressCallback

  /**
   * Private constructor.  Use the `Operation.start()` static method instead.
   */
  private constructor(options: NormalizedOptions, progress?: ProgressCallback) {
    this.options = options
    this._progress = progress
  }

  /**
   * Starts a new `versionBump()` operation.
   */
  public static async start(input: VersionBumpOptions): Promise<Operation> {
    // Validate and normalize the options
    const options = await normalizeOptions(input)

    return new Operation(options, input.progress)
  }

  /**
   * Updates the operation state and results, and reports the updated progress to the user.
   */
  public update({ event, script, ...newState }: UpdateOperationState): this {
    // Update the operation state
    Object.assign(this.state, newState)

    if (event && this._progress) {
      // Report the progress to the user
      this._progress({ event, script, ...this.results })
    }

    return this
  }
}
