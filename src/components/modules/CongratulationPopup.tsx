"use client"

import type React from "react"

import type { BookingCreateResponse } from "@/types/booking"
import dayjs from "dayjs"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { Dispatch } from "react"
import { useBookingStore } from "@/stores/bookingStore"

export default function CongratulationPopup({
  setBookingSuccess,
  bookingData,
}: {
  setBookingSuccess: Dispatch<React.SetStateAction<boolean>>
  bookingData: BookingCreateResponse | null
}) {
  const { resetBooking, selectedServices, selectedStaff, selectedDate, selectedTime, customerInfo } = useBookingStore()

  const attributes = bookingData?.data
  const bookingDate = attributes?.booking_date ?? (selectedDate ? dayjs(selectedDate).format("YYYY-MM-DD") : null)
  const bookingTime = attributes?.booking_time ?? (selectedTime ? `${selectedTime}:00` : null)

  const getStatusBadge = (status?: string | null) => {
    if (!status) return null
    const statusConfig = {
      "waiting for approve": {
        label: "Waiting Approval",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-3.5 h-3.5" />,
      },
      approved: {
        label: "Approved",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
      reject: {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="w-3.5 h-3.5" />,
      },
      complete: {
        label: "Completed",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    return (
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${config.className}`}
      >
        {config.icon} {config.label}
      </span>
    )
  }

  const displayName = attributes?.name || customerInfo.name
  const displayPhone = attributes?.phone || customerInfo.phone
  const displayCode = attributes?.booking_code ?? null

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">Booking Confirmed</h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          Your appointment has been successfully submitted
        </p>
        {displayCode && (
          <div className="inline-block bg-card border border-black/20 rounded-full px-6 py-2">
            <span className="text-sm text-muted-foreground">Booking Code:</span>
            <span className="ml-2 text-lg font-medium text-foreground">{displayCode}</span>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">{getStatusBadge(attributes?.booking_status)}</div>

        <div className="bg-card rounded-2xl border border-black/20 p-8 mb-6">
          <h2 className="text-xl font-medium text-foreground mb-6">Appointment Details</h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <User className="w-5 h-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Name</p>
                <p className="text-foreground font-medium">{displayName}</p>
              </div>
            </div>

            {displayPhone && (
              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="text-foreground font-medium">{displayPhone}</p>
                </div>
              </div>
            )}

            {bookingDate && bookingTime && (
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                  <p className="text-foreground font-medium">
                    {dayjs(bookingDate).format("dddd, MMMM D, YYYY")} at {dayjs(`2000-01-01T${bookingTime}`).format("h:mm A")}
                    {attributes?.booking_end && attributes.booking_end !== "00:00:00" && (
                      <> - {dayjs(`2000-01-01T${attributes.booking_end}`).format("h:mm A")}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <Sparkles className="w-5 h-5 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Services</p>
                <ul className="space-y-1">
                  {selectedServices.length > 0 ? (
                    selectedServices.map((svc) => (
                      <li key={svc.id} className="text-foreground font-medium">
                        {svc.service_name}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">Service information not available</li>
                  )}
                </ul>
              </div>
            </div>

            {selectedStaff && (
              <div className="flex items-start gap-4">
                <User className="w-5 h-5 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Specialist</p>
                  <p className="text-foreground font-medium">{selectedStaff.employee_name}</p>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="bg-muted/50 border border-black/20 rounded-2xl p-6 mb-8">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Important:</strong> Please arrive 10 minutes before your appointment. If you need to cancel or
            reschedule, please give us at least 24 hours notice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => {
              setBookingSuccess(false)
              resetBooking()
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-foreground hover:bg-muted transition-all border border-black/20 font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    </div>
  )
}
