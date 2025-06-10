import crypto from 'node:crypto';
import { NextResponse } from "next/server";
import { banquestApiCall, webhookSignatureKey } from "@/api/banquest/banquestConfig";
import { addReferralPoints, addTransaction, addTransactionMetas, getMembershipByScheduleID, getMembershipPlan, getTransactionByBanquestID, getUserById, membershipStatus, updateMembership, updateTransaction, updateTransactionMeta } from '@/DbClient';
import { rbpApiCall } from '@/Helper/rbpApiCallConfig';
import { formatDate, priceFormat } from '@/Helper/commonHelpers';
import { sendApiEmailToUser } from '@/CommonComponent/SendEmailToUser';


interface ApiResponse<T = any> {
    status: boolean;
    message?: string;
    data?: T;
    error?: any; // Optional error property
}

function doesSignatureMatch(xSignatureHeader: string, signatureKey: string, body: string): boolean {
    const hash = crypto.createHmac('sha256', signatureKey).update(body).digest('hex');
    return hash === xSignatureHeader;
}

interface SendMembershipRenewedEmailToUser {
    userName: string;
    userEmail: string;
    planName: string;
    startDate?: string | Date;
    planAmount?: string;
}
const sendMembershipRenewedEmailToUser = async (args: SendMembershipRenewedEmailToUser) => {
    const { userName, userEmail, planName, startDate = formatDate(new Date), planAmount = "NA" } = args;
    const emailTemplateData = {
        siteURL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
        userName,
        planName,
        startDate,
        planAmount,
        userEmail: userEmail
    };

    const data = await sendApiEmailToUser({
        sendTo: userEmail,
        subject: `Your Membership Has Been Renewed - RBP Club`,
        template: 'membershipRenewed',
        context: emailTemplateData,
        extension: ".html",
        dirpath: "public/email-templates"
    })
    return data;
}

export async function POST(req: Request) {
    const xSignatureHeader = req.headers.get('x-signature');
    const signatureKey = webhookSignatureKey;

    if (!xSignatureHeader || !signatureKey) {
        console.log("Missing signature or signature key");
        return NextResponse.json<ApiResponse>({ status: false, error: "Missing signature or signature key" }, { status: 200 });
    }

    const body = await req.json();
    const bodyString = JSON.stringify(body);
    const isValid = doesSignatureMatch(xSignatureHeader, signatureKey, bodyString);

    if (!isValid) {
        console.log("Invalid signature", isValid);
        return NextResponse.json<ApiResponse>({ status: false, error: "Invalid signature" }, { status: 200 });
    }

    // MY OTHER ACTIONS

    const { event, type, data } = body;
    console.log("Request Body event:", event);
    console.log("Request Body type:", type);
    console.log("Request Body data:", data);

    if (event === "batch" && type === "close") {
        console.log("Processing batch close");

        const { id: batchId } = data;
        const response = await banquestApiCall.get(`/batches/${batchId}/transactions?limit=${50}`);
        if (response.status !== 200) {
            console.log("The batch transactions not found.");
            return NextResponse.json({ status: false, message: "The batch transactions not found." }, { status: 200 });
        }
        const batchTransactions: Array<any> = response.data;

        await Promise.all(batchTransactions.map(async (transaction) => {
            await processTransaction(transaction);
        }));
    } else if (event === "transaction") {
        console.log("Processing transaction condition");
        const { transaction } = data;
        if (!transaction) {
            console.log("The transaction Data not found in body.");
            return NextResponse.json({ status: false, message: "The transaction Data not found in body." }, { status: 200 });
        }
        await processTransaction(transaction);
    }

    console.log("Webhook process done.");
    return NextResponse.json<ApiResponse>({ status: true, message: "Webhook process done." }, { status: 200 });
}

