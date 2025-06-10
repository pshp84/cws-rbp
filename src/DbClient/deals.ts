import { dataResponseInterface, dbClient, deleteUploadedFile, getUploadedFileUrl, uploadFile } from ".";

export const dealsBucketFolderName: string = "deals_images";

export enum DealType {
    Coupon = "coupon",
    Affiliate = "affiliate"
}

export enum ReportType {
    View = "view",
    Click = "click"
}

export interface AddDealArgsInterface {
    name: string;
    slug: string;
    dealType: DealType;
    dealActionValue: string;
    authorID: string;
    dealStatus?: boolean;
    regularPrice?: number;
    salePrice?: number;
    discountText?: string;
    description?: string;
    smallDescription?: string;
    termsAndConditions?: string;
    dealImage?: File;
    startDate?: Date;
    endDate?: Date;
    categories?: Array<number>,
    dealWebsiteURL?: string,
    isFeatured?: boolean
}

export interface UpdateDealArgsInterface {
    name?: string;
    slug?: string;
    dealType?: DealType;
    dealActionValue?: string;
    dealStatus?: boolean;
    authorID?: string;
    regularPrice?: number;
    salePrice?: number;
    discountText?: string;
    description?: string;
    smallDescription?: string;
    termsAndConditions?: string;
    dealImage?: File;
    startDate?: Date;
    endDate?: Date;
    categories?: Array<number>,
    dealWebsiteURL?: string,
    isFeatured?: boolean
}

export interface GetDealsArgsInterface {
    page?: number;
    limit?: number;
    authorID?: string;
    status?: boolean,
    orderBy?: string;
    order?: 'asc' | 'desc';
    categories?: Array<number>,
    type?: DealType,
    search?: string,
    imageSize?: {
        width?: number
        height?: number,
        resize?: "cover" | "contain" | "fill"
    },
    isFeatured?: boolean
}

export interface UpdateDealCategoryArgsInterface {
    name?: string,
    slug?: string
}

export interface AddDealReportArgsInterface {
    dealID: number,
    userID: String,
    reportType: ReportType
}

export interface GetDealReportsArgsInterface {
    dealID?: number,
    userID?: String,
    reportType?: ReportType
}

export interface AddDealCategoryArgsInterface {
    name: string,
    slug: string
}

/* Deals */
export const addDeal = async (addDealArgs: AddDealArgsInterface) => {
    const { name, slug, authorID, dealActionValue, dealStatus = true, dealType = DealType.Affiliate, description, startDate, endDate, dealImage, termsAndConditions, discountText, regularPrice, salePrice, smallDescription, categories, dealWebsiteURL, isFeatured } = addDealArgs;

    const insertData: any = {
        name: name,
        slug: slug,
        author_id: authorID,
        deal_type: dealType,
        status: dealStatus,
        deal_action_value: dealActionValue
    }

    if (description) insertData.description = description;
    if (smallDescription) insertData.small_description = smallDescription;
    if (termsAndConditions) insertData.terms_and_conditions = termsAndConditions;
    if (startDate) insertData.start_date = startDate;
    if (endDate) insertData.end_date = endDate;
    if (regularPrice) insertData.regular_price = regularPrice;
    if (salePrice) insertData.sale_price = salePrice;
    if (discountText) insertData.discount_text = discountText;
    if (dealWebsiteURL) insertData.deal_website_url = dealWebsiteURL;
    if (typeof isFeatured != "undefined") insertData.is_featured = isFeatured;

    if (dealImage) {
        const fileUploadData: any = await uploadFile(dealImage, dealsBucketFolderName);
        if (!fileUploadData) return false;
        insertData.image_url = fileUploadData.path;
    }

    let { data: insertedDeal, error } = await dbClient
        .from('deals')
        .insert([insertData])
        .select()
        .single();

    if (error) {
        console.error("Error while inserting deal", error.message);
        return false;
    }

    const { deal_id: dealID } = insertedDeal;

    if (dealID && categories && categories.length > 0) {
        await addDealCategoryRelations(dealID, categories);
    }

    if (dealImage) {
        const dealImageURL = await getUploadedFileUrl(insertData.image_url);
        if (dealImageURL) insertedDeal = { ...insertedDeal, dealImageURL }
    }

    return insertedDeal;
}

