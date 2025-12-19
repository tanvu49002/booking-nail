"use client"

import { useBookingStore } from "@/stores/bookingStore"
import StepDateTime from "./StepDateTime"
import StepCustomerInfo from "./StepCustomerInfo"

export default function StepBookingContainer() {
  const { currentStep } = useBookingStore()

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "schedule":
        return <StepDateTime />
      case "info":
        return <StepCustomerInfo />
      default:
        return <StepDateTime />
    }
  }

  return <div className="min-h-screen w-full bg-background">{renderCurrentStep()}</div>
}
