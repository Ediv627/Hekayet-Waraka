export interface Category {
  id: string;
  name: string;
  image_url?: string;
  display_order: number;
  has_offer: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  image: string;
  description?: string;
  categoryId?: string;
  discount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'cod' | 'vodafone_cash';

export interface DeliveryAddress {
  governorate: string;
  city: string;
  fullAddress: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  transferImageUrl?: string;
  vodafoneCashNumber?: string;
}

export interface OrderDetails {
  customerName: string;
  phone: string;
  deliveryAddress: DeliveryAddress;
  payment: PaymentDetails;
  items: CartItem[];
  total: number;
}
