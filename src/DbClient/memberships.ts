import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { dataResponseInterface, dbClient, getUserById, getUserMeta } from ".";
import { banquestRecurringSchedulesPatchData } from "@/app/api/banquest/customer/[customer_id]/transactions/recurring-schedules/[recurring_schedule_id]/route";
import { calculateNextRunDate } from "@/app/api/banquest/banquestConfig";

export interface membershipInsertData {
    planId: number;
    userId: string;
    startDate?: Date;
    endDate?: Date;
    nextPaymentDate?: Date
    status?: membershipStatus;
    banquestRecurringScheduleId?: number
}

export interface membershipUpdateData {
    planId?: number;
    startDate?: Date;
    endDate?: Date;
    nextPaymentDate?: Date
    status?: membershipStatus;
    banquestRecurringScheduleId?: number
}

export enum membershipStatus {
    Active = 'active',
    Inactive = 'inactive',
    Hold = 'hold',
    Canceled = 'canceled',
    Suspended = 'suspended'
}

export enum transactionStatus {
    Captured = "captured",
    Pending = "pending",
    Reserve = "reserve",
    Originated = "originated",
    Returned = "returned",
    Cancelled = "cancelled",
    Queued = "queued",
    Declined = "declined",
    Error = "error",
    Settled = "settled",
    Voided = "voided",
    Approved = "approved",
    Blocked = "blocked",
    Expired = "expired"
}

export interface membershipsDbFieldsInterface {
    membership_id?: number,
    plan_id: number,
    user_id: string,
    start_date: Date,
    end_date?: Date,
    next_payment_date?: Date,
    status: membershipStatus,
    banquest_recurring_schedule_id?: number,
    created_at?: Date
}

export enum membershipPlanFrequency {
    Daily = "daily",
    Weekly = "weekly",
    Biweekly = "biweekly",
    Monthly = "monthly",
    Bimonthly = "bimonthly",
    Quarterly = "quarterly",
    Biannually = "biannually",
    Annually = "annually"
}

export interface getMembershipArgsInterface {
    page?: number;
    limit?: number;
    planID?: number;
    userID?: string;
    status?: membershipStatus,
    orderBy?: 'start_date' | 'next_payment_date' | 'status';
    order?: 'asc' | 'desc';
}

export interface getTransactionsArgsInterface {
    page?: number;
    limit?: number;
    orderBy?: 'created_at' | 'status';
    order?: 'asc' | 'desc';
    planID?: number;
    userID?: string;
    membershipID?: number;
    status?: transactionStatus,
}

export interface membershipPlansDbFieldsInterface {
    plan_id?: number;
    plan_name?: string;
    plan_description?: string;
    plan_amount?: number;
    plan_frequency?: membershipPlanFrequency;
    plan_status?: boolean;
}

