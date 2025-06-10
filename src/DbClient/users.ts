import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import { dataResponseInterface, dbClient, getMemberships, membershipsDbFieldsInterface } from ".";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { BanquestPaymentMethodTypes } from "@/app/api/banquest/banquestConfig";
import { banquestRecurringSchedulesPatchData } from "@/app/api/banquest/customer/[customer_id]/transactions/recurring-schedules/[recurring_schedule_id]/route";

export enum userRoles {
    Admin = 'admin',
    User = 'user',
    PropertyManager = "property_manager"
}

export interface getUsersResponseInterface {
    status: boolean;
    message?: string;
    totalPages?: number;
    currentPage?: number;
    limit?: number;
    data?: any[];
}

export interface getUsersArgsInterface {
    page?: number;
    limit?: number;
    orderBy?: 'user_status' | 'created_at' | 'user_role';
    order?: 'asc' | 'desc';
    search?: string;
}

export interface userUpdateDataInterface {
    firstName?: string;
    lastName?: string;
    userStatus?: boolean;
    userRole?: userRoles;
    phoneNumber?: number;
}

export interface userDbFieldsInterface {
    first_name?: string;
    last_name?: string;
    user_status?: boolean;
    user_role?: userRoles;
    user_email?: string;
    phone_number?: number;
}

export interface userAddDataInterface {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userStatus?: boolean;
    userRole?: userRoles;
    emailRedirectTo?: string;
    phoneNumber?: number;
    emailOptIn?: boolean;
    phoneNumberOptIn?: boolean;
}

export interface paymentMethodDataInterface {
    paymentMethodType: BanquestPaymentMethodTypes;
    achData?: AchPaymentMethodData;
    ccData?: CreditCardMethodData;
}

export interface UserMetaDataInterface {
    meta_key?: string
    meta_value?: string;
}

export interface UsersDataForCSVInterface {
    id?: string;
    email?: string;
    phone_number?: number;
    full_name?: string;
    role?: string;
    created_at?: string | Date;
    email_opt_in?: boolean;
    phone_number_opt_in?: boolean;
    street?: string;
    street2?: string;
    state?: string;
    city?: string;
    zip_code?: string;
    country?: string;
}

