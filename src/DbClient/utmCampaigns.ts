import { dataResponseInterface, dbClient } from "@/DbClient";

export interface utmCampaignsDBInterface {
    utm_id?: number;
    campaign_id?: string | number;
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    created_at?: Date | string;
}

export interface addUtmCampaignArgs {
    campaignID?: string | number;
    campaign?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
}

export interface getUtmCampaignsArgs {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    medium?: string;
    source?: string;
    campaign?: string;
    campaignID?: string;
}

export interface getUtmCampaignIDArgs {
    campaignID?: string | number;
    campaign?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
}

export enum UtmEventType {
    LinkView = 'link_view',
    Signup = 'signup',
    Referral = 'referral'
}

export interface utmEventsDBInterface {
    event_id?: number;
    utm_id?: number;
    event_type?: string;
    event_details?: any;
    user_id?: string;
    user_ip?: string;
    referrer_id?: string;
    created_at?: Date | string;
}

export interface addUtmEventArgs {
    utmID: number;
    eventType: UtmEventType;
    eventDetails?: any;
    userID?: string;
    userIP?: string;
    referrerID?: string;
}

export interface getUtmEventsArgs {
    utmID: number;
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    event?: UtmEventType;
    userID?: string;
    userIP?: string;
}

export interface updateUtmEventArgs {
    eventType?: UtmEventType;
    referrerID?: string;
    eventDetails?: any;
    userID?: string;
}

// utm_campaigns
export const addUtmCampaign = async (addUtmCampaignArgs: addUtmCampaignArgs): Promise<boolean | utmCampaignsDBInterface> => {
    const { campaign, campaignID, medium, source, content, term } = addUtmCampaignArgs;
    const insertData: utmCampaignsDBInterface = {};
    if (campaignID) insertData.campaign_id = campaignID;
    if (campaign) insertData.utm_campaign = campaign;
    if (medium) insertData.utm_medium = medium;
    if (source) insertData.utm_source = source;
    if (content) insertData.utm_content = content;
    if (term) insertData.utm_term = term;

    if (Object.keys(insertData).length <= 0) return false;

    const { data, error } = await dbClient
        .from('utm_campaigns')
        .insert([insertData])
        .select();

    if (error) {
        console.error("Error while addUtmCampaigns", error.message);
        return false;
    }

    return data[0] || false;
}

export const getUtmCampaigns = async (getUtmCampaignsArgs: getUtmCampaignsArgs = {}): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', campaign, campaignID, medium, source } = getUtmCampaignsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('utm_campaigns')
        .select(`*`, { count: 'exact' });

    if (medium) query = query.eq('utm_medium', medium);
    if (source) query = query.eq('utm_source', source);
    if (campaign) query = query.like('utm_campaign', `%${campaign}%`);
    if (campaignID) query = query.like('campaign_id', `%${campaignID}%`);

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
        returnData.message = "UTM Campaigns not found";
        return returnData;
    }

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    const updatedData = await Promise.all(
        data.map(async (campaign) => {
            const eventData = await getUtmEvents({ utmID: campaign.utm_id, limit: 1 });
            if (typeof eventData === "boolean") return { ...campaign, users_count: 0 };
            const { status, totalRecords } = eventData;
            if (status === false) return { ...campaign, users_count: 0 };
            return { ...campaign, users_count: totalRecords };
        })
    );

    data = updatedData;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;
    return returnData;
}

export const getUtmCampaign = async (utmID: number): Promise<boolean | utmCampaignsDBInterface> => {

    const { data, error } = await dbClient
        .from('utm_campaigns')
        .select('*')
        .eq('utm_id', utmID)
        .select()
        .single();

    if (error) {
        console.error("Error while getUtmCampaign", error.message);
        return false;
    }

    return data;
}

