// ============================================
// Standard API Response Wrapper
// ============================================
export class ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };

  static success<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
    return { success: true, data, error: null, meta };
  }

  static error(message: string): ApiResponse {
    return { success: false, data: null, error: message };
  }

  static paginated<T>(data: T[], total: number, page: number, limit: number): ApiResponse<T[]> {
    return {
      success: true,
      data,
      error: null,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

// ============================================
// Page Options
// ============================================
export interface PageOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Pagination Helper
// ============================================
export function paginate<T>(data: T[], total: number, options: PageOptions): { data: T[]; meta: PageMeta } {
  return {
    data,
    meta: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit),
    },
  };
}

// ============================================
// UUID Generator
// ============================================
import { v4 as uuidv4 } from 'uuid';
export const generateUUID = (): string => uuidv4();