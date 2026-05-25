const steps = [
  { key: 'eat', label: '吃' },
  { key: 'go', label: '去' },
  { key: 'stay', label: '住' },
  { key: 'plan', label: '行程' },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="step-indicator">
      {steps.map((step, i) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="step-dot-wrap">
            <div
              className={
                'step-dot ' +
                (i < currentStep ? 'done' : i === currentStep ? 'current' : 'pending')
              }
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={'step-label' + (i === currentStep ? ' active' : '')}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={'step-line' + (i < currentStep ? ' done' : '')} />
          )}
        </div>
      ))}
    </div>
  )
}
