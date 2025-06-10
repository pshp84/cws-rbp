export interface Membership {
  banquest_recurring_schedule_id?: number;
  created_at: string;
  end_date: string;
  membership_id: number;
  next_payment_date: string;
  plan_id: number;
  start_date: string;
  status: string;
  user_id: string;
}

export interface MemberShipPlans {
  plan_amount: number;
  plan_description: string;
  plan_frequency: string;
  plan_id: number;
  plan_name: string;
  plan_status: boolean;
}

export interface Users {
  last_name: string;
  first_name: string;
  user_email: string;
}

export interface MembershipDetais {
  banquest_recurring_schedule_id: number;
  created_at: string;
  end_date: string;
  membership_id: number;
  next_payment_date: string | null;
  plan_id: number;
  start_date: string;
  status: string;
  user_id: string;
  membership_plans: MemberShipPlans;
  users: Users;
}

interface MembershipTransactionMeta {
  meta_key: string;
  meta_value: string;
}

interface User {
  first_name: string;
  last_name: string;
  user_email: string;
}

interface MembershipPlan {
  plan_name: string;
  plan_amount: number;
  plan_frequency: string;
  plan_description: string | null;
}

interface TransactionMembership {
  status: string;
  end_date: string | null;
  start_date: string;
  next_payment_date: string;
}

export interface MembershipTransaction {
  transaction_id: number;
  membership_id: number;
  plan_id: number;
  user_id: string;
  transaction_status: string;
  created_at: string;
  users: User;
  membership_plans: MembershipPlan;
  memberships: TransactionMembership;
  membership_transactionmeta: MembershipTransactionMeta[];
}



