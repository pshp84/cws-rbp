import { dbClient, getAvailablePoints, getOption, getOptions, getUserById, getUserMembership, getUserMeta, membershipStatus } from "@/DbClient"
import { rbpApiCall } from "./rbpApiCallConfig";
import { addRewadPointTransaction, AddRewadPointTransactionArgs, getRewadPointTransactionsByReferenceIDs, RewardPointsTransactionType, updateRewadPointTransaction, UpdateRewadPointTransactionArgs } from "@/DbClient";
import { priceFormat } from "./commonHelpers";

export const refreshRewardPoints = async (userID: string) => {

    /* Get earn point rules */
    const earnPointsRate: number = await getOption("earn_points_rate", true);
    if (!earnPointsRate) {
        console.error("earn_points_conversion_rate and earn_points_rounding_mode settings are not avaliable");
        return false;
    }
    /* EOF Get earn point rules */

    const rentTransactions = await getUserRentTransactions(userID);
    if (!rentTransactions) {
        return false;
    }

    const rentTransactionsID = rentTransactions.map((data: { transaction_id: string; }) => data.transaction_id);
    const rewardPointTransactions = await getRewadPointTransactionsByReferenceIDs(rentTransactionsID);

    let transactionsReferenceIDs: Array<string> = [];
    if (rewardPointTransactions && rewardPointTransactions.length > 0) {
        transactionsReferenceIDs = rewardPointTransactions.map((data: { reference_id: string; }) => data.reference_id);
    }

    await Promise.all(
        rentTransactions.map(async (rentTransaction: any) => {
            const rentTransactionID = rentTransaction.transaction_id || false;
            const pending = rentTransaction.pending;
            if (!rentTransactionID || pending === true) return;
            if (transactionsReferenceIDs.includes(rentTransactionID) && rewardPointTransactions) {
                const transactionID = rewardPointTransactions.filter((data: { reference_id: any; }) => data.reference_id == rentTransactionID)[0].transaction_id;

                const updateRewadPointTransactionArgs: UpdateRewadPointTransactionArgs = {
                    referenceData: rentTransaction
                };
                await updateRewadPointTransaction(transactionID, updateRewadPointTransactionArgs);
                return;
            }

            const rentAmount = rentTransaction.amount;
            if (rentAmount < 1) return;

            let points = earnPointsRate;

            if (points <= 0) return;

            const addArgs: AddRewadPointTransactionArgs = {
                points,
                transactionType: RewardPointsTransactionType.Earn,
                userID,
                referenceData: rentTransaction,
                referenceID: rentTransactionID,
                conversionRate: earnPointsRate,
                description: `${points} points earned by paying ${priceFormat(rentAmount)} rent.`
            }

            await addRewadPointTransaction(addArgs);
        })
    );

    return true;
}

export const getUserRentTransactions = async (userID: string) => {
    const plaidAccessToken = await getUserMeta(userID, "plaid_access_token", true);

    if (!plaidAccessToken) {
        console.error("User is not connected with plaid");
        return false;
    }

    const membershipData = await getUserMembership(userID, true);
    if (!membershipData) {
        console.error("User don't have membership");
        return false;
    }

    let { data: lease_info, error } = await dbClient
        .from('lease_info')
        .select('rent_date, rent_amount')
        .eq('user_id', userID);

    if (error || !lease_info) {
        console.error("User don't have rent_date and rent_amount");
        return false;
    }

    const rentDay = lease_info.map(data => data.rent_date)[0];
    const rentAmount = lease_info.map(data => data.rent_amount)[0];
    if (!rentDay || !rentAmount) {
        console.error("User don't have rent_date and rent_amount");
        return false;
    }

    const { start_date: membershipStartDate, status } = membershipData;

    if (status != membershipStatus.Active) {
        console.error("User's membership is not active");
        return false;
    }

    let startDate = membershipStartDate;

    /* Check if date is older than 3 months */
    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    const membershipDate = new Date(membershipStartDate);
    if (membershipDate < threeMonthsAgo) {
        startDate = `${threeMonthsAgo.getFullYear()}-${threeMonthsAgo.getMonth()}-${rentDay}`;
    }
    /* EOF Check if date is older than 3 months */

    const payload = {
        "access_token": plaidAccessToken,
        "personal_finance_category_detailed": "RENT_AND_UTILITIES_RENT",
        "start_date": startDate
    }
    const response = await rbpApiCall.post("/plaid/transactions", payload);

    if (!response.data.status) {
        console.error("Error while getUserRentTransactions");
        return false;
    }

    let { transactions } = response.data;
    if (!transactions) {
        return false;
    }

    transactions = transactions.filter((data: { authorized_date: string; amount: number }) => {
        const authorizedDate = new Date(data.authorized_date);
        const transactionAmount = data.amount;
        if (rentDay == authorizedDate.getDay() && transactionAmount == rentAmount) {
            return data;
        }
    });

    return transactions;
}

export const redeemRewardPoints = async (userID: string, points: number, email: string = "") => {

    const userData: any = await getUserById(userID, ["first_name", "last_name", "user_email"]);
    if (!userData) {
        console.error("User is not available");
        return false;
    }

    const redeemPointsConversionRate = await getOption("redemption_conversion_rate", true);
    if (!redeemPointsConversionRate) {
        console.error("redemption conversion rate setting is not available");
        return false;
    }

    const avaliablePoints = await getAvailablePoints(userID);
    if (!avaliablePoints) {
        console.error("User don't have avaliable points");
        return false;
    }

    if (points > parseInt(avaliablePoints)) {
        console.error("Points are invalid");
        return false;
    }

    /* Redeem Points Rate Conversion */
    const { points: conversionPoints } = JSON.parse(redeemPointsConversionRate);
    const redeemAmount = points / conversionPoints;
    /* EOF Redeem Points Rate Conversion */

    try {
        const { first_name: firstName, last_name: lastName, user_email: userEmail } = userData;

        const recipientEmail = (email !== "") ? email : userEmail;

        const tremendousOrderPayload = {
            reward_amount: redeemAmount,
            recipient_name: `${firstName} ${lastName}`,
            recipient_email: recipientEmail
        }
        const tremendousOrderResponse = await rbpApiCall.post("/tremendous/orders", tremendousOrderPayload);
        if (!tremendousOrderResponse || !tremendousOrderResponse.data.status) {
            console.error("Something is wrong with tremendous order");
            return false;
        }

        const { rewards } = tremendousOrderResponse.data.data.order;

        if (!rewards[0].id) {
            console.error("Something is wrong with tremendous order. rewards is not generated");
            return false;
        }

        const AddRewadPointTransactionArgs: AddRewadPointTransactionArgs = {
            points,
            userID,
            transactionType: RewardPointsTransactionType.Redeem,
            conversionRate: redeemPointsConversionRate,
            referenceData: tremendousOrderResponse.data.data,
            referenceID: rewards[0].id,
            description: `${priceFormat(redeemAmount)} rewards is sent to ${recipientEmail}`
        }
        const RewadPointTransaction = await addRewadPointTransaction(AddRewadPointTransactionArgs);

        return (!RewadPointTransaction) ? false : true;

    } catch (error) {
        console.error(error.message);
        return false;
    }
}