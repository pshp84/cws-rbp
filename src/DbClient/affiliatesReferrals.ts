import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";
import { addRewadPointTransaction, AddRewadPointTransactionArgs, dataResponseInterface, dbClient, getOption, RewardPointsTransactionsDBInterface, RewardPointsTransactionType, userDbFieldsInterface } from ".";

export enum referralMethod {
    Link = "link",
    Code = "code"
}

export interface affiliatesDBInterface {
    affiliate_id?: number;
    user_id?: string;
    users?: userDbFieldsInterface,
    referral_code?: string;
    affiliate_status?: boolean | string;
    created_at?: Date | string;
    referralInsights?: {
        activeReferrals?: number;
        monthlyNewSignups?: number;
        totalReferrals?: number;
    };
    pointsInsights?: {
        availablePoints?: number;
        totalEarned?: number;
        totalRedeemed?: number;
    };
}

export interface referralsDBInterface {
    referral_id?: number;
    affiliate_id?: number;
    referred_user_id?: string;
    referral_method?: referralMethod;
    plan_id?: number;
    status?: boolean;
    created_at?: Date | string;
    affiliates?: {
        affiliate_status?: boolean;
        referral_code?: string;
        user_id?: string;
        created_at?: Date | string;
        users?: userDbFieldsInterface;
    }
    membership_plans?: {
        plan_amount?: number;
        plan_description?: string;
        plan_frequency?: string;
        plan_name?: string;
    },
    users?: userDbFieldsInterface
}

export interface addAffiliateArgs {
    userID: string;
    referralCode: string;
    status?: boolean;
}

export interface getAffiliatesArgsInterface {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    userID?: string;
    status?: boolean;
}

export interface addReferralArgs {
    affiliateID: number;
    userID: string;
    referralMethod: referralMethod;
    planID: number;
    status?: boolean;
    checkUser?: boolean;
}

export interface getReferralsArgsInterface {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
    affiliateID?: number;
    userID?: string;
    status?: boolean;
    referralMethod?: referralMethod;
    planID?: number;
}

export interface addReferralPointsArgs {
    referredUserID: string;
    points?: number;
    description?: string;
}

export interface getAffiliateStateDBData {
    active_members?: number;
    monthly_signups?: number;
    total_referrals?: number;
}

// Affiliate
export const addAffiliate = async (addAffiliateArgs: addAffiliateArgs): Promise<boolean | affiliatesDBInterface> => {
    const { referralCode, userID, status } = addAffiliateArgs;

    const insertData: affiliatesDBInterface = {
        user_id: userID,
        referral_code: referralCode
    }

    if (typeof status != "undefined") insertData.affiliate_status = status;

    const { data, error } = await dbClient
        .from('affiliates')
        .insert(insertData)
        .select("*");

    if (error) {
        console.error("Error while addAffiliate", error.message);
        return false;
    }
    return data[0] || false;
}

export const getAffiliates = async (getAffiliatesArgs: getAffiliatesArgsInterface): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', status, userID } = getAffiliatesArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('affiliates')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name, phone_number)
        `, { count: 'exact' });

    if (userID) query = query.eq('user_id', userID);
    if (typeof status != "undefined") query = query.eq('affiliate_status', status);

    if (limit !== -1) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order(orderBy, { ascending: order === 'asc' });

    let { data, error, count } = await query;

    if (error) {
        console.error("Error while getAffiliates", error.message);
        return false;
    }

    if (!data || data.length === 0) {
        return false;
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

export const getAffiliateByUserID = async (userID: string): Promise<boolean | affiliatesDBInterface> => {

    const { data, error } = await dbClient
        .from('affiliates')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name, phone_number)
            `)
        .eq('user_id', userID);

    if (error) {
        console.error("Error while getAffiliateByUserID", error.message);
        return false;
    }

    return data[0] || false;
}

