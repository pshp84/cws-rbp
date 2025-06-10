import { BanquestTransactionStatus } from "@/app/api/banquest/banquestConfig";
import { dbClient } from ".";

export interface transactionInsertData {
    membershipId: number,
    planId: number;
    userId: string;
    status?: string;
    banquestData?: any
}

export interface transactionUpdateData {
    membership_id?: number;
    plan_id?: number;
    user_id?: number
    transaction_status?: BanquestTransactionStatus;
}

export const addTransaction = async (transactionData: transactionInsertData) => {
    const { membershipId, planId, userId, status, banquestData } = transactionData;
    if (!planId || !userId) {
        return false;
    }

    const insertData: any = {
        membership_id: membershipId,
        plan_id: planId,
        user_id: userId,
    }

    if (status) {
        insertData.transaction_status = status;
    }

    const { data, error } = await dbClient.from('membership_transactions')
        .insert([insertData])
        .select('transaction_id')
        .single();

    // Handle errors
    if (error || !data) {
        console.error("Error inserting membership transactions: ", error);
        return false;
    }

    const transactionId = data.transaction_id;

    if (banquestData) {
        await updateTransactionMeta(transactionId, 'banquest_data', banquestData);
    }
    return transactionId;
}

export const updateTransaction = async (transactionId: number, transactionUpdateData: transactionUpdateData) => {
    const { membership_id, plan_id, user_id, transaction_status } = transactionUpdateData;

    const updateData: any = {}

    if (membership_id) {
        updateData.membership_id = membership_id
    }

    if (plan_id) {
        updateData.plan_id = plan_id
    }

    if (user_id) {
        updateData.user_id = user_id
    }

    if (transaction_status) {
        updateData.transaction_status = transaction_status
    }

    const { data, error } = await dbClient.from('membership_transactions')
        .update(updateData)
        .eq('transaction_id', transactionId)
        .select()
        .single();

    // Handle errors
    if (error || !data) {
        console.error("Error updating transaction: ", error);
        return false;
    }

    return data;
}

export const getTransactionMeta = async (transactionId: number, metaKey: string = "", single: boolean = false) => {
    let query: any = dbClient.from('membership_transactionmeta').select('meta_key, meta_value').eq('transaction_id', transactionId);

    if (metaKey != "") {
        query = query.eq('meta_key', metaKey);
    }

    if (single) {
        query = query.select('meta_value').single();
    }

    const { data, error } = await query;

    // Handle errors
    if (error || !data) {
        console.error("Error fetching transactionmeta: ", error);
        return false;
    }

    if (single && data.meta_value) {
        return data.meta_value;
    }

    return data;
}

export const getTransactionByMeta = async (metaKey: string, metaValue: string, single: boolean = false): Promise<boolean | object> => {
    let query: any = dbClient.from('membership_transactionmeta')
        .select('membership_transactions(*)')
        .eq('meta_key', metaKey)
        .eq('meta_value', metaValue);

    if (single) {
        query = query.select('transaction_id')
    }

    let { data, error } = await query;

    // Handle errors
    if (error || !data) {
        console.error("Error fetching transaction: ", error);
        return false;
    }

    data = data[0] || data;

    if (!single) {
        return data.membership_transactions || false;
    }

    return data;
}

export const getTransactionByBanquestID = async (banquestID: string, single: boolean = false): Promise<boolean | object> => {
    return await getTransactionByMeta("banquest_transaction_id", banquestID, single);
}

export const addTransactionMetas = async (transactionId: number, transactionMetaData: object | any): Promise<boolean> => {

    const transactionMetaInsert = [];
    for (const key in transactionMetaData) {
        if (Object.prototype.hasOwnProperty.call(transactionMetaData, key)) {
            const metaKey = key;
            const metaValue = transactionMetaData[key];
            transactionMetaInsert.push({
                transaction_id: transactionId,
                meta_key: metaKey,
                meta_value: metaValue
            })
        }
    }
    const { data, error } = await dbClient.from('membership_transactionmeta').insert(transactionMetaInsert);

    if (error || !data) {
        console.error("Error updating transaction meta: ", error);
        return false;
    }

    return true;
}

export const updateTransactionMeta = async (transactionId: number, metaKey: string, metaValue: any): Promise<boolean> => {
    const isMetaExist = await getTransactionMeta(transactionId, metaKey, true);
    const isUpdate = !!isMetaExist;
    let query: any = dbClient.from('membership_transactionmeta');

    if (isUpdate) {
        query = query.update({ 'meta_value': metaValue })
            .eq('transaction_id', transactionId)
            .eq('meta_key', metaKey);
    } else {
        query = query.insert([{
            transaction_id: transactionId,
            meta_key: metaKey,
            meta_value: metaValue
        }]);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error updating transaction meta: ", error);
        return false;
    }

    return true;
}