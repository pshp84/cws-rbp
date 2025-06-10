import { BanquestTransactionStatus } from "@/app/api/banquest/banquestConfig";
import { dataResponseInterface, dbClient, getProduct, membershipPlanFrequency, membershipStatus } from ".";
import { Address } from "@/Helper/customers";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";

export enum OrderStatuTypes {
    PendingPayment = "Pending payment", //The order has been received, but no payment has been made. Pending payment orders are generally awaiting customer action.
    OnHold = "On hold", // The order is awaiting payment confirmation. Stock is reduced, but you need to confirm payment. 
    Processing = "Processing", // Payment has been received (paid), and the stock has been reduced. The order is awaiting fulfillment. 
    Completed = "Completed", // Order fulfilled and complete.
    Failed = "Failed", // The customer’s payment failed or was declined, and no payment has been successfully made
    Draft = "Draft", // Draft orders are created when customers start the checkout process while the block version of the checkout is in place.
    Canceled = "Canceled", // The order was canceled by an admin or the customer.
    Refunded = "Refunded" // Orders are automatically put in the Refunded status when an admin or shop manager has fully refunded the order’s value after payment.
}

export enum OrderNoteTypes {
    Private = "private",
    Customer = "customer",
}

export interface orderItemsInterface {
    orderID?: number,
    productID: number,
    variantID?: number
    quantity?: number,
    price?: number
}

export interface orderDataInterface {
    userID: string,
    orderStatus?: OrderStatuTypes,
    orderItems: Array<orderItemsInterface>,
    itemsSubtotal?: number,
    shippingAmount?: number,
    taxAmount?: number,
    orderTotal?: number,
    shippingAddress?: Address,
    billingAddress?: Address
    subscriptionID?: number,
    banquestTransaction?: JSON | object,
    banquestTransactionID?: number,
    banquestTransactionStatus?: BanquestTransactionStatus
}

export interface ordersArgsInterface {
    userID?: string,
    orderStatus?: OrderStatuTypes,
    limit?: number,
    page?: number,
    displayOrderBy?: string,
    displayOrder?: string
}

export interface subscriptionDataInterface {
    userID: string,
    productID: number,
    variantID?: number,
    subscriptionAmount: number,
    startDate?: Date,
    endDate?: Date,
    nextOrderDate?: Date,
    frequency?: membershipPlanFrequency,
    subscriptionStatus?: membershipStatus,
    banquestRecurringScheduleID?: number
}

export interface subscriptionsArgsInterface {
    userID?: string,
    subscriptionsStatus?: membershipStatus,
    limit?: number,
    page?: number,
    displayOrderBy?: string,
    displayOrder?: string
}

export interface subscriptionUpdateDataInterface {
    subscriptionStatus?: membershipStatus,
    frequency?: membershipPlanFrequency,
    banquestRecurringScheduleID?: number,
    nextOrderDate?: Date,
    endDate?: Date,
    amount?: number
}

export interface getOrderNotesArgsInterface {
    orderID: number,
    noteType?: OrderNoteTypes
}

