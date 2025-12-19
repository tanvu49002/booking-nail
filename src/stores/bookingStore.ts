import { useSyncExternalStore } from "react";
import { Employee, Service } from "@/types/catalog";

export type BookingStep = "schedule" | "info";

export interface BookingState {
  // Current step
  currentStep: BookingStep;
  
  // Step completion status
  completedSteps: BookingStep[];
  
  // Booking data
  selectedStaff: Employee | null;
  selectedServices: Service[];
  selectedDate: Date | null;
  selectedTime: string | null;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  servicesError?: string;
  
  // Actions
  setCurrentStep: (step: BookingStep) => void;
  completeStep: (step: BookingStep) => void;
  goToStep: (step: BookingStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  
  // Booking data actions
  setSelectedStaff: (staff: Employee | null) => void;
  setSelectedServices: (services: Service[]) => void;
  addService: (service: Service) => void;
  removeService: (serviceId: number) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: string | null) => void;
  setCustomerInfo: (info: Partial<BookingState['customerInfo']>) => void;
  
  // Validation actions
  validateCustomerInfo: () => boolean;
  validateServices: () => boolean;
  validateSchedule: () => boolean;
  clearServicesError: () => void;
  
  // Reset
  resetBooking: () => void;
}

const steps: BookingStep[] = ["schedule", "info"];

type Listener = () => void;

const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let state: BookingState;

function get() {
  return state;
}

function set(partial: Partial<BookingState> | ((prev: BookingState) => Partial<BookingState>)) {
  const patch = typeof partial === "function" ? partial(state) : partial;
  state = { ...state, ...patch };
  emitChange();
}

const initialState: Omit<
  BookingState,
  | "setCurrentStep"
  | "completeStep"
  | "goToStep"
  | "goToNextStep"
  | "goToPreviousStep"
  | "setSelectedStaff"
  | "setSelectedServices"
  | "addService"
  | "removeService"
  | "setSelectedDate"
  | "setSelectedTime"
  | "setCustomerInfo"
  | "validateCustomerInfo"
  | "validateServices"
  | "validateSchedule"
  | "clearServicesError"
  | "resetBooking"
> = {
  currentStep: "schedule",
  completedSteps: [],
  selectedStaff: null,
  selectedServices: [],
  selectedDate: null,
  selectedTime: null,
  customerInfo: {
    name: "",
    email: "",
    phone: "",
  },
};

state = {
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  completeStep: (step) => {
    const { completedSteps } = get();
    if (!completedSteps.includes(step)) {
      set({ completedSteps: [...completedSteps, step] });
    }
  },

  goToStep: (step) => {
    const { completedSteps } = get();
    const currentIndex = steps.indexOf(get().currentStep);
    const targetIndex = steps.indexOf(step);
    const previousStep = steps[targetIndex - 1];

    if (
      targetIndex <= currentIndex ||
      completedSteps.includes(step) ||
      (previousStep && completedSteps.includes(previousStep))
    ) {
      set({ currentStep: step });
    }
  },

  goToNextStep: () => {
    const { currentStep, completedSteps, validateServices, validateSchedule } = get();
    const currentIndex = steps.indexOf(currentStep);
    const nextStep = steps[currentIndex + 1];

    if (!nextStep) return;

    let canProceed = true;
    if (currentStep === "schedule") {
      canProceed = validateServices() && validateSchedule();
    }

    if (!canProceed) return;

    if (!completedSteps.includes(currentStep)) {
      set({
        completedSteps: [...completedSteps, currentStep],
        currentStep: nextStep,
      });
    } else {
      set({ currentStep: nextStep });
    }
  },

  goToPreviousStep: () => {
    const { currentStep } = get();
    const currentIndex = steps.indexOf(currentStep);
    const previousStep = steps[currentIndex - 1];

    if (previousStep) set({ currentStep: previousStep });
  },

  setSelectedStaff: (staff) => set({ selectedStaff: staff }),
  setSelectedServices: (services) => set({ selectedServices: services }),

  addService: (service) => {
    const { selectedServices } = get();
    const existingService = selectedServices.find((s) => s.id === service.id);
    if (!existingService) {
      set({ selectedServices: [...selectedServices, service], servicesError: undefined });
    }
  },

  removeService: (serviceId) => {
    const { selectedServices } = get();
    set({
      selectedServices: selectedServices.filter((service) => service.id !== serviceId),
    });
    get().validateServices();
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTime: (time) => set({ selectedTime: time }),

  setCustomerInfo: (info) => {
    const { customerInfo } = get();
    set({ customerInfo: { ...customerInfo, ...info } });
  },

  validateCustomerInfo: () => {
    const { customerInfo } = get();
    if (!customerInfo.name?.trim()) return false;
    if (!customerInfo.phone?.trim()) return false;

    if (customerInfo.email?.trim()) {
      const email = customerInfo.email.trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    return true;
  },

  validateServices: () => {
    const { selectedServices } = get();
    if (selectedServices.length === 0) {
      set({ servicesError: "Please select at least one service", completedSteps: [] });
      return false;
    }
    set({ servicesError: undefined });
    return true;
  },

  validateSchedule: () => {
    const { selectedDate, selectedTime } = get();
    return selectedDate !== null && selectedTime !== null;
  },

  clearServicesError: () => set({ servicesError: undefined }),

  resetBooking: () => set({ ...initialState, servicesError: undefined }),
};

export function useBookingStore() {
  return useSyncExternalStore(subscribe, get, get);
}
