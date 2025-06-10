import { addOrder, addSubscription, getAttributeValueNameByID, getProduct, getProductMeta, getUserById, getUserMeta, getVariationByAttributes, membershipPlanFrequency, orderDataInterface, orderItemsInterface, OrderStatuTypes, productStockStatus, SelectedAttribute, subscriptionDataInterface } from "@/DbClient"
import { Address } from "./customers"
import { rbpApiCall } from "./rbpApiCallConfig";

export interface HvacFilterSubscriptionInterface {
    userID: string,
    productID: number,
    selectedAttributes: Array<SelectedAttribute>,
    address?: Address
}

export const hvacFilterCheckout = async (hvacFilterArgs: HvacFilterSubscriptionInterface) => {
    const { userID, productID, selectedAttributes } = hvacFilterArgs;
    let { address } = hvacFilterArgs;
    const userData: any = await getUserById(userID);

    if (!userData) {
        console.error("User not found");
        return false;
    }

    const attributeValues = selectedAttributes.map(data => data.attributeValueID);
    const variantData = await getVariationByAttributes(productID, attributeValues);

    if (!variantData || variantData === null) {
        console.error("Product variant not found");
        return false;
    }

    const { product_id: variantID } = variantData;
    const variantProductData = await getProduct(variantID);

    if (!variantProductData) {
        console.error("Product variant data not found");
        return false;
    }

    const { name: productVariantName, price: variantPrice, is_subscription: isSubscription, stock_status: stockStatus } = variantProductData;

    if (isSubscription === "false") {
        console.error("Product is not allowed for subscription");
        return false;
    }

    if (stockStatus === productStockStatus.outOfStock) {
        console.error("Product is out of stock");
        return false;
    }

    const subscriptionAmount = parseFloat(variantPrice);

    const { attributeValueID: deliveryFrequencyAttribute } = selectedAttributes.filter((data) => data.attributeID === 45)[0];
    const frequencyAttributName = await getAttributeValueNameByID(deliveryFrequencyAttribute);

    let deliveryFrequency: membershipPlanFrequency = membershipPlanFrequency.Quarterly;

    if (frequencyAttributName) {
        let frequencyText = frequencyAttributName.toLowerCase();
        frequencyText = frequencyText.replace(" (premium)", "");
        frequencyText = frequencyText.replace(" (free)", "");
        frequencyText = frequencyText.replace(" (paid)", "");

        switch (frequencyText) {
            case "weekly":
                deliveryFrequency = membershipPlanFrequency.Weekly;
                break;

            case "monthly":
                deliveryFrequency = membershipPlanFrequency.Monthly;
                break;

            case "quarterly":
                deliveryFrequency = membershipPlanFrequency.Quarterly;
                break;

            case "annually":
                deliveryFrequency = membershipPlanFrequency.Annually;
                break;

            case "every 2 weeks":
                deliveryFrequency = membershipPlanFrequency.Biweekly;
                break;

            case "every 2 months":
                deliveryFrequency = membershipPlanFrequency.Bimonthly;
                break;

            case "every 6 months":
                deliveryFrequency = membershipPlanFrequency.Biannually;
                break;

            case "every 12 months":
                deliveryFrequency = membershipPlanFrequency.Annually;
                break;

            case "every 1 year":
                deliveryFrequency = membershipPlanFrequency.Annually;
                break;

            case "every year":
                deliveryFrequency = membershipPlanFrequency.Annually;
                break;
        }
    }

    const addSubscriptionData: subscriptionDataInterface = {
        productID,
        variantID,
        userID,
        subscriptionAmount,
        frequency: deliveryFrequency
    }

    const subscriptionData = await addSubscription(addSubscriptionData);

    if (!subscriptionData) {
        return false;
    }

    const { subscription_id: subscriptionID, banquest_recurring_schedule_id: banquestRecurringScheduleID } = subscriptionData;

    //Take a charge
    const paymentMethodID = await getUserMeta(userID, 'banquest_payment_method_id', true);
    const banquestCustomerID = await getUserMeta(userID, 'banquest_customer_id', true);

    const customerChargePostData: object = {
        "description": `${userData.first_name} ${userData.last_name} ${productVariantName} subscription first payment`,
        "amount": subscriptionAmount,
        "source": paymentMethodID,
        "source_type": "pm"
    }
    const { data: customerChargeData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/transactions`, customerChargePostData);

    if (!customerChargeData.status) {
        console.error("Error while HVAC subscription first payment ", customerChargeData.message);
        return false;
    }

    const banquestTransaction = customerChargeData.data.transaction;
    const { id: banquestTransactionID, status_details: banquestTransactionDetails } = banquestTransaction;

    const orderItems: orderItemsInterface = {
        productID,
        variantID,
        price: subscriptionAmount,
        quantity: 1
    }

    const orderAddData: orderDataInterface = {
        userID,
        orderItems: [orderItems],
        banquestTransaction,
        banquestTransactionID,
        banquestTransactionStatus: banquestTransactionDetails.status.toLowerCase(),
        billingAddress: address,
        shippingAddress: address,
        subscriptionID,
        orderStatus: OrderStatuTypes.Processing,
        itemsSubtotal: subscriptionAmount,
        orderTotal: subscriptionAmount
    }

    if (customerChargeData.data.status.toLowerCase() !== "approved") {
        orderAddData.orderStatus = OrderStatuTypes.PendingPayment
    }

    const orderData = await addOrder(orderAddData);

    if (!orderData) {
        return false;
    }

    return {
        subscriptionData: subscriptionData,
        orderData: orderData
    };
    //EOF Take a charge
}