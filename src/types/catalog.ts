export interface StrapiMediaAttributes {
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: unknown;
}

// Strapi v5 returns relations flattened by default; media can be either an object or null.
export type StrapiMedia =
  | {
      id: number;
      documentId?: string;
      url: string;
      alternativeText?: string | null;
      caption?: string | null;
      width?: number | null;
      height?: number | null;
      formats?: unknown;
    }
  | {
      data: {
        id: number;
        attributes: StrapiMediaAttributes;
      } | null;
    }
  | null;

export interface Service {
  id: number;
  documentId?: string;
  service_name: string;
  service_price: number;
  working_time: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface ServiceResponse {
  data: Service[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface Employee {
  id: number;
  documentId?: string;
  employee_name: string;
  employee_phone: string;
  employee_email: string;
  employee_avatar?: StrapiMedia;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface EmployeeResponse {
  data: Employee[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
