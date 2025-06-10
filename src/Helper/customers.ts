import { addMembership, addTransaction, addTransactionMetas, getMembershipPlan, getUserById, getUserMeta, membershipStatus, updateMembership, updateUser, updateUserMeta, userUpdateDataInterface } from "@/DbClient";
import { rbpApiCall } from "./rbpApiCallConfig";
import { BanquestAccountTypes, BanquestPaymentMethodTypes, BanquestSecCode } from "@/app/api/banquest/banquestConfig";

export interface Address {
    firstName: string;
    lastName: string;
    street: string;
    street2?: string; // Optional field
    state: string;
    city: string;
    zipCode: string;
    country: string;
}

export interface AchPaymentMethodData {
    nameOnAccount: string;
    routingNumber: string;
    accountNumber: string;
    accountType: BanquestAccountTypes;
    secCode?: BanquestSecCode;
}

export interface CreditCardMethodData {
    creditCardNonceToken: string;
    expiryMonth: number;
    expiryYear: number;
    nameOnAccount?: string;
}

export interface CustomerData {
    userId: string;
    membershipPlanId: number,
    address: Address;
    paymentMethodType: BanquestPaymentMethodTypes;
    achData?: AchPaymentMethodData;
    ccData?: CreditCardMethodData;
}

export interface SignUpResponse {
    status: boolean;
    message?: string;
    data?: object
}