export const addOrder = async (orderData: orderDataInterface) => {
    let { userID, orderStatus = OrderStatuTypes.PendingPayment, orderItems, itemsSubtotal = 0, shippingAmount = 0, taxAmount = 0, orderTotal = 0, shippingAddress, billingAddress, subscriptionID, banquestTransaction, banquestTransactionID, banquestTransactionStatus } = orderData;

    if (!orderItems || orderItems.length <= 0) {
        console.error("Order items not provided");
        return false;
    }

    // Create Order
    const { data: orderInsertQueryData, error: orderInsertQueryError } = await dbClient
        .from('orders')
        .insert([
            { user_id: userID, order_status: orderStatus },
        ])
        .select('order_id')
        .single();

    if (orderInsertQueryError) {
        console.error("Error in insert order", orderInsertQueryError.message);
        return false;
    }

    const { order_id: orderID } = orderInsertQueryData;
    if (!orderID) {
        console.error("Order id not found");
        return false;
    }
    // EOF Create Order


    // Add Order Items
    const orderItemsData: Array<orderItemsInterface> = [];
    let itemsSubtotalCount = 0;
    orderItems.forEach(item => {
        const itemPrice = (item.price) ? item.price : 0;
        const itemQuantity = (item.quantity) ? item.quantity : 1;
        itemsSubtotalCount += itemPrice * itemQuantity;
        orderItemsData.push({
            orderID,
            productID: item.productID,
            variantID: (item.variantID) ? item.variantID : 0,
            price: itemPrice,
            quantity: itemQuantity
        });
    });
    const orderItemsInsert = await addOrderItems(orderItemsData);
    if (!orderItemsInsert) {
        return false;
    }
    // EOF Add Order Items


    // Calculate order total
    if (itemsSubtotal === 0) itemsSubtotal = itemsSubtotalCount;
    if (orderTotal === 0) {
        orderTotal = itemsSubtotal + shippingAmount + taxAmount;
    }
    // EOF Calculate order total


    // Save order meta data
    const orderMetaDataInsert: any = {
        items_subtotal: itemsSubtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        order_total: orderTotal
    };
    if (subscriptionID) orderMetaDataInsert.subscription_id = subscriptionID;
    if (banquestTransaction) orderMetaDataInsert.banquest_transaction_data = banquestTransaction;
    if (banquestTransactionID) orderMetaDataInsert.banquest_transaction_id = banquestTransactionID;
    if (banquestTransactionStatus) orderMetaDataInsert.banquest_transaction_status = banquestTransactionStatus;
    if (!shippingAddress && billingAddress) {
        shippingAddress = billingAddress;
    } else if (shippingAddress && !billingAddress) {
        billingAddress = shippingAddress;
    }
    if (shippingAddress) orderMetaDataInsert.shipping_address = shippingAddress;
    if (billingAddress) orderMetaDataInsert.billing_address = billingAddress;
    await addOrderMetas(orderID, orderMetaDataInsert);
    // EOF Save order meta data

    return await getOrderByID(orderID, true);
}

export const updateOrderStatus = async (orderID: number, orderStatus: OrderStatuTypes) => {
    const { data, error } = await dbClient
        .from('orders')
        .update({ order_status: orderStatus })
        .eq('order_id', orderID)
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }
    return data;
}

export const getOrderByID = async (orderID: number, withDetails: boolean = false) => {
    let { data: orderData, error: orderError } = await dbClient
        .from('orders')
        .select(`*,
            users:user_id (user_email, first_name, last_name)`)
        .eq('order_id', orderID)
        .single();

    if (orderError) {
        console.error(orderError.message);
        return false;
    }

    if (!withDetails) return orderData;

    const { data: orderMetaData, error: orderMetaError } = await dbClient
        .from('ordermeta')
        .select(`meta_key, meta_value`)
        .eq('order_id', orderID);

    if (!orderMetaError && orderMetaData) {
        orderData = { ...orderData, orderMeta: orderMetaData }
    }

    const { data: orderItemsData, error: orderItemsError } = await dbClient
        .from('order_items')
        .select(`product_id, variant_id, quantity, price`)
        .eq('order_id', orderID);

    if (!orderItemsError && orderItemsData) {
        const variableID = orderItemsData.map(data => data.product_id)[0];
        const variantID = orderItemsData.map(data => data.variant_id)[0];
        const productID = [variableID, variantID];

        const { data: productsData, error: productsError } = await dbClient
            .from('products')
            .select('name,slug,product_type,product_parent')
            .in('product_id', productID);

        if (productsData && !productsError) {
            orderData = { ...orderData, productsData };
        }

        orderData = { ...orderData, orderItems: orderItemsData }
    }

    return orderData;
}