export const updateDeal = async (dealID: number, updateDealArgs: UpdateDealArgsInterface = {}) => {
    const { name, slug, authorID, dealActionValue, dealStatus, dealType, description, startDate, endDate, dealImage, termsAndConditions, discountText, regularPrice, salePrice, smallDescription, categories, dealWebsiteURL, isFeatured } = updateDealArgs;

    let updateData: any = {};

    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (authorID) updateData.author_id = authorID;
    if (dealActionValue) updateData.deal_action_value = dealActionValue;
    if (typeof dealStatus === "boolean") updateData.status = dealStatus;
    if (dealType) updateData.deal_type = dealType;
    if (description) updateData.description = description;
    if (smallDescription) updateData.small_description = smallDescription;
    if (termsAndConditions) updateData.terms_and_conditions = termsAndConditions;
    if (startDate) updateData.start_date = startDate;
    if (endDate) updateData.end_date = endDate;
    if (regularPrice) updateData.regular_price = regularPrice;
    if (salePrice) updateData.sale_price = salePrice;
    if (discountText) updateData.discount_text = discountText;
    if (dealWebsiteURL) updateData.deal_website_url = dealWebsiteURL;
    if (typeof isFeatured != "undefined") updateData.is_featured = isFeatured;

    if (dealImage) {
        const fileUploadData = await uploadFile(dealImage, dealsBucketFolderName);
        if (!fileUploadData) return false;
        updateData.image_url = fileUploadData.path;
    } else {
        updateData.image_url = "";
    }

    if (Object.keys(updateData).length) {
        const { error: dealUpdateError } = await dbClient
            .from('deals')
            .update(updateData)
            .eq('deal_id', dealID)
            .select();

        if (dealUpdateError) {
            console.error("Error while update deal", dealUpdateError.message);
            return false;
        }
    }

    if (categories && categories.length > 0) {
        await deleteDealCategoryRelationsByDealID(dealID);
        await addDealCategoryRelations(dealID, categories);
    }

    return true;
}

export const deleteDeal = async (dealID: number) => {

    const deleteReports = await deleteDealReports(dealID);
    if (!deleteReports) return false;

    const deleteRelation = await deleteDealCategoryRelationsByDealID(dealID);
    if (!deleteRelation) return false;

    const { data: dealImageData, error: dealImageError } = await dbClient
        .from('deals')
        .select('image_url')
        .eq('deal_id', dealID)
        .single();

    if (!dealImageError && dealImageData) {
        const { image_url } = dealImageData;
        if (image_url) await deleteUploadedFile(image_url);
    }

    const { error: dealDeleteError } = await dbClient
        .from('deals')
        .delete()
        .eq('deal_id', dealID);

    if (dealDeleteError) {
        console.error("Error while delete deal", dealDeleteError.message);
        return false;
    }
    return true;
}

