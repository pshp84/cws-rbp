import { dataResponseInterface, dbClient, deleteUploadedFile, getUploadedFileUrl, uploadFile } from "@/DbClient";

export interface addLeaseInfoArgs {
    userID: string;
    leaseDocument?: any;
    rentDate?: string;
    rentAmount?: number;
    verificationStatus?: boolean;
}

export interface updateLeaseInfoArgs {
    leaseDocument?: any;
    rentDate?: string;
    rentAmount?: number;
    verificationStatus?: boolean;
}

export interface getLeaseInfoListArgs {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    userID?: string;
    verificationStatus?: boolean,
}

export interface leaseInfoDBInterface {
    lease_info_id?: number;
    users?: any;
    user_id?: string;
    lease_document?: string;
    leaseDocumentURL?: string;
    rent_date?: string;
    rent_amount?: number;
    verification_status?: boolean;
    updated_at?: Date | string;
    created_at?: Date | string;
}

export interface usersFromLeaseInfo {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    user_email?: string;
}

export const LeaseBucketFolderName: string = "lease_documents";

export const addLeaseInfo = async (addLeaseInfoArgs: addLeaseInfoArgs): Promise<boolean | leaseInfoDBInterface> => {
    const { userID, leaseDocument, rentAmount, rentDate, verificationStatus } = addLeaseInfoArgs;

    const insertData: leaseInfoDBInterface = {};

    if (userID) insertData.user_id = userID;
    if (rentAmount) insertData.rent_amount = rentAmount;
    if (rentDate) insertData.rent_date = rentDate;
    if (typeof verificationStatus !== "undefined") insertData.verification_status = verificationStatus;
    if (leaseDocument) {
        const fileUploadData = await uploadFile(leaseDocument, LeaseBucketFolderName);
        if (!fileUploadData) return false;
        insertData.lease_document = fileUploadData.path;
    }

    if (Object.keys(insertData).length <= 0) return false;

    const { data, error } = await dbClient
        .from('lease_info')
        .insert([insertData])
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `)
        .single();

    if (error) {
        console.error("Error while inserting lease info", error.message);
        return false;
    }

    return data;
}

export const getLeaseInfoList = async (getLeaseInfoListArgs: getLeaseInfoListArgs = {}): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', userID, verificationStatus } = getLeaseInfoListArgs;
    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('lease_info')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `, { count: 'exact' });

    if (typeof verificationStatus !== "undefined") query = query.eq('verification_status', verificationStatus);
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
        returnData.message = "Lease info not found";
        return returnData;
    }

    data = await updateDataWithFileURLs(data);

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;
    return returnData;
}

export const updateLeaseInfo = async (userID: string, updateLeaseInfoArgs: updateLeaseInfoArgs): Promise<boolean | leaseInfoDBInterface> => {
    const { leaseDocument, rentAmount, rentDate, verificationStatus } = updateLeaseInfoArgs;
    const updateData: leaseInfoDBInterface = {
        updated_at: new Date().toISOString()
    };

    if (rentAmount) updateData.rent_amount = rentAmount;
    if (rentDate) updateData.rent_date = rentDate;
    if (typeof verificationStatus !== "undefined") updateData.verification_status = verificationStatus;
    if (leaseDocument) {
        const fileUploadData = await uploadFile(leaseDocument, LeaseBucketFolderName);
        if (!fileUploadData) return false;
        updateData.lease_document = fileUploadData.path;
    }

    if (Object.keys(updateData).length <= 1) return false;

    const { data, error } = await dbClient
        .from('lease_info')
        .update(updateData)
        .eq('user_id', userID)
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `)
        .single();

    if (error) {
        console.error("Error while updating lease_info", error.message);
        return false;
    }

    return data;
}

export const getLeaseInfo = async (userID: string): Promise<boolean | leaseInfoDBInterface> => {
    let { data, error } = await dbClient
        .from('lease_info')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `)
        .eq('user_id', userID)
        .single();

    if (error) {
        console.error("Error while getting lease_info", error.message);
        return false;
    }

    if (data.lease_document && data.lease_document != "") {
        data = await updateDataWithFileURLs([data]);
        data = data[0];
    }
    return data;
}

export const deleteLeaseInfo = async (userID: string): Promise<boolean> => {

    const { data: leaseDocumentData, error: leaseDocumentError } = await dbClient
        .from('lease_info')
        .select('lease_document')
        .eq('user_id', userID)
        .single();

    if (leaseDocumentError) {
        console.error("Error while delete lease_document", leaseDocumentError.message);
        return false;
    }

    const { lease_document: leaseDocument } = leaseDocumentData;

    if (!leaseDocument || leaseDocument == "") {
        const leaseDocumentDeleteStatus = await deleteUploadedFile(leaseDocument);
        if (!leaseDocumentDeleteStatus) return false;
    }

    const { error: leaseInfoDeleteError } = await dbClient
        .from('lease_info')
        .delete()
        .eq('user_id', userID);

    if (leaseInfoDeleteError) {
        console.error("Error while delete lease_info", leaseInfoDeleteError.message);
        return false;
    }

    return true;
}

export const getUsersFromLeaseInfo = async (): Promise<Array<usersFromLeaseInfo> | boolean> => {
    const { data: userData, error } = await dbClient
        .from('lease_info')
        .select(`
            *,
            users:user_id (user_id, user_email, first_name, last_name)
            `);

    if (error) {
        console.error("Error while getting UsersFromLeaseInfo", error.message);
        return false;
    }

    const returnData = userData.map(data => data.users);
    return returnData;
}

const updateDataWithFileURLs = async (leaseInfoData: any) => {
    const updatedData = await Promise.all(
        leaseInfoData.map(async (leaseInfo: any) => {
            const { lease_document } = leaseInfo;
            if (lease_document) {
                const leaseDocumentURL = await getUploadedFileUrl(lease_document);
                return leaseDocumentURL ? { ...leaseInfo, leaseDocumentURL } : leaseInfo;
            }
            return leaseInfo;
        })
    );
    return updatedData;
};