export const getMemberships = async (getMembershipArgs: getMembershipArgsInterface = {}) => {
    const { page = 1, limit = 10, orderBy = 'start_date', order = 'desc', planID, userID, status } = getMembershipArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('memberships')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name), 
            membership_plans:plan_id (plan_name, plan_description, plan_amount, plan_frequency)
        `, { count: 'exact' });

    if (userID) query = query.eq('user_id', userID);
    if (planID) query = query.eq('plan_id', planID);
    if (status) query = query.eq('status', status);

    if (limit !== -1) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order(orderBy, { ascending: order === 'asc' });

    const { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "Memberships not found";
        return returnData;
    }

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;

    return returnData;
}

export const addMembership = async (membershipData: membershipInsertData) => {
    const { planId, userId, startDate, endDate, nextPaymentDate, status, banquestRecurringScheduleId } = membershipData;
    if (!planId || !userId) {
        return false;
    }

    const insertData: any = {
        plan_id: planId,
        user_id: userId
    }

    if (startDate) insertData.start_date = startDate;
    if (endDate) insertData.end_date = endDate;
    if (nextPaymentDate) insertData.next_payment_date = nextPaymentDate;
    if (status) insertData.status = status;
    if (banquestRecurringScheduleId) insertData.banquest_recurring_schedule_id = banquestRecurringScheduleId;

    const { data: membershipInsert, error: membershipInsertError } = await dbClient.from('memberships')
        .insert([insertData])
        .select('membership_id')
        .single();

    // Handle errors
    if (membershipInsertError || !membershipInsert.membership_id) {
        console.error("Error inserting membership: ", membershipInsertError);
        return false;
    }

    return membershipInsert.membership_id;
}

export const updateMembership = async (membershipId: number, membershipUpdateData: membershipUpdateData) => {
    const { startDate, endDate, nextPaymentDate, status, banquestRecurringScheduleId, planId } = membershipUpdateData;

    const updateData: any = {}

    if (startDate) updateData.start_date = startDate;
    if (endDate) updateData.end_date = endDate;
    if (nextPaymentDate) updateData.next_payment_date = nextPaymentDate;
    if (status) updateData.status = status;
    if (banquestRecurringScheduleId) updateData.banquest_recurring_schedule_id = banquestRecurringScheduleId;
    if (planId) updateData.plan_id = planId;

    const { data: membershipUpdate, error: membershipUpdateError } = await dbClient.from('memberships')
        .update(updateData)
        .eq('membership_id', membershipId)
        .select()
        .single();

    // Handle errors
    if (membershipUpdateError || !membershipUpdate) {
        console.error("Error updating membership: ", membershipUpdateError);
        return false;
    }

    return membershipUpdate;
}

export const getUserMembership = async (userID: string, single: boolean = true) => {

    let query: any = dbClient
        .from('memberships')
        .select('*')
        .eq('user_id', userID)

    if (single) {
        query = query.single();
    }

    const { data: memberships, error } = await query;

    // Handle errors
    if (error || !memberships) {
        console.error("Error fetching memberships: ", error);
        return false;
    }
    return memberships
}

export const getUserMembershipByPlan = async (userID: string, membershipPlanID: number = 1) => {
    let { data: memberships, error } = await dbClient
        .from('memberships')
        .select('*')
        .eq('user_id', userID)
        .eq('plan_id', membershipPlanID);

    // Handle errors
    if (error || !memberships) {
        console.error("Error fetching memberships: ", error);
        return false;
    }
    return memberships
}

export const getMembershipPlans = async (excludeFreePlan: boolean = true) => {
    let query = dbClient
        .from('membership_plans')
        .select('*');
    if (excludeFreePlan) {
        query = query.gte("plan_amount", 1);
    }
    const { data, error } = await query;

    // Handle errors
    if (error || !data) {
        console.error("Error fetching membership plans: ", error);
        return false;
    }
    return data;
}

export const getMembershipPlan = async (planId: number): Promise<any> => {
    const { data, error } = await dbClient
        .from('membership_plans')
        .select('*,memberships(count)')
        .eq('plan_id', planId)
        .single();

    // Handle errors
    if (error || !data) {
        console.error("Error fetching membership plan: ", error);
        return false;
    }

    const memberships_count = data.memberships ? data.memberships[0].count : 0;

    return {
        ...data,
        memberships_count
    };
}

export const changeUserMembershipPlan = async (userID: string, newPlanID: number) => {
    const newPlanDetails = await getMembershipPlan(newPlanID);
    if (!newPlanDetails) {
        return false;
    }

    const { plan_amount: newPlanAmount, plan_frequency: newPlanFrequency, plan_status: newPlanStatus, plan_name: newPlanName } = newPlanDetails;

    if (!newPlanStatus) {
        console.error("Membership plan is disabled");
        return false;
    }

    const banquestCustomerID = await getUserMeta(userID, 'banquest_customer_id', true);

    if (!banquestCustomerID) {
        console.error("User don't have banquest customer id");
        return false;
    }

    const userMembership = await getUserMembership(userID, true);

    if (!userMembership) {
        console.error("User don't have any membership yet");
        return false;
    }

    let { membership_id: membershipID, plan_id: oldPlanID, banquest_recurring_schedule_id: banquestRecurringRcheduleID } = userMembership;

    const membershipUpdateData: membershipUpdateData = {
        planId: newPlanID
    }

    if (!banquestRecurringRcheduleID) {
        // Create recurring transaction in Banquest
        try {
            const userData = await getUserById(userID, ['first_name', 'last_name']);
            if (!userData) {
                console.error("User not found");
                return false;
            }
            const paymentMethodID = await getUserMeta(userID, 'banquest_payment_method_id', true);
            const recurringSchedulesPostData: object = {
                "title": `${userData?.first_name} ${userData?.last_name} ${newPlanName} recurring payments`,
                "amount": newPlanAmount,
                "frequency": newPlanFrequency,
                "payment_method_id": parseInt(paymentMethodID)
            }
            const { data: recurringSchedulesData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/transactions/recurring-schedules`, recurringSchedulesPostData);
            if (!recurringSchedulesData.status || !recurringSchedulesData.data) {
                console.error(`${recurringSchedulesData.message}`);
                return false;
            }
            const { id: recurringScheduleId, next_run_date: nextPaymentDate } = recurringSchedulesData.data;

            membershipUpdateData.nextPaymentDate = nextPaymentDate;
            membershipUpdateData.banquestRecurringScheduleId = recurringScheduleId;
        } catch (error) {
            console.error("An unexpected error occurred:", error);
            return false
        }
        // EOF Create recurring transaction in Banquest
    } else {
        const nextPaymentDate = calculateNextRunDate();
        const recurringSchedulesUpdateData: banquestRecurringSchedulesPatchData = {
            amount: newPlanAmount,
            frequency: newPlanFrequency,
            next_run_date: nextPaymentDate,
            title: `RBP Club Membership ${newPlanFrequency} Plan recurring payments`
        }

        const { data: recurringScheduleUpdateData } = await rbpApiCall.patch(`/banquest/customer/${banquestCustomerID}/transactions/recurring-schedules/${banquestRecurringRcheduleID}`, recurringSchedulesUpdateData);

        if (!recurringScheduleUpdateData || !recurringScheduleUpdateData.status) {
            console.error("Bbanquest recurring schedule is not updated");
            return false;
        }

        membershipUpdateData.nextPaymentDate = recurringScheduleUpdateData.data.prev_run_date
    }
    const updateMembershipUpdateStatus = await updateMembership(membershipID, membershipUpdateData);

    if (!updateMembershipUpdateStatus) {
        console.error("Membership in db is not updated");
        return false;
    }

    return true;
}

export const getTransactions = async (getTransactionsArgs: getTransactionsArgsInterface = {}) => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', planID, userID, membershipID, status } = getTransactionsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('membership_transactions')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name), 
            membership_plans:plan_id (plan_name, plan_description, plan_amount, plan_frequency),
            memberships:membership_id (start_date, end_date, next_payment_date, status),
            membership_transactionmeta:transaction_id (meta_key, meta_value)
        `, { count: 'exact' });

    if (userID) query = query.eq('user_id', userID);
    if (planID) query = query.eq('plan_id', planID);
    if (membershipID) query = query.eq('membership_id', membershipID);
    if (status) query = query.eq('status', status);

    if (limit !== -1) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order(orderBy, { ascending: order === 'asc' });

    const { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "Membership transactions not found";
        return returnData;
    }

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;

    return returnData;
}

export const getMembershipByScheduleID = async (scheduleID: number) => {
    const { data: memberships, error } = await dbClient
        .from('memberships')
        .select('*')
        .eq('banquest_recurring_schedule_id', scheduleID)
        .single();

    // Handle errors
    if (error || !memberships) {
        console.error("Error fetching membership by schedule ID: ", error);
        return false;
    }
    return memberships
}