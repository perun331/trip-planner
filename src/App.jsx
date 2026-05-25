import { TripProvider, useTrip } from './context/TripContext.jsx'
import Header from './components/Header.jsx'
import StepIndicator from './components/StepIndicator.jsx'
import NavigationBar from './components/NavigationBar.jsx'
import EatStep from './steps/EatStep.jsx'
import GoStep from './steps/GoStep.jsx'
import StayStep from './steps/StayStep.jsx'
import Itinerary from './steps/Itinerary.jsx'

const STEP_LABELS = ['吃什么', '去哪里', '住哪里', '我的行程']

function StepContent() {
  const { data } = useTrip()

  switch (data.currentStep) {
    case 0:
      return <EatStep />
    case 1:
      return <GoStep />
    case 2:
      return <StayStep />
    case 3:
      return <Itinerary />
    default:
      return null
  }
}

function canProceed(data) {
  switch (data.currentStep) {
    case 0:
      return data.selectedRestaurants.length > 0
    case 1:
      return data.destinations.length > 0
    case 2:
      return data.selectedHotel !== null
    default:
      return true
  }
}

function AppInner() {
  const { data, nextStep, prevStep } = useTrip()

  return (
    <>
      <Header />
      <StepIndicator currentStep={data.currentStep} />
      <StepContent />
      <NavigationBar
        currentStep={data.currentStep}
        onPrev={prevStep}
        onNext={nextStep}
        canGoNext={canProceed(data)}
      />
    </>
  )
}

export default function App() {
  return (
    <TripProvider>
      <AppInner />
    </TripProvider>
  )
}
