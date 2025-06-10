import { createClient } from '@/utils/supabase/client';

// Create and export the Supabase client
export const dbClient = createClient();

export interface dataResponseInterface {
    status: boolean;
    message?: string;
    totalPages?: number;
    currentPage?: number;
    limit?: number;
    totalRecords?: number | null | undefined;
    data?: any[];
}

export * from '@/DbClient/media';
export * from '@/DbClient/products';
export * from '@/DbClient/users';
export * from '@/DbClient/options';
export * from '@/DbClient/memberships';
export * from '@/DbClient/transactions';
export * from '@/DbClient/orders';
export * from '@/DbClient/deals';
export * from '@/DbClient/rewardPoints';
export * from '@/DbClient/leaseInfo';
export * from '@/DbClient/utmCampaigns';
export * from '@/DbClient/freeMembershipsRequests';
export * from '@/DbClient/dealsBanner';
export * from '@/DbClient/affiliatesReferrals';