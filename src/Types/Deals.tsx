export interface DealData {
  deal_id: number;
  name: string;
  slug: string;
  description: string | null;
  terms_and_conditions: string | null;
  image_url: string | null;
  deal_type: string;
  deal_action_value: string;
  start_date: string;
  end_date: string | null;
  status: boolean;
  created_at: string;
  author_id: string;
  regular_price: number | null;
  sale_price: number | null;
  discount_text: string | null;
  small_description: string | null;
  dealImageURL: string | null;
  categories: DealCategory[];
  deal_website_url: string;
  is_featured?: boolean;
}

export interface DealSliceProp {
  filterToggle: boolean;
  productItem: DealData[];
  symbol: string;
}

export interface DealCategory {
  category_id: number;
  name: string;
  slug: string;
}