export const getUsers = async (usersArgs: getUsersArgsInterface = {}): Promise<dataResponseInterface> => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', search } = usersArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    // Apply filters based on search parameter
    let query = dbClient.from('users').select('*', { count: 'exact' });

    if (search) {
        // Check if the search term is a valid UUID format
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(search);

        if (isUUID) {
            // Search by user_id directly with `=`
            query = query.eq('user_id', search);
        } else {
            // Apply `ilike` on other text fields
            query = query.or(`user_email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }
    }

    if (limit !== -1) {
        // Apply pagination only if limit is not -1
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
    }

    // Apply sorting
    query = query.order(orderBy, { ascending: order === 'asc' });

    // Execute query and handle errors
    const { data, error, count } = await query;

    if (error) {
        returnData.message = error.message;
        return returnData;
    }

    if (!data || data.length === 0) {
        returnData.message = "Users not found";
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

export const updateUser = async (userID: string, userUpdateData: userUpdateDataInterface) => {
    const { firstName, lastName, userStatus, userRole, phoneNumber } = userUpdateData;

    const updateUserFields: userDbFieldsInterface = {}

    if (firstName) updateUserFields.first_name = firstName;
    if (lastName) updateUserFields.last_name = lastName;
    if (userStatus !== undefined) updateUserFields.user_status = userStatus;
    if (userRole) updateUserFields.user_role = userRole;
    if (phoneNumber) updateUserFields.phone_number = phoneNumber;

    if (Object.keys(updateUserFields).length === 0) {
        console.log("No fields to update");
        return false;
    }

    const { data, error } = await dbClient
        .from('users')
        .update(updateUserFields)
        .eq('user_id', userID)
        .select()
        .single();

    if (error) {
        console.error("Error:", error);
        return false;
    }

    return data;
}

export const addUser = async (addUserData: userAddDataInterface) => {
    const { email, password, firstName, lastName, userStatus, userRole = userRoles.User, emailRedirectTo, phoneNumber, emailOptIn, phoneNumberOptIn } = addUserData;

    const userArgs: any = {
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone_number: phoneNumber,
                email_opt_in: emailOptIn || false,
                phone_number_opt_in: phoneNumberOptIn || false
            }
        }
    }
    if (emailRedirectTo) userArgs.options.emailRedirectTo = emailRedirectTo;
    const { data: userAuthData, error: userAuthError } = await dbClient.auth.signUp(userArgs);

    if (userAuthError) {
        console.error(userAuthError.message);
        return false;
    }

    const { user } = userAuthData;

    const userID = user?.id;

    if (userID) return await updateUser(userID, { userRole, userStatus });

    return false;
}

export const getUserById = async (userId: string, fields: string[] = []): Promise<false | { [key: string]: any }> => {
    let selectFields = "*";
    if (fields.length >= 1) {
        selectFields = fields.toString();
    }
    const { data: user, error: userError } = await dbClient
        .from('users')
        .select(selectFields)
        .eq('user_id', userId)
        .single();

    if (userError || user === null) {
        console.error("Error fetching user: ", userError);
        return false
    }

    return user;
}

export const getUserByEmail = async (userEmail: string, fields: string[] = []) => {
    let selectFields = "*";
    if (fields.length >= 1) {
        selectFields = fields.toString();
    }
    const { data: user, error: userError } = await dbClient
        .from('users')
        .select(selectFields)
        .eq('user_email', userEmail)
        .single();

    if (userError || !user) {
        console.error("Error fetching user: ", userError);
        return false
    }
    return user;
}

export const getUserRole = async (userId: string) => {
    const userRole: any = await getUserById(userId, ['user_role']);
    if (!userRole) {
        return false;
    }
    return userRole.user_role;
}

export const getUserMeta = async (userId: string, metaKey: string = "", single: boolean = false) => {
    let query: any = dbClient.from('usermeta').select('meta_key, meta_value').eq('user_id', userId);

    if (metaKey != "") {
        query = query.eq('meta_key', metaKey);
    }

    if (single) {
        query = query.select('meta_value').single();
    }

    const { data: usermeta, error: userMetaError } = await query;

    // Handle errors
    if (userMetaError || !usermeta) {
        console.error("Error fetching user meta: ", userMetaError);
        return false;
    }

    if (single && usermeta.meta_value) {
        return usermeta.meta_value;
    }

    return usermeta;
}

export const updateUserMeta = async (userId: string, metaKey: string, metaValue: any): Promise<boolean> => {
    const isMetaExist = await getUserMeta(userId, metaKey, true);
    const isUpdate = !!isMetaExist;
    let query: any = dbClient.from('usermeta');

    if (isUpdate) {
        query = query.update({ 'meta_value': metaValue })
            .eq('user_id', userId)
            .eq('meta_key', metaKey);
    } else {
        query = query.insert([{
            user_id: userId,
            meta_key: metaKey,
            meta_value: metaValue
        }]);
    }

    const { data, error } = await query;

    if (error || !data) {
        console.error("Error updating user meta: ", error);
        return false;
    }

    return true;
}

export const updateUserPaymentMethod = async (userID: string, paymentMethodData: paymentMethodDataInterface) => {

    const banquestCustomerID = await getUserMeta(userID, 'banquest_customer_id', true);
    if (!banquestCustomerID) {
        console.error('User is not Banquest customer.');
        return false;
    }

    /** Create payment method in banquest **/
    const { paymentMethodType, achData, ccData } = paymentMethodData;

    let paymentMethodPostData: any = {}
    if (paymentMethodType == BanquestPaymentMethodTypes.ach && achData) {
        const { accountNumber, accountType, routingNumber, secCode, nameOnAccount } = achData;
        paymentMethodPostData = {
            "type": BanquestPaymentMethodTypes.ach,
            "name": nameOnAccount,
            "account_number": accountNumber,
            "routing_number": routingNumber,
            "account_type": accountType,
            "sec_code": secCode
        }
    } else if (paymentMethodType == BanquestPaymentMethodTypes.cc && ccData) {
        const { creditCardNonceToken, expiryYear, expiryMonth, nameOnAccount } = ccData;
        paymentMethodPostData = {
            "type": BanquestPaymentMethodTypes.cc,
            "nonce_token": creditCardNonceToken,
            "expiry_year": expiryYear,
            "expiry_month": expiryMonth
        }
        if (nameOnAccount) paymentMethodPostData.name = nameOnAccount;
    }

    const { data: banquestPaymentMethodData } = await rbpApiCall.post(`/banquest/customer/${banquestCustomerID}/payment-methods`, paymentMethodPostData);

    if (!banquestPaymentMethodData.status || !banquestPaymentMethodData.data) {
        console.error(banquestPaymentMethodData.message);
        return false;
    }
    const { id: banquestPaymentMethodID } = banquestPaymentMethodData.data;
    /** EOF Create payment method in banquest **/

    /** Update payment method in existing membership recurring payment **/
    const { status, data: userMemberships } = await getMemberships({ userID, limit: - 1 });
    if (status && typeof userMemberships != "undefined") {
        userMemberships.forEach(async (userMembership: membershipsDbFieldsInterface) => {
            const { banquest_recurring_schedule_id: banquestRecurringScheduleID } = userMembership;
            if (banquestRecurringScheduleID) {

                const recurringSchedulesPatchData: banquestRecurringSchedulesPatchData = {
                    payment_method_id: banquestPaymentMethodID
                };

                const { data: recurringSchedulesUpdate } = await rbpApiCall.patch(`/banquest/customer/${banquestCustomerID}/transactions/recurring-schedules/${banquestRecurringScheduleID}`, recurringSchedulesPatchData);

                if (!recurringSchedulesUpdate.status || !recurringSchedulesUpdate.data) {
                    console.error(recurringSchedulesUpdate.message)
                    return false;
                }
            }
        });
    }
    /** EOF Update payment method in existing membership recurring payment **/

    await updateUserMeta(userID, 'banquest_payment_method_type', paymentMethodType);
    await updateUserMeta(userID, 'banquest_payment_method_id', banquestPaymentMethodID);
    await updateUserMeta(userID, 'banquest_payment_method_data', banquestPaymentMethodData.data);

    return true;
}

export const getUserAddressForCSV = async () => {
    const { data, error } = await dbClient
        .rpc('get_user_addresses_for_csv');

    if (error) {
        console.error('Error calling get_user_addresses_for_csv function:', error.message);
        return false;
    }

    return data;
}

export const getUsersDataForCSV = async (): Promise<boolean | UsersDataForCSVInterface[]> => {
    const { data, error } = await dbClient
        .rpc('get_users_for_csv');

    if (error) {
        console.error('Error calling get_user_addresses_for_csv function:', error.message);
        return false;
    }

    return data;
}