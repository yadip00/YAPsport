export interface Product {
  id: string;
  name: string;
  category: 'jersey' | 'equipment';
  price: number;
  image: string;
  description: string;
  sizes?: string[]; // Optional sizes for jerseys, e.g., ['S', 'M', 'L', 'XL', 'XXL']
  stock: number;
  isFeatured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string; // If selected for a jersey
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  whatsappNumber: string; // WhatsApp number formatted with country code (e.g., 628123456789)
  address: string;
  shippingFee: number;
  currencySymbol: string;
  currencyCode: string;
  requireVisitorLogin?: boolean; // true = setiap klik link/produk wajib login, false = beranda bebas tanpa login
}

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  notes?: string;
  shippingMethod: string;
}

export interface Invoice {
  id: string;
  customer: CustomerDetails;
  items: {
    productId: string;
    productName: string;
    size?: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  totalPrice: number;
  shippingFee: number;
  grandTotal: number;
  createdAt: string;
  status: 'pending' | 'sent';
}
