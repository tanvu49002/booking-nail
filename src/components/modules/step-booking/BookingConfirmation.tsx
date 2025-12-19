"use client"

import type React from "react"
import { useBookingStore } from "@/stores/bookingStore"
import dayjs from "dayjs"
import { User, Calendar, Sparkles, ChevronLeft, Check } from "lucide-react"

interface BookingConfirmationProps {
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
  isLoading?: boolean
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  onConfirm,
  onBack,
  onCancel,
  isLoading = false,
}) => {
  const { selectedStaff, selectedServices, selectedDate, selectedTime, customerInfo } = useBookingStore()

  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.service_price || 0), 0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">Confirm Your Booking</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Please review your booking details before confirming
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-4 mb-8">
          {/* Customer Information */}
          <div className="bg-card rounded-2xl border border-black/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground font-medium">{customerInfo.name}</span>
              </div>
              {customerInfo.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground font-medium">{customerInfo.email}</span>
                </div>
              )}
              {customerInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground font-medium">{customerInfo.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-card rounded-2xl border border-black/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">Appointment Time</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground font-medium">{dayjs(selectedDate).format("dddd, MMMM D, YYYY")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground font-medium">{selectedTime}</span>
              </div>
            </div>
          </div>

          {/* Staff Information */}
          {selectedStaff && (
            <div className="bg-card rounded-2xl border border-black/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground">Your Specialist</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">{selectedStaff.employee_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Services */}
          <div className="bg-card rounded-2xl border border-black/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">Selected Services</h3>
            </div>
            <div className="space-y-3">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between items-center">
                  <span className="text-foreground">{service.service_name}</span>
                  <span className="font-medium text-foreground">{formatPrice(service.service_price || 0)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-black/20">
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-medium">Total</span>
                  <span className="text-2xl font-light text-foreground">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-black/20">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-foreground hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all border border-black/20 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 rounded-full text-muted-foreground hover:bg-muted hover:shadow-md hover:-translate-y-0.5 transition-all border border-black/20 disabled:opacity-40 disabled:hover:shadow-none disabled:hover:translate-y-0"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-foreground border border-black/20 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:shadow-none disabled:hover:scale-100 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation
