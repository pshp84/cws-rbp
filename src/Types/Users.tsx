export interface UsersList {
  created_at: string;
  first_name: string;
  last_name: string;
  user_email: string;
  user_id: string;
  user_role: "user" | "admin" | "property_manager";
  user_status: boolean;
  phone_number?: number;
  planId?: number;
  nextPaymentDate?: string | Date;
  membershipStatus?: string;
}