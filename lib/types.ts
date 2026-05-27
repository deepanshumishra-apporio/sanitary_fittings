export type Role = "CUSTOMER" | "ADMIN" | "SUBADMIN";
export type OrderStatus = "PLACED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children?: { id: string; name: string; description: string | null }[];
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount: number;
  stock: number;
  images: string[];
  videos: string[];
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string | null;
  totalPrice: number;
  discount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address: Address | null;
  payment: {
    id: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  discount: number;
  product: Pick<Product, "id" | "name" | "price" | "discount" | "images">;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface ProductVendorEntry {
  id: string;
  vendorId: string;
  productId: string;
  price: number;
  stock: number;
  sku: string | null;
  isActive: boolean;
  vendor: { id: string; name: string; email: string; phone: string | null };
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