export const getAffiliateByReferralCode = async (ReferralCode: string): Promise<boolean | affiliatesDBInterface> => {
    const { data, error } = await dbClient
        .from('affiliates')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name, phone_number)
            `)
        .eq('referral_code', ReferralCode)
        .eq('affiliate_status', true);

    if (error) {
        console.error("Error while getAffiliateByReferralCode", error.message);
        return false;
    }

    return data[0] || false;
}

export const getAffiliate = async (affiliateID: number): Promise<boolean | affiliatesDBInterface> => {

    const { data, error } = await dbClient
        .from('affiliates')
        .select(`
            *,
            users:user_id (user_email, first_name, last_name, phone_number)
            `)
        .eq('affiliate_id', affiliateID);

    if (error) {
        console.error("Error while getAffiliateByUserID", error.message);
        return false;
    }

    return data[0] || false;
}
// EOF Affiliate


// referrals
export const addReferral = async (addReferralArgs: addReferralArgs): Promise<boolean | referralsDBInterface> => {
    const { affiliateID, planID, referralMethod, userID, status, checkUser = false } = addReferralArgs;

    if (checkUser) {
        const { data: referrals, error: referralsError } = await dbClient
            .from('referrals')
            .select('referred_user_id')
            .eq('referred_user_id', userID);

        if (!referralsError && referrals && referrals?.length > 0) {
            console.error("referred_user_id already exist");
            return false;
        }
    }

    const insertData: referralsDBInterface = {
        affiliate_id: affiliateID,
        plan_id: planID,
        referred_user_id: userID,
        referral_method: referralMethod
    }

    if (typeof status != "undefined") insertData.status = status;

    const { data, error } = await dbClient
        .from('referrals')
        .insert(insertData)
        .select("*");

    if (error) {
        console.error("Error while addReferral", error.message);
        return false;
    }

    return data[0] || false;
}

export const getReferrals = async (getReferralsArgs: getReferralsArgsInterface): Promise<boolean | dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', status, affiliateID, planID, referralMethod, userID } = getReferralsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('referrals')
        .select(`
            *,
            users:referred_user_id (user_email, first_name, last_name),
            membership_plans:plan_id (plan_name, plan_description, plan_amount, plan_frequency),
            affiliates:affiliate_id (user_id, referral_code, affiliate_status, users:user_id (user_email, first_name, last_name))
        `, { count: 'exact' });

    if (affiliateID) query = query.eq('affiliate_id', affiliateID);
    if (userID) query = query.eq('referred_user_id', userID);
    if (referralMethod) query = query.eq('referral_method', referralMethod);
    if (planID) query = query.eq('plan_id', planID);
    if (typeof status != "undefined") query = query.eq('status', status);

    if (limit !== -1) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    query = query.order(orderBy, { ascending: order === 'asc' });

    let { data, error, count } = await query;

    if (error) {
        console.error("Error while getReferrals", error.message);
        return false;
    }

    if (!data || data.length === 0) {
        return false;
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

export const getReferral = async (referralID: number): Promise<boolean | referralsDBInterface> => {
    const { data, error } = await dbClient
        .from('referrals')
        .select(`
            *,
            users:referred_user_id (user_email, first_name, last_name),
            membership_plans:plan_id (plan_name, plan_description, plan_amount, plan_frequency),
            affiliates:affiliate_id (user_id, referral_code, affiliate_status, users:user_id (user_email, first_name, last_name))
        `)
        .eq('referral_id', referralID);

    if (error) {
        console.error("Error while getReferral", error.message);
        return false;
    }

    return data[0] || false;
}

export const getReferralByReferredUserID = async (referredUserID: string): Promise<boolean | referralsDBInterface> => {
    const { data, error } = await dbClient
        .from('referrals')
        .select(`
            *,
            users:referred_user_id (user_email, first_name, last_name),
            membership_plans:plan_id (plan_name, plan_description, plan_amount, plan_frequency),
            affiliates:affiliate_id (user_id, referral_code, affiliate_status, users:user_id (user_email, first_name, last_name))
        `)
        .eq('referred_user_id', referredUserID);

    if (error) {
        console.error("Error while getReferral", error.message);
        return false;
    }

    return data[0] || false;
}
// EOF referrals

export const addReferralPoints = async (addReferralPointsArgs: addReferralPointsArgs): Promise<boolean> => {
    const { points, referredUserID, description } = addReferralPointsArgs;

    const referralData = await getReferralByReferredUserID(referredUserID);
    if (typeof referralData === "boolean") return false;

    const { referral_id, affiliates, users: referralUser, membership_plans, plan_id, status } = referralData;
    if (!affiliates || !referralUser || !membership_plans || !plan_id || !status) return false;
    const { user_id: userID, users: affiliateUser } = affiliates;
    if (!userID || !affiliateUser) return false;

    let earnedPoints: number = 0;
    if (!points) {
        const conversionRateStr = await getOption("redemption_conversion_rate", true);
        if (typeof conversionRateStr !== "boolean" && conversionRateStr !== "") {
            const { points: conversionPoints } = JSON.parse(conversionRateStr.toString());
            if (conversionPoints) {
                earnedPoints = (plan_id == 2) ? (conversionPoints * 12) : conversionPoints;
            }
        }
    } else {
        earnedPoints = points;
    }

    const defaultDescription = `Earned ${earnedPoints} points for referring ${referralUser.first_name} ${referralUser.last_name}`;

    const addRewadPointData: AddRewadPointTransactionArgs = {
        points: earnedPoints,
        transactionType: RewardPointsTransactionType.Earn,
        userID,
        description: description || defaultDescription,
        referenceID: referral_id,
        referenceData: referralData
    }
    const addPoints = await addRewadPointTransaction(addRewadPointData);
    if (typeof addPoints === "boolean") return false;

    const sendToEmail = affiliateUser.user_email;
    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
        affilateUserName: affiliateUser.first_name,
        earnedPoints: earnedPoints,
        siteURL,
        memberFirstName: referralUser.first_name,
        memberLastName: referralUser.last_name,
        planName: membership_plans.plan_name,
        userEmail: sendToEmail
    };

    await sendApiEmailToUser({
        sendTo: sendToEmail,
        subject: `You've Earned ${points} Points for Your Referral!`,
        template: "earnedReferralPoints",
        context: emailTemplateData,
        extension: ".html", dirpath: "public/email-templates"
    });

    return true;
}

export const getAffiliateState = async (affiliateID: number): Promise<boolean | getAffiliateStateDBData> => {
    const { data, error } = await dbClient
        .rpc('get_affiliate_state', { p_affiliate_id: affiliateID });

    if (error) {
        console.error('Error calling get_affiliate_state function:', error.message);
        return false;
    }

    return data;
}