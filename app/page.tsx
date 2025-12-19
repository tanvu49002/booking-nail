"use client";
import StepBookingContainer from "../src/components/modules/step-booking/StepBookingContainer";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background">
      <main className="p-4 md:p-6 lg:p-8 bg-background">
        <div className="w-full max-w-6xl mx-auto">
          <StepBookingContainer />
        </div>
      </main>
    </div>
  );
}
