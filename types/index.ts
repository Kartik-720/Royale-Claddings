export interface Product {
  id: string;
  code: string;
  category: string;
  colour: string;
  variant: string;
  mtrs: number;
  sqftPerPlank: number;
  boxes: number;
  loosePieces: string;
  totalPieces: number;
  totalSqft: number;
  newUpcoming: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string | null;
  description: string;
  planks: number;
  sqft: number;
  rate: number;
  amount: number;
  product?: Product | null;
}

export interface OrderItem {
  id: string;
  description: string;
  planks: number;
  sqft: number;
  rate: number;
  amount: number;
  productId: string | null;
  product?: Product | null;
}

export interface Order {
  id: string;
  piNumber: string;
  piType: "DELHI" | "OUTSIDE";
  billToName: string;
  billToAddress: string;
  shipToName: string;
  shipToAddress: string;
  customerGstin: string;
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  remarks: string;
  stockDeducted: boolean;
  createdAt: string;
  items: OrderItem[];
}

export type PIType = "DELHI" | "OUTSIDE";