export const getDeals = async (getDealsArgs: GetDealsArgsInterface = {}) => {
    const { page = 1, limit = 10, orderBy = 'created_at', order = 'desc', status, authorID, categories, imageSize, type, search, isFeatured } = getDealsArgs;

    const returnData: dataResponseInterface = {
        status: false,
        data: []
    };

    let query = dbClient.from('deals')
        .select(`*`, { count: 'exact' });

    if (typeof status != "undefined") query = query.eq('status', status);
    if (authorID) query = query.eq('author_id', authorID);
    if (type) query = query.eq('deal_type', type);
    if (search) query = query.textSearch('name', search, {
        config: "english",
    });
    if (typeof isFeatured != "undefined") query = query.eq('is_featured', isFeatured);

    if (categories) {
        const dealIDs = await getDealsByCategories(categories);
        if (dealIDs) query = query.in('deal_id', dealIDs);
    }

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
        returnData.message = "Deals not found";
        return returnData;
    }

    const updateDataWithImageURLs = async (dealsData: any) => {
        const updatedData = await Promise.all(
            dealsData.map(async (deal: any) => {
                const { image_url } = deal;
                if (image_url) {
                    const dealImageURL = await getUploadedFileUrl(image_url, imageSize);
                    return dealImageURL ? { ...deal, dealImageURL } : deal;
                }
                return deal;
            })
        );
        return updatedData;
    };

    const updateDataWithCategories = async (dealsData: any) => {
        const updatedData = await Promise.all(
            dealsData.map(async (deal: any) => {
                const { deal_id: dealID } = deal;
                if (dealID) {
                    let { data: dealCategoryRelations, error: dealCategoryRelationsError } = await dbClient
                        .from('deal_category_relations')
                        .select('deal_categories:category_id (category_id, name, slug)')
                        .eq('deal_id', dealID);

                    if (!dealCategoryRelationsError) {
                        const categories = dealCategoryRelations?.map(data => data.deal_categories);
                        return { ...deal, categories: categories }
                    }
                    return deal;
                }
                return deal;
            })
        );
        return updatedData;
    };

    data = await updateDataWithImageURLs(data);
    data = await updateDataWithCategories(data);

    const totalPages = limit !== -1 ? Math.ceil((count || 0) / limit) : 1;

    returnData.status = true;
    returnData.totalPages = totalPages;
    returnData.currentPage = limit !== -1 ? page : 1;
    returnData.limit = limit;
    returnData.data = data;
    returnData.totalRecords = count;
    return returnData;
}

export const getDeal = async (dealID: number, withDetails: boolean = false) => {

    let { data: dealData, error: dealError } = await dbClient
        .from('deals')
        .select('*')
        .eq('deal_id', dealID)
        .single();

    if (dealError) {
        console.error("Error while getting deal", dealError.message);
        return false;
    }

    const { image_url } = dealData;
    if (image_url) {
        const dealImageURL = await getUploadedFileUrl(image_url);
        if (dealImageURL) dealData = { ...dealData, dealImageURL }
    }

    if (!withDetails) {
        return dealData;
    }

    let { data: dealReports, error: dealReportsError } = await dbClient
        .from('deal_reports')
        .select('user_id, report_type, created_at')
        .eq('deal_id', dealID);

    if (!dealReportsError) {
        dealData = { ...dealData, dealReports }
    }

    let { data: dealCategoryRelations, error: dealCategoryRelationsError } = await dbClient
        .from('deal_category_relations')
        .select('deal_categories:category_id (category_id, name, slug)')
        .eq('deal_id', dealID);

    if (!dealCategoryRelationsError) {
        const categories = dealCategoryRelations?.map(data => data.deal_categories);
        dealData = { ...dealData, categories: categories }
    }

    return dealData;
}
/* EOF Deals */


/* Deal Categories */
export const addDealCategory = async (addDealCategoryArgs: AddDealCategoryArgsInterface) => {

    const { data, error } = await dbClient
        .from('deal_categories')
        .insert([addDealCategoryArgs])
        .select()
        .single();

    if (error) {
        console.error("Error while adding new category", error.message);
        return false;
    }

    return data
}

export const getDealCategories = async (dealID: number | boolean = false) => {
    let categoriesIDs: Array<number> = [];
    if (dealID !== false) {
        const { data: dealCategoryRelations, error: dealCategoryRelationsError } = await dbClient
            .from('deal_category_relations')
            .select('category_id')
            .order('category_id', { ascending: false })
            .eq('deal_id', dealID);

        if (dealCategoryRelationsError) {
            console.error("Error while getting deal category relations", dealCategoryRelationsError.message);
            return false;
        }
        categoriesIDs = dealCategoryRelations.map(data => data.category_id);
    }

    let query = dbClient
        .from('deal_categories')
        .select('*')
        .order('category_id', { ascending: false })

    if (categoriesIDs.length > 0) {
        query = query.in('category_id', categoriesIDs);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error while getting categories", error.message);
        return false;
    }

    return data;
}

