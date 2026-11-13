import type { Ref } from 'react'

interface TaskPromptProps {
  targetName: string
  message: string
  isReady: boolean
  onInspect: () => void
  inspectButtonRef?: Ref<HTMLButtonElement>
}

export function TaskPrompt({ targetName, message, isReady, onInspect, inspectButtonRef }: TaskPromptProps) {
  return (
    <section className={`task-prompt ${isReady ? 'task-prompt--ready' : ''}`} aria-labelledby="task-prompt-title">
      <span className="task-prompt__beacon" aria-hidden="true">⌖</span>
      <div className="task-prompt__copy">
        <span className="section-kicker">{isReady ? 'TASK READY' : 'CURRENT TARGET'}</span>
        <h2 id="task-prompt-title">{isReady ? 'Choose an engineering response' : `Inspect ${targetName}`}</h2>
        <p aria-live="polite">{message}</p>
      </div>
      {!isReady && (
        <button ref={inspectButtonRef} type="button" className="task-prompt__action" onClick={onInspect}>
          <kbd>E</kbd>
          <span><strong>Inspect system</strong><small>Accessible interaction</small></span>
        </button>
      )}
    </section>
  )
}
