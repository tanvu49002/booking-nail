"use client";

import { useState, useCallback } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import BookingConfirmation from "./BookingConfirmation";
import generalService from "@/services/general.service";
import CongratulationPopup from "@/components/modules/CongratulationPopup";
import type { BookingCreateResponse, CustomerResponse } from "@/types/booking";
import { toast } from "sonner";
import dayjs from "dayjs";
import {
  User,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

const StepCustomerInfo = () => {
  const {
    goToPreviousStep,
    customerInfo,
    setCustomerInfo,
    validateCustomerInfo,
    selectedStaff,
    selectedServices,
    selectedDate,
    selectedTime,
    validateServices,
    validateSchedule,
  } = useBookingStore();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDataConfirm, setBookingDataConfirm] =
    useState<BookingCreateResponse | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  const lookupCustomerByPhone = useCallback(
    async (phone: string) => {
      if (!phone || phone.length < 7) return;

      setIsLoadingCustomer(true);
      try {
        const response: CustomerResponse =
          await generalService.getCustomerByPhone({
            "filters[customer_phone][$eq]": phone,
          });

        if (response.data && response.data.length > 0) {
          const customer = response.data[0];
          setCustomerInfo({
            name: customer.customer_name || "",
            email: customer.customer_email || "",
          });
          setCustomerFound(true);
        } else {
          setCustomerFound(false);
        }
      } catch (error) {
        // Handle error gracefully without console logs
      } finally {
        setIsLoadingCustomer(false);
      }
    },
    [setCustomerInfo]
  );

  const handlePhoneChange = useCallback(
    (phone: string) => {
      setCustomerInfo({ phone });
      setCustomerFound(false);
      if (phone && phone.length >= 7) lookupCustomerByPhone(phone);
    },
    [setCustomerInfo, lookupCustomerByPhone]
  );

  const handleContinue = () => {
    const isCustomerInfoValid = validateCustomerInfo();
    if (!isCustomerInfoValid) {
      toast.error("Please fill in required fields.", {
        description:
          "Name and phone are required (email must be valid if provided).",
        duration: 4000,
      });
      return;
    }
    const isServicesValid = validateServices();
    const isScheduleValid = validateSchedule();
    if (isCustomerInfoValid && isServicesValid && isScheduleValid) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      if (!selectedDate || !selectedTime) {
        toast.error("Please select date and time first.");
        return;
      }

      if (selectedStaff && !selectedStaff.documentId) {
        toast.error(
          "Selected staff is missing documentId. Please re-select staff."
        );
        return;
      }

      const missingServiceDocId = selectedServices.find((s) => !s.documentId);
      if (missingServiceDocId) {
        toast.error(
          "Selected service is missing documentId. Please re-select services."
        );
        return;
      }

      const serviceDocumentIds = selectedServices.map(
        (service) => service.documentId
      );
      const staffDocumentId = selectedStaff?.documentId || null;

      setIsCreatingBooking(true);

      const bookingPayload = {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email || null,
        customerPhone: customerInfo.phone,
        bookingDate: dayjs(selectedDate).format("YYYY-MM-DD"),
        bookingTime: selectedTime + ":00",
        bookingNote: "",
        employeeId: staffDocumentId,
        serviceId: serviceDocumentIds,
      };

      const response: unknown = await generalService.createBooking({
        data: bookingPayload,
      });

      const isRecord = (value: unknown): value is Record<string, unknown> =>
        typeof value === "object" && value !== null;

      const asBooking = (
        value: unknown
      ): BookingCreateResponse["data"] | null => {
        if (!isRecord(value)) return null;
        if (typeof value.id !== "number") return null;
        if (typeof value.name !== "string") return null;
        if (!(value.email === null || typeof value.email === "string"))
          return null;
        if (typeof value.phone !== "string") return null;
        if (typeof value.booking_date !== "string") return null;
        if (typeof value.booking_time !== "string") return null;
        if (
          !(value.booking_end === null || typeof value.booking_end === "string")
        )
          return null;
        if (
          !(
            value.booking_status === null ||
            typeof value.booking_status === "string"
          )
        )
          return null;
        if (
          !(
            value.booking_code === null ||
            typeof value.booking_code === "string"
          )
        )
          return null;
        return value as unknown as BookingCreateResponse["data"];
      };

      const normalizeBookingCreateResponse = (
        raw: unknown
      ): BookingCreateResponse | null => {
        if (!isRecord(raw)) return null;

        const direct = asBooking(raw.data);
        if (direct) {
          return { data: direct };
        }

        if (isRecord(raw.data)) {
          const nested = asBooking(raw.data.data);
          if (nested) {
            return { data: nested };
          }
          const nestedBooking = asBooking(raw.data.booking);
          if (nestedBooking) {
            return { data: nestedBooking };
          }
        }

        const booking = asBooking(raw.booking);
        if (booking) {
          return { data: booking };
        }

        const rawAsBooking = asBooking(raw);
        if (rawAsBooking) {
          return { data: rawAsBooking };
        }

        return null;
      };

      const bookingResponse =
        normalizeBookingCreateResponse(response) ??
        ({
          data: {
            id: 0,
            name: bookingPayload.customerName,
            email: bookingPayload.customerEmail,
            phone: bookingPayload.customerPhone,
            note: null,
            booking_date: bookingPayload.bookingDate,
            booking_time: bookingPayload.bookingTime,
            booking_end: null,
            booking_status: "waiting for approve",
            booking_code: null,
          },
        } satisfies BookingCreateResponse);

      setBookingDataConfirm(bookingResponse);
      setBookingSuccess(true);
      setShowConfirmation(false);

      toast.success("Booking created successfully!", {
        description: `Your booking code: ${
          bookingResponse.data.booking_code || "N/A"
        }`,
        duration: 5000,
      });
    } catch (error) {
      toast.error("Failed to book appointment. Please try again.", {
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your booking.",
        duration: 5000,
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof customerInfo,
    value: string
  ) => {
    setCustomerInfo({ [field]: value });
    if ((field === "name" || field === "email") && customerFound)
      setCustomerFound(false);
  };

  const isFormValid =
    customerInfo.name &&
    customerInfo.phone &&
    selectedServices.length > 0 &&
    Boolean(selectedDate && selectedTime);

  if (bookingSuccess) {
    return (
      <CongratulationPopup
        setBookingSuccess={setBookingSuccess}
        bookingData={bookingDataConfirm}
      />
    );
  }

  if (showConfirmation) {
    return (
      <BookingConfirmation
        onConfirm={handleConfirmBooking}
        onBack={() => setShowConfirmation(false)}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isCreatingBooking}
      />
    );
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
          Your Information
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Please provide your contact details to complete your booking
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="space-y-6 mb-8">
          {/* Phone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Phone className="w-4 h-4" />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-black/20 bg-card"
                placeholder="(555) 123-4567"
              />
              {isLoadingCustomer && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll check if you&apos;re already in our system
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full px-4 py-3.5 rounded-xl border bg-card border-black/20`}
              placeholder="John Doe"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`w-full px-4 py-3.5 rounded-xl border bg-card border-black/20`}
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-black/20">
          <button
            onClick={goToPreviousStep}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-black/20 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!isFormValid}
            className={`group flex items-center gap-2 px-8 py-3 rounded-full border border-black/20 font-medium transition-all ${
              isFormValid
                ? "bg-primary text-primary-foreground hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Complete Booking
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepCustomerInfo;