export const getOrders = async (orderArgs: ordersArgsInterface = {}) => {
    const { userID, orderStatus, displayOrderBy = 'order_date', displayOrder = 'desc', limit = 10, page = 1 } = orderArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    // Apply filters based on search parameter
    let query = dbClient.from('orders').select(`*,
        users:user_id (user_email, first_name, last_name)`, { count: 'exact' });

    if (limit !== -1) {
        // Apply pagination only if limit is not -1
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    if (userID) query = query.eq('user_id', userID);
    if (orderStatus) query = query.eq('order_status', orderStatus);

    // Apply sorting
    query = query.order(displayOrderBy, { ascending: displayOrder === 'asc' });

    // Execute query and handle errors
    const { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "Orders not found";
        return returnData;
    }

    // Calculate pagination details only if limit is not -1
    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;

    return returnData;
}

export const getOrderMeta = async (orderID: number, metaKey: string | number | any = "", single: boolean = false) => {
    let query: any = dbClient.from('ordermeta').select('meta_key, meta_value').eq('order_id', orderID);

    if (metaKey != "") {
        query = query.eq('meta_key', metaKey);
    }

    if (single) {
        query = query.select('meta_value').single();
    }

    const { data, error } = await query;

    // Handle errors
    if (error || !data) {
        console.error("Error fetching ordermeta: ", error);
        return false;
    }

    if (single && data.meta_value) {
        return data.meta_value;
    }

    return data;
}

export const updateOrderMeta = async (orderID: number, metaKey: string | number | any, metaValue: any, forceUpdate: boolean = false) => {

    let isMetaExist = false;
    if (!forceUpdate) {
        isMetaExist = await getOrderMeta(orderID, metaKey, true);
    }

    const isUpdate = !!isMetaExist;
    let query: any = dbClient.from('ordermeta');

    if (isUpdate) {
        query = query.update({ 'meta_value': metaValue })
            .eq('order_id', orderID)
            .eq('meta_key', metaKey);
    } else {
        query = query.insert([{
            order_id: orderID,
            meta_key: metaKey,
            meta_value: metaValue
        }]);
    }

    const { data, error } = await query;

    if (error || !data) {
        console.error("Error updating order meta: ", error);
        return false;
    }

    return true;
}

export const addOrderMetas = async (orderID: number, orderMetaData: object | any) => {
    const orderMetaInsert = [];
    for (const key in orderMetaData) {
        if (Object.prototype.hasOwnProperty.call(orderMetaData, key)) {
            const metaKey = key;
            const metaValue = orderMetaData[key];
            orderMetaInsert.push({
                order_id: orderID,
                meta_key: metaKey,
                meta_value: metaValue
            })
        }
    }
    const { data, error } = await dbClient.from('ordermeta').insert(orderMetaInsert);

    if (error || !data) {
        console.error("Error updating order meta: ", error);
        return false;
    }
    return true;
}

export const getOrderByMeta = async (metaKey: string, metaValue: string | number | any, single: boolean = false) => {
    let query: any = dbClient.from('ordermeta')
        .select('orders(*)')
        .eq('meta_key', metaKey)
        .eq('meta_value', metaValue)
        .single();

    if (single) {
        query = query.select('order_id')
    }

    const { data, error } = await query;

    // Handle errors
    if (error || !data) {
        console.error("Error fetching order: ", error);
        return false;
    }

    if (!single) {
        return data.orders;
    }

    return data;
}

export const getOrderByBanquestID = async (banquestTransactionID: string | number | any, single: boolean = false) => {
    return await getOrderByMeta("banquest_transaction_id", banquestTransactionID, single);
}


export const addOrderItems = async (orderItemsData: Array<orderItemsInterface>) => {
    const orderItemsInsertData: Array<any> = [];
    orderItemsData.forEach(async (orderItemData) => {
        const { orderID, productID, variantID = 0, quantity = 1, price = 0.00 } = orderItemData;
        if (orderID) {
            orderItemsInsertData.push({
                order_id: orderID,
                product_id: productID,
                variant_id: variantID,
                quantity,
                price
            })
        }
    });

    if (orderItemsInsertData.length <= 0) {
        console.error("Noting to insert in order items");
        return false;
    }

    const { data, error } = await dbClient
        .from('order_items')
        .insert(orderItemsInsertData)
        .select();

    if (error) {
        console.error("Error in order items insert", error.message);
        return false;
    }

    return data;
}


export const addSubscription = async (subscriptionData: subscriptionDataInterface) => {
    let { userID, productID, variantID = 0, frequency = membershipPlanFrequency.Quarterly, subscriptionStatus = membershipStatus.Hold, startDate, endDate, nextOrderDate, banquestRecurringScheduleID, subscriptionAmount } = subscriptionData;

    if (!banquestRecurringScheduleID) {
        const { data: usermeta, error: userMetaError } = await dbClient
            .from('usermeta')
            .select('meta_key, meta_value')
            .eq('user_id', userID)
            .in('meta_key', ['banquest_customer_id', 'banquest_payment_method_id']);

        if (userMetaError) {
            console.error(userMetaError.message);
            return false;
        }

        let productData: any;
        if (variantID !== 0) {
            productData = await getProduct(variantID);
        } else {
            productData = await getProduct(productID);
        }

        if (!productData) {
            console.error("Product not found in subscription process");
            return false;
        }
        const { name: productName } = productData;
        const paymentMethodID = usermeta.filter((data) => data.meta_key == 'banquest_payment_method_id')[0];
        const banquestCustomerID = usermeta.filter((data) => data.meta_key == 'banquest_customer_id')[0];

        const recurringSchedulesPostData: any = {
            "title": `${productName} recurring payments`,
            "amount": subscriptionAmount,
            "frequency": frequency,
            "payment_method_id": parseInt(paymentMethodID.meta_value)
        }
        const { data: recurringSchedulesData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID.meta_value}/transactions/recurring-schedules`, recurringSchedulesPostData);
        if (!recurringSchedulesData.status || !recurringSchedulesData.data) {
            console.error("Error while creating recurring schedule for subscription", recurringSchedulesData.message);
            return false;
        }
        const { id: recurringScheduleId, next_run_date } = recurringSchedulesData.data;
        banquestRecurringScheduleID = recurringScheduleId;
        nextOrderDate = next_run_date;
    }

    const insertData: any = {
        user_id: userID,
        product_id: productID,
        variant_id: variantID,
        frequency,
        subscription_status: subscriptionStatus
    };

    if (subscriptionAmount) insertData.amount = subscriptionAmount;
    if (startDate) insertData.start_date = startDate;
    if (endDate) insertData.end_date = endDate;
    if (nextOrderDate) insertData.next_order_date = nextOrderDate;
    if (startDate) insertData.start_date = startDate;
    if (banquestRecurringScheduleID) insertData.banquest_recurring_schedule_id = banquestRecurringScheduleID;

    const { data, error } = await dbClient
        .from('subscriptions')
        .insert([insertData])
        .select()
        .single()

    if (error) {
        console.error("Error while adding subscription", error.message);
        return false;
    }

    return data;
}

export const getSubscriptions = async (subscriptionsArgs: subscriptionsArgsInterface = {}) => {
    const { userID, subscriptionsStatus, page = 1, limit = 10, displayOrderBy = 'created_at', displayOrder = 'desc' } = subscriptionsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    // Apply filters based on search parameter
    let query = dbClient.from('subscriptions').select(`*,
            users:user_id (user_email, first_name, last_name)`, { count: 'exact' });

    if (limit !== -1) {
        // Apply pagination only if limit is not -1
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    if (userID) query = query.eq('user_id', userID);
    if (subscriptionsStatus) query = query.eq('subscription_status', subscriptionsStatus);

    // Apply sorting
    query = query.order(displayOrderBy, { ascending: displayOrder === 'asc' });

    // Execute query and handle errors
    const { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "Subscriptions not found";
        return returnData;
    }

    // Calculate pagination details only if limit is not -1
    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;

    return returnData;
}

export const getSubscriptionByID = async (subscriptionID: number, withDetails: boolean = false) => {
    let { data: subscriptions, error: subscriptionError } = await dbClient
        .from('subscriptions')
        .select(`*,
            users:user_id (user_email, first_name, last_name)`)
        .eq('subscription_id', subscriptionID)
        .single();

    if (subscriptionError) {
        console.error(subscriptionError.message);
        return false;
    }

    if (!withDetails) return subscriptions;

    let subscriptionData: any = subscriptions;

    let { data: ordermeta, error: ordermetaError } = await dbClient
        .from('ordermeta')
        .select('order_id')
        .eq('meta_key', 'subscription_id')
        .eq('meta_value', subscriptionID);

    if (!ordermetaError) {
        subscriptionData = { ...subscriptionData, orderCount: ordermeta?.length };
        const orderIDs: any = ordermeta?.map(data => data.order_id);
        let { data: orders, error: ordersError } = await dbClient
            .from('orders')
            .select('order_id')
            .in('order_id', orderIDs)
            .order('order_date', { ascending: false });

        if (!ordersError && orders !== null) {
            // Use Promise.all with map
            const ordersWithDetails = await Promise.all(
                orders.map(async order => {
                    const orderData = await getOrderByID(order.order_id, true);
                    if (orderData) {
                        return orderData;
                    }
                    return order; // Return the order even if no orderData
                })
            );
            subscriptionData = { ...subscriptionData, orders: ordersWithDetails };
        }
    }

    return subscriptionData;
}

export const getSubscriptionByScheduleID = async (scheduleID: number) => {
    const { data: subscription, error } = await dbClient
        .from('subscriptions')
        .select('subscription_id')
        .eq('banquest_recurring_schedule_id', scheduleID)
        .single();

    // Handle errors
    if (error) {
        console.error("Error fetching subscription by schedule ID: ", error.message);
        return false;
    }

    const subscriptionID = subscription.subscription_id;
    const subscriptionData = await getSubscriptionByID(subscriptionID, true);
    return subscriptionData;
}

export const updateSubscription = async (subscriptionID: number, subscriptionUpdateData: subscriptionUpdateDataInterface = {}) => {
    const { amount, banquestRecurringScheduleID, endDate, frequency, nextOrderDate, subscriptionStatus } = subscriptionUpdateData;

    const updateData: any = {}
    if (amount) updateData.amount = updateData;
    if (banquestRecurringScheduleID) updateData.banquest_recurring_schedule_id = banquestRecurringScheduleID;
    if (frequency) updateData.frequency = frequency;
    if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
    if (nextOrderDate) updateData.next_order_date = nextOrderDate;
    if (endDate) updateData.end_date = endDate;

    const { data, error } = await dbClient
        .from('subscriptions')
        .update(updateData)
        .eq('subscription_id', subscriptionID)
        .select();

    if (error) {
        console.error("Error while updating subscription data", error.message);
        return false;
    }

    return data;
}


export const addOrderNote = async (orderID: number, noteText: string, noteType: OrderNoteTypes = OrderNoteTypes.Private) => {
    const { data, error } = await dbClient
        .from('order_notes')
        .insert([{
            order_id: orderID,
            note_type: noteType,
            note_text: noteText
        }])
        .select();
    if (error) {
        console.error("Error while adding an order note:", error.message);
        return false;
    }
    return data;
}

export const getOrderNotes = async (getOrderNotesArgs: getOrderNotesArgsInterface) => {
    const { orderID, noteType } = getOrderNotesArgs;

    let query = dbClient
        .from('order_notes')
        .select('*')
        .eq('order_id', orderID);

    if (noteType) {
        query = query.eq('note_type', noteType);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error while getting order notes:", error.message);
        return false;
    }

    return data;
}

export const deleteOrderNote = async (orderNoteID: number) => {
    const { error } = await dbClient
        .from('order_notes')
        .delete()
        .eq('order_note_id', orderNoteID);

    if (error) {
        console.error("Error while de delete note:", error.message);
        return false;
    }

    return true;
}

export const deleteOrderNotesByOrderID = async (orderID: number) => {
    const { error } = await dbClient
        .from('order_notes')
        .delete()
        .eq('order_id', orderID);

    if (error) {
        console.error("Error while de delete notes:", error.message);
        return false;
    }

    return true;
}