const processTransaction = async (transaction: any) => {
    const { id: banquestTransactionID, status_details: statusDetails, customer, transaction_details: transactionDetails } = transaction;
    const { customer_id: banquestCustomerID } = customer;
    const { schedule_id } = transactionDetails;
    const banquestTransactionStatus = statusDetails.status;

    let transactionStatusAction = membershipStatus.Active;
    if (["pending", "declined", "error", "blocked"].includes(banquestTransactionStatus)) {
        transactionStatusAction = membershipStatus.Hold;
    } else if (banquestTransactionStatus == "cancelled") {
        transactionStatusAction = membershipStatus.Canceled;
    }

    console.log("Checking if Transaction is available");
    const transactionDBData: any = await getTransactionByBanquestID(banquestTransactionID);
    if (transactionDBData) {
        // Process for memebership payment
        console.log("Process for memebership payment", transactionDBData);
        const { transaction_id: transactionID, membership_id: membershipID, transaction_status: transactionStatus, user_id: userID } = transactionDBData;

        const oldTransactionStatus = transactionStatus;

        await updateTransaction(transactionID, {
            transaction_status: banquestTransactionStatus.toLowerCase()
        });

        await updateTransactionMeta(transactionID, "banquest_transaction_status", banquestTransactionStatus);
        await updateTransactionMeta(transactionID, "banquest_data", transaction);

        let membershipStatusValue = membershipStatus.Active;
        if (["pending", "declined", "error", "blocked"].includes(banquestTransactionStatus)) {
            membershipStatusValue = membershipStatus.Hold;
        } else if (banquestTransactionStatus == "cancelled") {
            membershipStatusValue = membershipStatus.Canceled;
        }

        // Send email to use when membership status is Hold or Canceled

        await updateMembership(membershipID, {
            status: membershipStatusValue
        });

        // Add points to Affilate
        if (["pending", "declined", "error", "blocked", "cancelled"].includes(oldTransactionStatus) && membershipStatusValue == membershipStatus.Active && userID) {
            console.log("Trying to addReferralPoints");
            await addReferralPoints({ referredUserID: userID });
        } else {
            console.log("Nothing to addReferralPoints", {
                oldTransactionStatus: oldTransactionStatus,
                membershipStatusValue: membershipStatusValue,
                userID: userID
            });
        }
        // EOF Add points to Affilate

        console.log("transactionUpdateData", {
            "membershipID": membershipID,
            "transactionID": transactionID
        });
    } else if (schedule_id) {
        // Process for recurring payments
        console.log("Process for recurring payments")
        console.log("schedule_id", schedule_id);
        console.log("Calling recurringSchedulesResponse");
        const recurringSchedulesResponse = await rbpApiCall.get(`/banquest/customer/${banquestCustomerID}/transactions/recurring-schedules/${schedule_id}`);

        let scheduleNextRunDate;
        if (recurringSchedulesResponse.status === 200) {
            const { next_run_date } = recurringSchedulesResponse.data.data;
            scheduleNextRunDate = next_run_date;
        }

        console.log("Calling membershipData");
        const membershipData = await getMembershipByScheduleID(schedule_id);
        if (membershipData) {
            console.log("Inside membershipData");
            // Process for user membership recurring payments
            const { membership_id: membershipID, user_id: userID, plan_id: planID, status: membershipStatusDB, next_run_date } = membershipData;

            const transactionID = await addTransaction({
                membershipId: membershipID,
                planId: planID,
                userId: userID,
                banquestData: transaction,
                status: banquestTransactionStatus.toLowerCase()
            });

            let transactionMeta: any = {
                banquest_transaction_id: banquestTransactionID,
                banquest_transaction_customer_id: banquestCustomerID,
                banquest_transaction_status: banquestTransactionStatus,
                banquest_transaction_description: transactionDetails.description,
                banquest_transaction_batch_id: transactionDetails.batch_id
            }
            if (transaction.card_details) {
                transactionMeta = {
                    ...transactionMeta,
                    banquest_transaction_card_details_name: transaction.card_details.name,
                    banquest_transaction_card_last4: transaction.card_details.last4,
                    banquest_transaction_card_details_expiry_month: transaction.card_details.expiry_month,
                    banquest_transaction_card_details_expiry_year: transaction.card_details.expiry_year,
                    banquest_transaction_card_details_card_type: transaction.card_details.card_type
                }
            } else if (transaction.check_details) {
                transactionMeta = {
                    ...transactionMeta,
                    banquest_transaction_check_details_name: transaction.check_details.name,
                    banquest_transaction_check_details_routing_number: transaction.check_details.routing_number,
                    banquest_transaction_check_details_account_number_last4: transaction.check_details.account_number_last4,
                    banquest_transaction_check_details_account_type: transaction.check_details.account_type
                }
            }
            await addTransactionMetas(transactionID, transactionMeta);

            const membershipUpdateStatus: membershipStatus = (transactionStatusAction != membershipStatusDB) ? transactionStatusAction : membershipStatusDB;
            let nextPaymentDate = next_run_date;
            if (scheduleNextRunDate) {
                nextPaymentDate = scheduleNextRunDate;
            }

            await updateMembership(membershipID, {
                status: membershipUpdateStatus,
                nextPaymentDate
            });
            const membershipPlanData = await getMembershipPlan(planID);
            const userData: {
                user_email: string,
                first_name: string
            } | boolean | any = await getUserById(userID, ['user_email', 'first_name']);
            if (membershipPlanData && typeof userData != "boolean") {
                try {
                    await sendMembershipRenewedEmailToUser({
                        userEmail: userData.user_email,
                        userName: userData.first_name,
                        planName: membershipPlanData.plan_name,
                        planAmount: priceFormat(membershipPlanData.plan_amount) + '/' + membershipPlanData.plan_frequency
                    });
                } catch (error) {
                    console.error("Error while send email", error);
                }
            }

            // Add points to Affilate
            if (transactionStatusAction === membershipStatus.Active) {
                console.log("Trying to addReferralPoints");
                await addReferralPoints({ referredUserID: userID });
            }
            // EOF Add points to Affilate

            console.log("membershipUpdateData", { "membershipID": membershipID, "transactionID": transactionID });
        }
    }
}