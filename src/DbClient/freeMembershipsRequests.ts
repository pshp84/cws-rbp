import { dataResponseInterface, dbClient, getUTMDataByUserID } from "@/DbClient";

export interface freeMembershipsRequestsDBInterface {
    utmData: any;
    users: any;
    request_id?: number;
    user_id?: string;
    status?: string;
    updated_at?: Date | string;
    created_at?: Date | string;
}

export interface getFreeMembershipsRequestsArgs {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    status?: string;
}

export enum FreeMembershipsRequestStatus {
    Pending = "pending",
    Approved = "approved",
    Rejected = "rejected"
}


export const getFreeMembershipsRequests = async (getFreeMembershipsRequestsArgs: getFreeMembershipsRequestsArgs = {}): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', status } = getFreeMembershipsRequestsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('free_memberships_requests')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `, { count: 'exact' });

    if (status) query = query.eq('status', status);

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
        returnData.message = "Free memberships requests not found";
        return returnData;
    }

    const updatedData = await Promise.all(
        data.map(async (data) => {
            const eventData = await getUTMDataByUserID(data.user_id);
            if (typeof eventData === "boolean") return { ...data, utmData: false };
            return { ...data, utmData: eventData };
        })
    );

    data = updatedData;

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;
    return returnData;
}

export const updateFreeMembershipsRequestStatus = async (requestID: number, status: FreeMembershipsRequestStatus): Promise<Boolean> => {

    const { error } = await dbClient
        .from('free_memberships_requests')
        .update({
            status: status,
            updated_at: new Date()
        })
        .eq('request_id', requestID);

    if (error) {
        console.error(`Error while updateFreeMembershipsRequestStatus: ${error.message}`);
        return false;
    }

    return true;
}

export const getFreeMembershipsRequestStatusByUserID = async (userID: string): Promise<Boolean | FreeMembershipsRequestStatus> => {

    let { data: free_memberships_requests, error } = await dbClient
        .from('free_memberships_requests')
        .select('status')
        .eq('user_id', userID)
        .single();

    if (error) {
        console.error("Error while getFreeMembershipsRequestStatusByUserID", error.message);
        return false;
    }

    if (!free_memberships_requests || free_memberships_requests == null) return false;

    const { status } = free_memberships_requests;

    switch (status) {
        case "approved":
            return FreeMembershipsRequestStatus.Approved;
            break;

        case "rejected":
            return FreeMembershipsRequestStatus.Rejected;
            break;

        default:
            return FreeMembershipsRequestStatus.Pending;
            break;
    }
}