export const signUpCustomer = async (customerData: CustomerData): Promise<SignUpResponse> => {
    const errorMessage = "Oops! Something went wrong. Please try again or reach out to the site administrator if the issue persists.";
    const { userId, address, paymentMethodType, achData, ccData, membershipPlanId } = customerData;
    const { firstName, lastName, street, street2, state, city, zipCode, country } = address;

    if (!paymentMethodType) {
        return {
            status: false,
            message: 'Please provide payment method type'
        };
    }

    // Get membership plan from Supabase
    const membershipPlanInfo = await getMembershipPlan(membershipPlanId);
    if (!membershipPlanInfo) {
        return {
            status: false,
            message: errorMessage
        };
    }
    const { plan_amount: planAmount, plan_frequency: planFrequency, plan_name: planName } = membershipPlanInfo;
    // EOF Get membership plan from Supabase

    // Get user from Supabase
    let user: any = await getUserById(userId, ['user_email', 'first_name', 'last_name']);
    if (!user) {
        return {
            status: false,
            message: errorMessage
        };
    }
    if (!user.first_name || !user.last_name) {
        let updateUserData: userUpdateDataInterface = {};
        if (firstName && !user.first_name) updateUserData.firstName = firstName;
        if (lastName && !user.last_name) updateUserData.lastName = lastName;
        const updateData = await updateUser(userId, updateUserData);
        if (updateData) {
            user = { ...user, 'first_name': updateData.first_name, 'last_name': updateData.last_name }
        }
    }
    // EOF Get user from Supabase


    // Create customer in Banquest if not exists
    let banquestCustomerID: any = await getUserMeta(userId, 'banquest_customer_id', true);
    if (!banquestCustomerID) {
        try {
            const customerData = {
                "customer_number": userId,
                "email": user.user_email,
                "first_name": (user.first_name) ? user.first_name : firstName,
                "last_name": (user.last_name) ? user.last_name : lastName,
                "billing_address": {
                    "first_name": firstName,
                    "last_name": lastName,
                    "street": street,
                    "street2": street2,
                    "state": state,
                    "city": city,
                    "zipCode": zipCode,
                    "country": country
                },
                "shipping_address": {
                    "first_name": firstName,
                    "last_name": lastName,
                    "street": street,
                    "street2": street2,
                    "state": state,
                    "city": city,
                    "zipCode": zipCode,
                    "country": country
                }
            };
            const { data: banquestCustomerData } = await rbpApiCall.post('/banquest/customer', customerData);
            if (!banquestCustomerData.id) {
                return {
                    status: false,
                    message: errorMessage
                };
            }
            banquestCustomerID = banquestCustomerData.id;
            await updateUserMeta(userId, 'banquest_customer_id', banquestCustomerID);
        } catch (error) {
            console.error("An unexpected error occurred:", error);
            return {
                status: false,
                message: errorMessage
            };
        }
    }
    // EOF Create customer in Banquest


    // Create payment methods for Banquest user in 
    let paymentMethodID: any = await getUserMeta(userId, 'banquest_payment_method_id', true);
    if (!paymentMethodID) {
        try {
            let paymentMethodPostData = {}
            if (paymentMethodType == BanquestPaymentMethodTypes.ach && achData) {
                const { accountNumber, accountType, routingNumber, nameOnAccount } = achData;
                paymentMethodPostData = {
                    "type": BanquestPaymentMethodTypes.ach,
                    "name": nameOnAccount,
                    "account_number": accountNumber,
                    "routing_number": routingNumber,
                    "account_type": accountType
                }
            } else if (paymentMethodType == BanquestPaymentMethodTypes.cc && ccData) {
                const { creditCardNonceToken, expiryYear, expiryMonth, nameOnAccount } = ccData;
                paymentMethodPostData = {
                    "type": BanquestPaymentMethodTypes.cc,
                    "nonce_token": creditCardNonceToken,
                    "expiry_year": expiryYear,
                    "expiry_month": expiryMonth,
                    "name": (nameOnAccount) ? nameOnAccount : `${user.first_name} ${user.last_name}`
                }
            }

            const { data: paymentMethodData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/payment-methods`, paymentMethodPostData);
            if (!paymentMethodData.status || !paymentMethodData.data) {
                return {
                    status: false,
                    message: paymentMethodData.message
                };
            }
            const { id: banquestPaymentMethodID } = paymentMethodData.data;
            paymentMethodID = banquestPaymentMethodID;
            await updateUserMeta(userId, 'banquest_payment_method_type', paymentMethodType);
            await updateUserMeta(userId, 'banquest_payment_method_id', paymentMethodID);
            await updateUserMeta(userId, 'banquest_payment_method_data', paymentMethodData.data);
        } catch (error) {
            console.error("An unexpected error occurred:", error);
            return {
                status: false,
                message: errorMessage
            };
        }
    }

    // EOF Create payment methods for Banquest user in Banquest

    // Take charge from customer
    let membershipID: number;
    try {
        const customerChargePostData: object = {
            "description": `${user.first_name} ${user.last_name} ${planName} first payment`,
            "amount": planAmount,
            "source": paymentMethodID,
            "source_type": "pm"
        }
        const { data: customerChargeData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/transactions`, customerChargePostData);
        if (!customerChargeData.status || !customerChargeData.data) {
            return {
                status: false,
                message: customerChargeData.message
            };
        }

        const membershipStatusValue = (!customerChargeData.data.status || customerChargeData.data.status !== "Approved") ? membershipStatus.Hold : membershipStatus.Active;

        const membershipId = await addMembership({
            planId: membershipPlanId,
            userId: userId,
            status: membershipStatusValue
        });

        const transactionId = await addTransaction({
            membershipId: membershipId,
            planId: membershipPlanId,
            userId: userId,
            banquestData: (customerChargeData.data.transaction) && customerChargeData.data.transaction,
            status: customerChargeData.data.transaction.status_details.status.toLowerCase()
        });

        membershipID = membershipId;

        if (customerChargeData.data.transaction) {
            const banquestTransaction = customerChargeData.data.transaction
            const transactionMeta: any = {
                banquest_transaction_id: banquestTransaction.id,
                banquest_transaction_customer_id: banquestTransaction.customer.customer_id,
                banquest_transaction_status: banquestTransaction.status_details.status,
                banquest_transaction_description: banquestTransaction.transaction_details.description,
                banquest_transaction_batch_id: banquestTransaction.transaction_details.batch_id,
                banquest_transaction_card_details_name: banquestTransaction.card_details.name,
                banquest_transaction_card_last4: banquestTransaction.card_details.last4,
                banquest_transaction_card_details_expiry_month: banquestTransaction.card_details.expiry_month,
                banquest_transaction_card_details_expiry_year: banquestTransaction.card_details.expiry_year,
                banquest_transaction_card_details_card_type: banquestTransaction.card_details.card_type,
                banquest_charge_status: customerChargeData.data.status,
                banquest_charge_reference_number: customerChargeData.data.reference_number,
                banquest_charge_auth_code: customerChargeData.data.auth_code
            }
            await addTransactionMetas(transactionId, transactionMeta);
        }

    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return {
            status: false,
            message: errorMessage
        };
    }
    // EOF Take charge from customer

    // Create recurring transaction in Banquest
    try {
        const recurringSchedulesPostData: object = {
            "title": `${user.first_name} ${user.last_name} ${planName} recurring payments`,
            "amount": planAmount,
            "frequency": planFrequency,
            "payment_method_id": parseInt(paymentMethodID)
        }
        const { data: recurringSchedulesData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/transactions/recurring-schedules`, recurringSchedulesPostData);
        if (!recurringSchedulesData.status || !recurringSchedulesData.data) {
            return {
                status: false,
                message: recurringSchedulesData.message
            };
        }
        const { id: recurringScheduleId, next_run_date: nextPaymentDate, status: recurringScheduleStatus, frequency, active } = recurringSchedulesData.data;

        await updateMembership(membershipID, {
            nextPaymentDate: nextPaymentDate,
            banquestRecurringScheduleId: recurringScheduleId
        });

        await updateUserMeta(userId, 'banquest_membership_recurring_schedule_id', recurringScheduleId);

    } catch (error) {
        console.error("An unexpected error occurred:", error);
        return {
            status: false,
            message: errorMessage
        };
    }
    // EOF Create recurring transaction in Banquest

    return {
        status: true,
        message: "User signup successful"
    };
}
