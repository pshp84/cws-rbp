interface User {
  first_name: string;
  last_name: string;
  user_email: string;
}

interface ConversionRate {
  amount: number;
  points: number;
  roundingMode: string;
}

interface Balances {
  available: number;
  current: number;
  iso_currency_code: string;
  limit: number | null;
  unofficial_currency_code: string | null;
}

interface Account {
  account_id: string;
  balances: Balances;
  mask: string;
  name: string;
  official_name: string;
  persistent_account_id: string;
  subtype: string;
  type: string;
}

export interface ReferenceData {
  account_data: Account;
  account_id: string;
  account_owner: string | null;
  amount: number;
  authorized_date: string;
  authorized_datetime: string | null;
  category: string[];
  category_id: string;
  check_number: string | null;
  counterparties: Array<{
    confidence_level: string;
    entity_id: string;
    logo_url: string;
    name: string;
    phone_number: string | null;
    type: string;
    website: string;
  }>;
  date: string;
  datetime: string | null;
  iso_currency_code: string;
  location: {
    address: string | null;
    city: string | null;
    country: string | null;
    lat: number | null;
    lon: number | null;
    postal_code: string | null;
    region: string | null;
    store_number: string | null;
  };
  logo_url: string;
  merchant_entity_id: string;
  merchant_name: string;
  name: string;
  payment_channel: string;
  payment_meta: {
    by_order_of: string | null;
    payee: string | null;
    payer: string | null;
    payment_method: string | null;
    payment_processor: string | null;
    ppd_id: string | null;
    reason: string | null;
    reference_number: string | null;
  };
  pending: boolean;
  pending_transaction_id: string | null;
  personal_finance_category: {
    confidence_level: string;
    detailed: string;
    primary: string;
  };
  personal_finance_category_icon_url: string;
  transaction_code: string | null;
  transaction_id: string;
  transaction_type: string;
  unofficial_currency_code: string | null;
  website: string;
}

// export interface RewardTransaction {
//   conversion_rate: ConversionRate;
//   created_at: string;
//   description: string | null;
//   points: number;
//   reference_data: ReferenceData;
//   reference_id: string | null;
//   transaction_id: number;
//   transaction_type: "redeem" | "earn";
//   user_id: string;
//   users: User;
// }

export interface RewardTransaction {
  transaction_id: number;
  user_id: string;
  transaction_type: "redeem" | "earn";
  points: number;
  description: string;
  conversion_rate: ConversionRate;
  reference_id: string;
  reference_data: ReferenceData;
  created_at: string;
  users: User;
}

export interface Points {
  available_points: number;
  total_earned_points: number;
  total_redeemed_points: number;
}
