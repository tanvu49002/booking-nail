"use client";

import { useEffect, useMemo, useState } from "react";
import { useBookingStore } from "@/stores/bookingStore";
import generalService from "@/services/general.service";
import dayjs from "dayjs";
import { Calendar as AntCalendar } from "antd";
import type {
  Employee,
  EmployeeResponse,
  Service,
  ServiceResponse,
} from "@/types/catalog";
import { toast } from "sonner";
import { Check, Clock, DollarSign, Sparkles, ChevronRight } from "lucide-react";

const WORKING_HOURS = { startTime: "09:00", endTime: "18:00" } as const;
const SLOT_STEP_MINUTES = 10;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ceilToStep(minutes: number, step: number): number {
  return Math.ceil(minutes / step) * step;
}

function toAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_CDN_URL || "";
  return `${base}${url}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMediaUrl(media: unknown): string | null {
  if (!media) return null;
  if (isRecord(media) && typeof media.url === "string") return media.url;

  if (isRecord(media) && isRecord(media.data) && isRecord(media.data.attributes) && typeof media.data.attributes.url === "string") {
    return media.data.attributes.url;
  }

  return null;
}

const StepDateTime = () => {
  const {
    goToNextStep,
    goToPreviousStep,
    completeStep,
    selectedStaff,
    setSelectedStaff,
    selectedDate,
    selectedTime,
    setSelectedDate,
    setSelectedTime,
    selectedServices,
    addService,
    removeService,
  } = useBookingStore();

  const [selectedDateLocal, setSelectedDateLocal] = useState<Date | undefined>(
    selectedDate || new Date()
  );
  const [selectedTimeLocal, setSelectedTimeLocal] = useState<
    string | undefined
  >(selectedTime || undefined);

  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServicePill, setSelectedServicePill] = useState<string>("all");

  useEffect(() => {
    setSelectedDate(new Date());
  }, [setSelectedDate]);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      setIsLoadingServices(true);
      try {
        const response = (await generalService.getServices({
          sort: "service_name:ASC",
        })) as ServiceResponse;
        if (!cancelled) setServices(response?.data ?? []);
      } finally {
        if (!cancelled) setIsLoadingServices(false);
      }
    }

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      setIsLoadingEmployees(true);
      try {
        const response = (await generalService.getEmployees({
          sort: "employee_name:ASC",
          populate: "employee_avatar",
        })) as EmployeeResponse;
        console.log("Loading employees", response);
        if (!cancelled) setEmployees(response?.data ?? []);
      } finally {
        if (!cancelled) setIsLoadingEmployees(false);
      }
    }

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!services.length || !selectedServices.length) return;
    const validServiceIds = new Set(services.map((s) => s.id));
    const staleSelected = selectedServices.filter((s) => !validServiceIds.has(s.id));
    if (staleSelected.length) {
      staleSelected.forEach((s) => removeService(s.id));
      toast.warning("Selected services were refreshed", {
        description: "Some previously selected services no longer exist and were removed.",
        duration: 4000,
      });
    }
  }, [removeService, selectedServices, services]);

  useEffect(() => {
    if (!employees.length || !selectedStaff) return;
    const exists = employees.some((e) => e.id === selectedStaff.id);
    if (!exists) {
      setSelectedStaff(null);
      toast.warning("Selected staff was refreshed", {
        description: "The selected staff no longer exists and was cleared.",
        duration: 4000,
      });
    }
  }, [employees, selectedStaff, setSelectedStaff]);

  const totalServiceMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.working_time || 0), 0);
  }, [selectedServices]);

  const isSelectedDateToday = useMemo(() => {
    if (!selectedDateLocal) return false;
    return dayjs(selectedDateLocal).isSame(dayjs(), "day");
  }, [selectedDateLocal]);

  const availableStartTime = useMemo(() => {
    if (!isSelectedDateToday) return WORKING_HOURS.startTime;
    return dayjs().format("HH:mm");
  }, [isSelectedDateToday]);

  const availableSlots = useMemo(() => {
    if (!selectedDateLocal) return [];
    if (!selectedServices.length) return [];

    const startBound = toMinutes(WORKING_HOURS.startTime);
    const endBound = toMinutes(WORKING_HOURS.endTime);

    const nowMinutes = isSelectedDateToday
      ? dayjs().hour() * 60 + dayjs().minute()
      : startBound;

    const start = Math.max(
      startBound,
      ceilToStep(nowMinutes, SLOT_STEP_MINUTES)
    );
    const duration = Math.max(0, totalServiceMinutes);

    const slots: Array<{ start: string; end: string }> = [];
    for (let t = start; t + duration <= endBound; t += SLOT_STEP_MINUTES) {
      slots.push({ start: toHHMM(t), end: toHHMM(t + duration) });
    }
    return slots;
  }, [
    isSelectedDateToday,
    selectedDateLocal,
    selectedServices.length,
    totalServiceMinutes,
  ]);

  useEffect(() => {
    if (!selectedTimeLocal) return;
    const ok = availableSlots.some((s) => s.start === selectedTimeLocal);
    if (!ok) {
      setSelectedTimeLocal(undefined);
      setSelectedTime(null);
    }
  }, [availableSlots, selectedTimeLocal, setSelectedTime]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDateLocal(date);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTimeLocal(time);
    setSelectedTime(time);
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) removeService(service.id);
    else addService(service);
  };

  const handleContinue = () => {
    if (!selectedServices.length) {
      toast.error("Please select at least one service.");
      return;
    }
    if (selectedDateLocal && selectedTimeLocal) {
      completeStep("schedule");
      goToNextStep();
    }
  };

  const handleBack = () => {
    goToPreviousStep();
  };

  const isFormValid = Boolean(
    selectedServices.length && selectedDateLocal && selectedTimeLocal
  );

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return services.filter((s) => {
      const name = (s.service_name || "").trim();
      const matchesPill =
        selectedServicePill === "all"
          ? true
          : name.toLowerCase() === selectedServicePill.toLowerCase();

      const matchesSearch = q ? name.toLowerCase().includes(q) : true;
      return matchesPill && matchesSearch;
    });
  }, [searchTerm, services, selectedServicePill]);

  const servicePills = useMemo(() => {
    const names = services
      .map((s) => (s.service_name || "").trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(names));
    uniq.sort((a, b) => a.localeCompare(b));
    return uniq;
  }, [services]);

  const formatDuration = (minutes?: number) => {
    if (!minutes || minutes <= 0) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h${mins ? ` ${mins}m` : ""}`;
    return `${mins}m`;
  };

  const formatPrice = (price?: number) => {
    if (typeof price !== "number") return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.service_price || 0), 0);
  }, [selectedServices]);

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in relative">
      <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-64 max-w-6xl rounded-[48px] bg-linear-to-r from-[#fff1da]/70 via-white/60 to-[#f5d7c2]/70 blur-3xl" />
      <div className="max-w-5xl mx-auto mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-linear-to-r from-[#fff3e1] via-white to-[#f0d8b8] p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#f4c97a]/40 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-36 w-36 rounded-full bg-[#e8a07a]/30 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/80">
              <img
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='none'><rect x='16' y='6' width='16' height='10' rx='2' fill='%23c38b54'/><rect x='14' y='16' width='20' height='20' rx='4' fill='%23dba357'/><rect x='18' y='18' width='12' height='14' rx='2' fill='%23f4c97a'/><rect x='20' y='0' width='8' height='8' rx='2' fill='%237b5a3a'/></svg>"
                alt="Nail polish"
                className="h-7 w-7"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Nail studio booking
              </p>
              <h2 className="text-xl font-medium text-foreground">
                Choose your manicure, polish, and artist
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#dba357]" />
              <span className="inline-flex h-3 w-3 rounded-full bg-[#e8a07a]" />
              <span className="inline-flex h-3 w-3 rounded-full bg-[#f4c97a]" />
              <span className="inline-flex h-3 w-3 rounded-full bg-[#c38b54]" />
              Polish palette
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mb-12 text-center relative">
        <div className="pointer-events-none absolute -top-6 left-1/2 h-40 w-130 -translate-x-1/2 rounded-full bg-linear-to-r from-[#f7d9b6]/40 via-[#f3e7d7]/20 to-[#f0c9b6]/30 blur-3xl" />
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4 text-pretty">
          Book Your Experience
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Choose your services and preferred time for a personalized spa
          experience
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative">
        <div className="absolute -top-10 right-2 hidden h-24 w-24 rotate-12 rounded-2xl border border-black/10 bg-linear-to-br from-[#f4c97a]/50 to-white shadow-lg md:flex items-center justify-center">
          <img
            src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56' fill='none'><rect x='16' y='8' width='24' height='12' rx='3' fill='%23c38b54'/><rect x='14' y='20' width='28' height='24' rx='6' fill='%23dba357'/><rect x='19' y='22' width='18' height='16' rx='3' fill='%23f4c97a'/><rect x='22' y='4' width='12' height='8' rx='2' fill='%237b5a3a'/></svg>"
            alt="Nail polish"
            className="h-10 w-10"
          />
        </div>
        <section className="animate-scale-in">
          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-tight text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Select Services
            </h2>
            <p className="text-muted-foreground">Choose one or more services</p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setSelectedServicePill("all")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                selectedServicePill === "all"
                  ? "bg-linear-to-r from-[#f6e4cf] to-[#f9efe3] text-foreground shadow-md border border-[#e4c8ab]"
                  : "bg-linear-to-r from-[#fff1e1] to-[#fff7ef] text-foreground border border-[#e6d2bf] hover:from-[#f6e4cf] hover:to-[#f9efe3] hover:border-[#e4c8ab]"
              }`}
            >
              All Services
            </button>
            {servicePills.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedServicePill(name)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedServicePill.toLowerCase() === name.toLowerCase()
                    ? "bg-linear-to-r from-[#f6e4cf] to-[#f9efe3] text-foreground shadow-md border border-[#e4c8ab]"
                    : "bg-linear-to-r from-[#fff1e1] to-[#fff7ef] text-foreground border border-[#e6d2bf] hover:from-[#f6e4cf] hover:to-[#f9efe3] hover:border-[#e4c8ab]"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Service Grid */}
          {isLoadingServices ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No services available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => {
                const isSelected = selectedServices.some(
                  (s) => s.id === service.id
                );
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`group relative text-left p-6 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? "bg-green-50 border-green-500 shadow-xl scale-[1.02]"
                        : "bg-card hover:bg-green-50 border-black/20 hover:border-green-500 hover:shadow-lg"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-background text-foreground rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg font-medium mb-3 pr-8 text-foreground">
                      {service.service_name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {formatPrice(service.service_price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(service.working_time)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Summary */}
          {selectedServices.length > 0 && (
            <div className="mt-6 p-6 bg-card rounded-2xl border border-black/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedServices.length} service
                    {selectedServices.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-2xl font-light text-foreground">
                    {formatPrice(totalPrice)}
                    <span className="text-sm text-muted-foreground ml-2">
                      · {formatDuration(totalServiceMinutes)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                  onClick={() => {
                    selectedServices.forEach((s) => removeService(s.id));
                    toast.info("Services cleared");
                  }}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="animate-scale-in">
          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
              Choose Your Specialist
            </h2>
            <p className="text-muted-foreground">
              Optional: Select a preferred staff member
            </p>
          </div>

          {isLoadingEmployees ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Any Staff Option */}
              <button
                onClick={() => setSelectedStaff(null)}
                className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                  !selectedStaff
                    ? "bg-green-50 text-foreground border-green-500 shadow-lg"
                    : "bg-card hover:bg-green-50 border-black/20 hover:border-green-500"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                    !selectedStaff
                      ? "bg-background text-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-center text-foreground">
                  Any Staff
                </span>
              </button>

              {employees.map((staff) => {
                const avatarUrl = getMediaUrl(staff.employee_avatar);
                const isSelected = selectedStaff?.id === staff.id;
                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-green-50 text-foreground border-green-500 shadow-lg"
                        : "bg-card hover:bg-green-50 border-black/20 hover:border-green-500"
                    }`}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={toAbsoluteUrl(avatarUrl) || "/placeholder.svg"}
                        alt={staff.employee_name}
                        className="w-16 h-16 rounded-full object-cover mb-3"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium mb-3 ${
                          isSelected
                            ? "bg-background text-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {staff.employee_name?.[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-center text-foreground">
                      {staff.employee_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-scale-in">
          {/* Date Selection */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
                Select Date
              </h2>
              <p className="text-muted-foreground">
                Choose your appointment date
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-black/20 p-6">
              <AntCalendar
                fullscreen={false}
                value={selectedDateLocal ? dayjs(selectedDateLocal) : dayjs()}
                onSelect={(value) => handleDateSelect(value.toDate())}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf("day");
                }}
                className="elegant-calendar"
                mode="month"
                headerRender={({ value, onChange }) => {
                  const year = value.year();
                  const month = value.month();
                  const years = Array.from({ length: 7 }, (_, i) => year - 3 + i);
                  const months = Array.from({ length: 12 }, (_, i) => i);

                  return (
                    <div className="mb-4 flex items-center justify-end gap-2 text-sm text-foreground">
                      <select
                        className="rounded-lg border border-[#e4c8ab] bg-[#fff1e1] px-2 py-1"
                        aria-label="Select year"
                        value={year}
                        onChange={(event) =>
                          onChange(value.clone().year(Number(event.target.value)))
                        }
                      >
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <select
                        className="rounded-lg border border-[#e4c8ab] bg-[#fff1e1] px-2 py-1"
                        aria-label="Select month"
                        value={month}
                        onChange={(event) =>
                          onChange(value.clone().month(Number(event.target.value)))
                        }
                      >
                        {months.map((m) => (
                          <option key={m} value={m}>
                            {dayjs().month(m).format("MMM")}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }}
              />
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
                Select Time
              </h2>
              <p className="text-muted-foreground">
                {selectedServices.length > 0
                  ? `Duration: ${formatDuration(totalServiceMinutes)}`
                  : "Please select services first"}
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-black/20 p-6">
              {selectedServices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select services to see available times</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No available times for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-100 overflow-y-auto pr-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTimeLocal === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => handleTimeSelect(slot.start)}
                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-green-50 text-foreground shadow-md border border-green-500"
                            : "bg-muted hover:bg-green-50 text-foreground border border-black/20 hover:border-green-500"
                        }`}
                      >
                        {dayjs(`2000-01-01T${slot.start}`).format("h:mm A")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center pt-8 border-t border-black/20">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-full  hover:shadow-md hover:-translate-y-0.5 transition-all border border-black/20"
          >
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!isFormValid}
            className={`group flex items-center border border-black/20 gap-2 px-8 py-3 rounded-full font-medium transition-all ${
              isFormValid
                ? "bg-primary text-primary-foreground hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Continue
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepDateTime;
