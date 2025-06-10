export interface HvacOrders {
  order_date?: string | null;
  order_id: string;
  order_status: string;
  user_id: string;
  users?: {
    first_name?: string;
    last_name?: string;
    user_email?: string;
  };
  orderItems?: OrderItem[];
  subscription_id?: string;
  productsData?: ProductItem[];
}

interface ProductItem {
  name?: string;
  product_parent?: number;
  product_type?: string;
  slug?: string;
}

interface OrderItem {
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
}

export interface HvacSubscription {
  subscription_id?: number;
  user_id?: string;
  product_id?: number;
  start_date?: string;
  end_date?: string | null;
  next_order_date?: string;
  frequency?: string;
  subscription_status?: string;
  created_at?: string;
  banquest_recurring_schedule_id?: number;
  amount?: number;
  variant_id?: number;
  users?: {
    first_name?: string;
    last_name?: string;
    user_email?: string;
  };
}
