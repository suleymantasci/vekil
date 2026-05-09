// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  organizationId: string;
  roleId: string;
  roleName: string;
  apartmentId?: string;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}

// Building Types
export interface Building {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  totalFloors: number;
  totalApartments: number;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Apartment Types
export interface Apartment {
  id: string;
  buildingId: string;
  number: string;
  floor: number;
  block?: string;
  areaM2: number;
  shareRatio: number;
  type: 'residential' | 'commercial';
  isActive: boolean;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}