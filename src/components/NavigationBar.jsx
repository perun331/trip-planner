export default function NavigationBar({ currentStep, onPrev, onNext, canGoNext }) {
  const isLastStep = currentStep === 3
  const isFirstStep = currentStep === 0

  return (
    <div className="nav-bar">
      {!isFirstStep && !isLastStep && (
        <button className="btn btn-secondary" onClick={onPrev}>
          上一步
        </button>
      )}
      {isLastStep ? (
        <button className="btn btn-secondary" onClick={onPrev} style={{ flex: 1 }}>
          返回修改
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canGoNext}
          style={canGoNext === false ? { opacity: 0.4 } : {}}
        >
          {currentStep === 2 ? '生成行程' : '下一步'}
        </button>
      )}
    </div>
  )
}
