import { UUID } from "crypto";
import { dataResponseInterface, dbClient } from ".";

export enum RewardPointsTransactionType {
    Earn = "earn",
    Redeem = "redeem",
    Adjust = "adjust"
}

export interface AddRewadPointTransactionArgs {
    userID: string,
    transactionType: RewardPointsTransactionType,
    points: number,
    description?: string,
    conversionRate?: any,
    referenceID?: any,
    referenceData?: any
}

export interface UpdateRewadPointTransactionArgs {
    userID?: string,
    transactionType?: RewardPointsTransactionType,
    points?: number,
    description?: string,
    conversionRate?: any,
    referenceID?: any,
    referenceData?: any
}

export interface GetRewadPointTransactionsArgs {
    page?: number,
    limit?: number,
    orderBy?: string,
    order?: 'asc' | 'desc',
    type?: RewardPointsTransactionType,
    userID?: string
}

export interface RewardPointsTransactionsDBInterface {
    transaction_id?: number;
    user_id?: string;
    transaction_type?: string;
    points?: number;
    description?: string;
    conversion_rate?: string;
    reference_id?: string;
    reference_data?: string;
    created_at?: Date | string;
}

export const addRewadPointTransaction = async (addRewadPointTransactionArgs: AddRewadPointTransactionArgs) => {
    const { userID, transactionType, points, description, conversionRate, referenceID, referenceData } = addRewadPointTransactionArgs;

    const insertData: any = {
        user_id: userID,
        transaction_type: transactionType,
        points
    }

    if (description) insertData.description = description;
    if (conversionRate) insertData.conversion_rate = conversionRate;
    if (referenceID) insertData.reference_id = referenceID;
    if (referenceData) insertData.reference_data = referenceData;

    const { data, error } = await dbClient
        .from('reward_points_transactions')
        .insert([insertData])
        .select('transaction_id')
        .single();

    if (error) {
        console.error("Error while addRewadPointTransaction", error.message);
        return false;
    }

    return data.transaction_id
}

export const updateRewadPointTransaction = async (transactionID: number, updateRewadPointTransactionArgs: UpdateRewadPointTransactionArgs) => {
    const { userID, transactionType, points, description, conversionRate, referenceID, referenceData } = updateRewadPointTransactionArgs;

    const updateData: any = {};

    if (userID) updateData.user_id = updateData;
    if (transactionType) updateData.transaction_type = transactionType;
    if (points) updateData.points = points;
    if (description) updateData.description = description;
    if (conversionRate) updateData.conversion_rate = conversionRate;
    if (referenceID) updateData.reference_data = referenceID;
    if (referenceData) updateData.reference_data = referenceData;

    if (Object.keys(updateData).length <= 0) return false;

    const { data, error } = await dbClient
        .from('reward_points_transactions')
        .update(updateData)
        .eq('transaction_id', transactionID)
        .select();

    if (error) {
        console.error("Error while updateRewadPointTransaction", error.message);
        return false;
    }

    return data;
}

export const getRewadPointTransaction = async (transactionID: number) => {
    const { data, error } = await dbClient
        .from('reward_points_transactions')
        .select('*')
        .eq('transaction_id', transactionID)
        .single();

    if (error) {
        console.error("Error while getRewadPointTransaction", error.message);
        return false;
    }

    return data;
}

export const getRewadPointTransactionsByReferenceIDs = async (referenceIDs: Array<string>) => {
    const { data, error } = await dbClient
        .from('reward_points_transactions')
        .select('*')
        .in('reference_id', referenceIDs);

    if (error) {
        console.error("Error while getRewadPointTransactionsByReferenceIDs", error.message);
        return false;
    }

    return data;
}

export const getRewadPointTransactionByReferenceID = async (referenceID: string) => {
    const { data, error } = await dbClient
        .from('reward_points_transactions')
        .select('*')
        .eq('reference_id', referenceID)
        .single();

    if (error) {
        console.error("Error while getRewadPointTransactionByReferenceID", error.message);
        return false;
    }

    return data;
}

export const getRewadPointTransactions = async (getRewadPointTransactionsArgs: GetRewadPointTransactionsArgs = {}) => {
    const { page = 1, limit = 10, order = 'desc', orderBy = 'created_at', type, userID } = getRewadPointTransactionsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('reward_points_transactions')
        .select(`*,
            users:user_id (user_email, first_name, last_name)`, { count: 'exact' });

    if (type) query = query.eq('transaction_type', type);
    if (userID) query = query.eq('user_id', userID);

    if (limit !== -1) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order(orderBy, { ascending: order === 'asc' });

    let { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "reward points transactions not found";
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

export const deleteRewadPointTransaction = async (transactionID: number) => {

    const { error } = await dbClient
        .from('reward_points_transactions')
        .delete()
        .eq('transaction_id', transactionID);

    if (error) {
        console.error("Error while deleteRewadPointTransaction", error.message);
        return false;
    }

    return true;
}

export const getRewadPointUsers = async () => {

    const { data, error } = await dbClient
        .rpc('get_users_from_reward_points_transactions');

    if (error) {
        console.error('Error calling get_users_from_reward_points_transactions function:', error.message);
        return false;
    }

    return data;
}

export const getPointsData = async (userID: string | UUID) => {
    const { data, error } = await dbClient
        .rpc('get_user_available_reward_point', { p_user_id: userID });

    if (error) {
        console.error('Error calling get_user_available_reward_point function:', error.message);
        return false;
    }

    return data;
}

export const getAvailablePoints = async (userID: string | UUID) => {
    const data = await getPointsData(userID);
    return (data.available_points) ? data.available_points : false;
}

export const getTotalEarnedPoints = async (userID: string | UUID) => {
    const data = await getPointsData(userID);
    return (data.total_earned_points) ? data.total_earned_points : false;
}

export const getTotalRedeemedPoints = async (userID: string | UUID) => {
    const data = await getPointsData(userID);
    return (data.total_redeemed_points) ? data.total_redeemed_points : false;
}