export const getDealsByCategories = async (categoriesIDs: Array<number>) => {

    let { data, error } = await dbClient
        .from('deal_category_relations')
        .select('deal_id')
        .in('category_id', categoriesIDs);

    if (error) {
        console.error("Error while getting deals by categories");
        return false;
    }

    return data?.map(data => data.deal_id);
}

export const updateDealCategory = async (categoryID: number, updateDealCategoryArgs: UpdateDealCategoryArgsInterface) => {

    const { data, error } = await dbClient
        .from('deal_categories')
        .update(updateDealCategoryArgs)
        .eq('category_id', categoryID)
        .select()
        .single();

    if (error) {
        console.error("Error while update category", error.message);
        return false;
    }

    return data;
}

export const deleteDealCategory = async (categoryID: number): Promise<boolean> => {

    await deleteDealCategoryRelations(categoryID);

    const { error } = await dbClient
        .from('deal_categories')
        .delete()
        .eq('category_id', categoryID);

    if (error) {
        console.error("Error while delete deal category", error.message);
        return false;
    }

    return true;
}

export const addDealCategoryRelations = async (dealID: number, categoriesIDs: Array<number>) => {
    let insertData: Array<any> = [];
    categoriesIDs.forEach(categoryID => {
        insertData.push({
            deal_id: dealID,
            category_id: categoryID
        });
    });

    const { error } = await dbClient
        .from('deal_category_relations')
        .insert(insertData)
        .select();

    if (error) {
        console.error("Error while inserting deal category relations", error.message);
        return false;
    }

    return true;
}

export const deleteDealCategoryRelations = async (objectID: number, objectType: 'category' | 'deal' = 'category') => {
    const deleteBy = (objectType === 'deal') ? 'deal_id' : 'category_id';
    const { error } = await dbClient
        .from('deal_category_relations')
        .delete()
        .eq(deleteBy, objectID);

    if (error) {
        console.error("Error while delete deal category relations", error.message);
        return false;
    }
    return true;
}

export const deleteDealCategoryRelationsByDealID = async (dealID: number) => {
    return await deleteDealCategoryRelations(dealID, 'deal');
}
/* EOF Deal Categories */


/* Deal Reports */
export const addDealReport = async (addDealReportArgs: AddDealReportArgsInterface) => {
    const { dealID, userID, reportType = ReportType.View } = addDealReportArgs;

    const { data, error } = await dbClient
        .from('deal_reports')
        .insert([{
            deal_id: dealID,
            user_id: userID,
            report_type: reportType
        }])
        .select();

    if (error) {
        console.error("Error while adding deal report", error.message);
        return false;
    }

    return data;
}

export const getDealReports = async (getDealReportsArgs: GetDealReportsArgsInterface = {}) => {
    const { dealID, reportType, userID } = getDealReportsArgs;

    let query = dbClient
        .from('deal_reports')
        .select('*');

    if (dealID) query = query.eq('deal_id', dealID);
    if (userID) query = query.eq('user_id', userID);
    if (reportType) query = query.eq('report_type', reportType);

    const { data, error } = await query;

    if (error) {
        console.error("Error while getting deal reports", error.message);
        return false;
    }

    return data;
}

export const deleteDealReports = async (dealID: number): Promise<Boolean> => {
    const { error } = await dbClient
        .from('deal_reports')
        .delete()
        .eq('deal_id', dealID);

    if (error) {
        console.error("Error while delete deal's report", error.message);
        return false;
    }
    return true;
}
/* EOF Deal Reports */