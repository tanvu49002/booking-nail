export interface Booking {
  id: number;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;

  name: string;
  email: string | null;
  phone: string;
  note: string | null;

  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:mm:ss
  booking_end: string | null; // HH:mm:ss

  booking_status: "waiting_approve" | "approved" | "reject" | "complete" | null;
  booking_code: string | null;
}

export interface BookingCreateResponse {
  data: Booking;
  meta?: unknown;
}

export interface CustomerAttributes {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Customer {
  id: number;
  attributes: CustomerAttributes;
}

export interface CustomerResponse {
  data: Customer[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