export const getUtmCampaignID = async (getUtmCampaignIDArgs: getUtmCampaignIDArgs): Promise<boolean | utmCampaignsDBInterface> => {

    const { campaign, campaignID, medium, source, content, term } = getUtmCampaignIDArgs;

    if (!campaign && !campaignID && !medium && !source && !content && !term) return false;

    let query = dbClient
        .from('utm_campaigns')
        .select('utm_id');

    if (content) query = query.eq('utm_content', content);
    if (campaignID) query = query.eq('campaign_id', campaignID);
    if (campaign) query = query.eq('utm_campaign', campaign);
    if (source) query = query.eq('utm_source', source);
    if (medium) query = query.eq('utm_medium', medium);
    if (term) query = query.eq('utm_term', term);

    const { data, error } = await query;

    if (error) {
        console.error("Error while getUtmCampaignID", error.message);
        return false;
    }

    if (data.length <= 0) return false;

    return data[0].utm_id || false;
}
// EOF utm_campaigns


// utm_events
export const addUtmEvent = async (addUtmEventArgs: addUtmEventArgs): Promise<boolean | utmEventsDBInterface> => {
    const { eventType = UtmEventType.LinkView, eventDetails, userID, utmID, referrerID, userIP } = addUtmEventArgs;

    const insertData: utmEventsDBInterface = {
        event_type: eventType,
        utm_id: utmID
    };

    if (userID) insertData.user_id = userID;
    if (userIP) insertData.user_ip = userIP;
    if (eventDetails) insertData.event_details = eventDetails;
    if (referrerID) insertData.referrer_id = referrerID;

    const { data, error } = await dbClient
        .from('utm_events')
        .insert([insertData])
        .select()

    if (error) {
        console.error("Error while addUtmEvent", error.message);
        return false;
    }

    return data[0] || false;
}

export const getUtmEvents = async (getUtmEventsArgs: getUtmEventsArgs): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', utmID, event, userID, userIP } = getUtmEventsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('utm_events')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name)
            `, { count: 'exact' })
        .eq('utm_id', utmID);

    if (event) query = query.eq('event_type', event);
    if (userID) query = query.eq('user_id', userID);
    if (userIP) query = query.eq('user_ip', userIP);

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
        returnData.message = "UTM Events not found";
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

export const updateUtmEvent = async (eventID: number, updateUtmEventArgs: updateUtmEventArgs): Promise<boolean | utmEventsDBInterface> => {
    const { eventDetails, eventType, referrerID, userID } = updateUtmEventArgs;

    const updateData: utmEventsDBInterface = {}
    if (eventType) updateData.event_type = eventType;
    if (eventDetails) updateData.event_details = eventDetails;
    if (referrerID) updateData.referrer_id = referrerID;
    if (userID) updateData.user_id = userID;
    if (Object.keys(updateData).length <= 0) return false;

    const { data, error } = await dbClient
        .from('utm_events')
        .update(updateData)
        .eq('event_id', eventID)
        .select();

    if (error) {
        console.error("Error while updateUtmEvent", error.message);
        return false;
    }

    return data[0] || false;
}
// EOF utm_events

export const getUTMCampaignsMedium = async (): Promise<boolean | Array<{ utm_medium: string }>> => {
    const { data, error } = await dbClient
        .rpc('get_utm_campaigns_medium');

    if (error) {
        console.error("Error while getUTMCampaignsMedium " + error.message);
        return false;
    }
    return data;
}

export const getUTMCampaignsSource = async (): Promise<boolean | Array<{ utm_source: string }>> => {
    const { data, error } = await dbClient
        .rpc('get_utm_campaigns_source');

    if (error) {
        console.error("Error while getUTMCampaignsSource " + error.message);
        return false;
    }
    return data;
}

export const getUTMDataByUserID = async (userID: string): Promise<boolean | {
    utm_id?: any;
    event_type?: any;
    event_details?: any;
    referrer_id?: any;
    user_ip?: any;
    utm_campaigns?: {
        campaign_id?: any;
        utm_campaign?: any;
        utm_source?: any;
        utm_medium?: any;
        utm_content?: any;
        utm_term?: any;
    }[];
} | null> => {

    let { data: utm_events, error } = await dbClient
        .from('utm_events')
        .select(`
            utm_id,event_type,event_details,referrer_id, user_ip,
            utm_campaigns:utm_id (campaign_id,utm_campaign,utm_source,utm_medium,utm_content,utm_term)
            `)
        .eq("user_id", userID)
        .single();

    if (error) {
        console.error(`Error while getUTMDataByUserID: ${error.message}`);
        return false;
    }

    return utm_events;
}