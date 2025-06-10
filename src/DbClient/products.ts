import { dbClient } from ".";

export enum ProductType {
    Simple = "simple",
    Variable = "variable",
    Variation = "variation"
}

export enum productStatus {
    Draft = "draft",
    Publish = "publish",
    Trash = "trash"
}

export enum productStockStatus {
    inStock = "In stock",
    outOfStock = "Out of stock"
}

/** Products **/
export interface productDataInterface {
    name: string;
    slug: string;
    productType: ProductType;
    description?: string;
    productParent?: number;
    productStatus?: productStatus;
    price?: number;
    stockStatus?: productStockStatus;
    isSubscription?: boolean;
}

interface productUpdateDataInterface {
    name?: string;
    slug?: string;
    productType?: ProductType;
    description?: string;
    productParent?: number;
    productStatus?: productStatus;
    price?: number;
    stockStatus?: productStockStatus;
    isSubscription?: boolean;
}

interface productDbInsertDataInterface {
    name: string;
    slug: string;
    product_type: ProductType;
    description?: string;
    product_parent?: number;
    product_status?: productStatus;
    created_at?: Date;
}

interface productDbUpdateDataInterface {
    name?: string;
    slug?: string;
    product_type?: ProductType;
    description?: string;
    product_parent?: number;
    product_status?: productStatus;
    created_at?: Date;
}

export const getProduct = async (productID: number, withMeta: boolean = true) => {
    const { data: product, error } = await dbClient
        .from('products')
        .select('*')
        .eq('product_id', productID)
        .single();

    if (error) {
        console.error(error.message);
        return false;
    }

    if (!withMeta) {
        return product;
    }

    const productMeta = await getProductMeta(productID);
    if (!productMeta) {
        return product;
    }

    const metaData: any = {};
    productMeta.forEach((metaDataDB: any) => {
        metaData[metaDataDB.meta_key] = metaDataDB.meta_value;
    });

    return { ...product, ...metaData };
}

export const addProduct = async (productData: productDataInterface): Promise<boolean | any> => {
    const { name, slug, productType, description, productParent, productStatus, price, stockStatus, isSubscription } = productData;
    const insertData: productDbInsertDataInterface = {
        name,
        slug,
        product_type: productType
    }

    if (description) insertData.description = description;
    if (productParent) insertData.product_parent = productParent;
    if (productStatus) insertData.product_status = productStatus;

    const { data, error } = await dbClient
        .from('products')
        .insert([insertData])
        .select('*')
        .single();

    if (error) {
        console.error(error.message);
        return false;
    }

    const { product_id: productID } = data;

    if (!productID) {
        return false;
    }

    const productMetaData = [];

    if (price) productMetaData.push({
        metaKey: 'price',
        metaValue: price
    });

    if (stockStatus) productMetaData.push({
        metaKey: 'stock_status',
        metaValue: stockStatus
    });

    if (isSubscription !== undefined) productMetaData.push({
        metaKey: 'is_subscription',
        metaValue: isSubscription
    });

    await addProductMetas(productID, productMetaData);

    const productMeta = await getProductMeta(productID);
    if (!productMeta) {
        return data;
    }

    const metaData: any = {};
    productMeta.forEach((metaDataDB: any) => {
        metaData[metaDataDB.meta_key] = metaDataDB.meta_value;
    });

    return { ...data, ...metaData };
}

export const updateProduct = async (productID: number, productData: productUpdateDataInterface): Promise<boolean | any> => {
    const { name, slug, productType, description, productParent, productStatus, price, stockStatus, isSubscription } = productData;
    const updateData: productDbUpdateDataInterface = {};

    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (productType) updateData.product_type = productType;
    if (description) updateData.description = description;
    if (productStatus) updateData.product_status = productStatus;
    if (productParent) updateData.product_parent = productParent;

    const { data, error } = await dbClient
        .from('products')
        .update(updateData)
        .eq('product_id', productID)
        .select('*')
        .single();

    if (error) {
        console.error(error.message);
        return false;
    }

    if (price) await updateProductMeta(productID, 'price', price, true);
    if (stockStatus) await updateProductMeta(productID, 'stock_status', stockStatus, true);
    if (isSubscription) await updateProductMeta(productID, 'is_subscription', isSubscription, true);

    const productMeta = await getProductMeta(productID);
    if (!productMeta) {
        return data;
    }

    const metaData: any = {};
    productMeta.forEach((metaDataDB: any) => {
        metaData[metaDataDB.meta_key] = metaDataDB.meta_value;
    });

    return { ...data, ...metaData };
}

export const deleteProduct = async (productID: number, forceDelete: boolean = false): Promise<boolean> => {
    if (forceDelete) {
        const { data: productParent, error: productParentError } = await dbClient
            .from('products')
            .select('product_id')
            .eq('product_parent', productID)

        if (productParentError) {
            console.error(productParentError.message);
        } else if (productParent) {
            productParent.forEach(async (productParentData) => {
                await deleteProduct(productParentData.product_id, true);
            });
        }

        const { error: productMetaError } = await dbClient
            .from('productmeta')
            .delete()
            .eq('product_id', productID);

        if (productMetaError) {
            console.error(productMetaError.message);
            return false;
        }

        const { error: productAttributeRelations } = await dbClient
            .from('product_attribute_relations')
            .delete()
            .eq('product_id', productID);

        if (productAttributeRelations) {
            console.error(productAttributeRelations.message);
            return false;
        }

        const { error: productsError } = await dbClient
            .from('products')
            .delete()
            .eq('product_id', productID);

        if (productsError) {
            console.error(productsError.message);
            return false;
        }

        return true;
    }

    return await updateProduct(productID, { productStatus: productStatus.Trash });
}

export const getProductVariations = async (variableProductID: number) => {
    const { data: products, error } = await dbClient
        .from('products')
        .select('product_id, product_parent, product_status, productmeta:product_id (meta_key, meta_value)')
        .eq('product_parent', variableProductID)
        .eq('product_type', ProductType.Variation);

    if (error) {
        console.error("Error in variation product fetch", error.message);
        return false;
    }

    return products;
}

export const getProductAttributes = async (productId: number) => {
    const { data: attributeRelations, error: attrRelError } = await dbClient
        .from('product_attribute_relations')
        .select('attribute_id')
        .in('product_id', [productId])
        .or(`product_id.eq.${productId},product_parent.eq.${productId}`);

    if (attrRelError) throw new Error(attrRelError.message);

    const attributeIds = Array.from(new Set(attributeRelations.map((relation) => relation.attribute_id)));

    const { data: attributes, error: attrError } = await dbClient
        .from('product_attributes')
        .select(`
        attribute_id,
        attribute_name,
        product_attribute_values:product_attribute_values(attribute_value_id, attribute_value)
      `)
        .in('attribute_id', attributeIds);

    if (attrError) {
        console.error(attrError.message);
        return false;
    }

    return attributes;
}

export type SelectedAttribute = {
    attributeID: number;
    attributeValueID: number;
};

export const getVariationByAttributes = async (productID: number, selectedAttributes: Array<Number>) => {
    const { data, error } = await dbClient
        .rpc('get_variations_by_attributes', { attribute_value_ids: selectedAttributes, input_product_parent: productID });

    if (error) {
        console.error('Error calling get_variations_by_attributes function:', error.message);
        return false;
    }

    return data;
}
/** EOF Products **/


/** Product Meta **/
interface productMetaInterface {
    metaKey: string;
    metaValue?: any;
}

export const getProductMeta = async (productID: number, metaKey: string = "", single: boolean = false) => {
    let query: any = dbClient
        .from('productmeta')
        .select('meta_key, meta_value')
        .eq('product_id', productID);

    if (metaKey !== "" && single) {
        query = query.select('meta_value').eq('meta_key', metaKey).single();
    }

    const { data, error } = await query;

    if (error) {
        console.error(error.message);
        return false;
    }

    if (single) {
        return data.meta_value;
    }

    return data;
}

export const addProductMeta = async (productID: number, metaKey: string, metaValue: string = "") => {
    const { error } = await dbClient
        .from('productmeta')
        .insert([
            { product_id: productID, meta_key: metaKey, meta_value: metaValue },
        ])
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }
    return true;
}

export const addProductMetas = async (productID: number, productMetaData: Array<productMetaInterface>) => {
    const insertData = [];
    for (const key in productMetaData) {
        if (Object.prototype.hasOwnProperty.call(productMetaData, key)) {
            const { metaKey, metaValue } = productMetaData[key];
            insertData.push({
                product_id: productID,
                meta_key: metaKey,
                meta_value: metaValue
            })
        }
    }

    const { error } = await dbClient
        .from('productmeta')
        .insert(insertData)
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }
    return true;
}

export const updateProductMeta = async (productID: number, metaKey: string, metaValue: any = "", forceUpdate: boolean = false) => {
    if (!forceUpdate) {
        const isExist = await getProductMeta(productID, metaKey, true);
        if (!isExist) {
            return await addProductMeta(productID, metaKey, metaValue);
        }
    }

    const { error } = await dbClient
        .from('productmeta')
        .update({ meta_value: metaValue })
        .eq('product_id', productID)
        .eq('meta_key', metaKey)
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }

    return true;
}

export const deleteProductMeta = async (productID: number, metaKey: string = "") => {
    let query = dbClient
        .from('productmeta')
        .delete()
        .eq('product_id', productID);

    if (metaKey !== "") {
        query = query.eq('meta_key', metaKey);
    }

    const { error } = await query;

    if (error) {
        console.error(error.message);
        return false;
    }

    return true;
}
/** EOF Product Meta **/

/** Product Attributes **/
export const getAttributes = async () => {
    const { data, error } = await dbClient
        .from('product_attributes')
        .select('*')

    if (error) {
        console.error(error.message);
        return false;
    }
    return data
}

export const addAttribute = async (attributeName: string) => {
    const { data, error } = await dbClient
        .from('product_attributes')
        .insert([
            { attribute_name: attributeName },
        ])
        .select()
        .single()

    if (error) {
        console.error(error.message);
        return false;
    }
    return data
}

export const updateAttribute = async (attributeID: number, attributeName: string) => {
    const { data, error } = await dbClient
        .from('product_attributes')
        .update({ attribute_name: attributeName })
        .eq('attribute_id', attributeID)
        .select()
        .single();

    if (error) {
        console.error(error.message);
        return false;
    }
    return data;
}

export const deleteAttribute = async (attributeID: number) => {
    const { error: productAttributeRelationsError } = await dbClient
        .from('product_attribute_relations')
        .delete()
        .eq('attribute_id', attributeID);
    if (productAttributeRelationsError) {
        console.error(productAttributeRelationsError.message);
    }

    const { error: attributeValuesDeleteError } = await dbClient
        .from('product_attribute_values')
        .delete()
        .eq('attribute_id', attributeID);

    if (attributeValuesDeleteError) {
        console.error(attributeValuesDeleteError.message);
    }

    const { error: attributeDeleteError } = await dbClient
        .from('product_attributes')
        .delete()
        .eq('attribute_id', attributeID);

    if (attributeDeleteError) {
        console.error(attributeDeleteError.message);
    }

    return true
}

interface attributeValue {
    attributeID: number,
    attributeValue: string
}
export const getAttributeValues = async (attributeID: number) => {
    const { data, error } = await dbClient
        .from('product_attribute_values')
        .select('*')
        .eq('attribute_id', attributeID);

    if (error) {
        console.error(error.message);
        return false;
    }

    return data;
}

export const getAttributeValueNameByID = async (attributeValueID: number) => {
    const { data, error } = await dbClient
        .from('product_attribute_values')
        .select('attribute_value')
        .eq('attribute_value_id', attributeValueID)
        .single();

    if (error) {
        console.error("Error in attribute value name", error.message);
        return false;
    }

    return data.attribute_value;
}

export const addAttributeValues = async (attributeValues: Array<attributeValue>) => {
    const insertData = [];
    for (const key in attributeValues) {
        if (Object.prototype.hasOwnProperty.call(attributeValues, key)) {
            const { attributeID: attribute_id, attributeValue: attribute_value } = attributeValues[key];
            insertData.push({
                attribute_id,
                attribute_value
            })
        }
    }

    const { data, error } = await dbClient
        .from('product_attribute_values')
        .insert(insertData)
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }

    return data;
}

export const updateAttributeValue = async (attributeValueId: number, attributeValue: string) => {
    const { data, error } = await dbClient
        .from('product_attribute_values')
        .update({ attribute_value: attributeValue })
        .eq('attribute_value_id', attributeValueId)
        .select();

    if (error) {
        console.error(error.message);
        return false;
    }

    return data;
}

export const deleteAttributeValue = async (attributeValueId: number) => {
    const { error: productAttributeRelationsError } = await dbClient
        .from('product_attribute_relations')
        .delete()
        .eq('attribute_value_id', attributeValueId);
    if (productAttributeRelationsError) {
        console.error(productAttributeRelationsError.message);
    }

    const { error: attributeValuesDeleteError } = await dbClient
        .from('product_attribute_values')
        .delete()
        .eq('attribute_value_id', attributeValueId);

    if (attributeValuesDeleteError) {
        console.error(attributeValuesDeleteError.message);
    }

    return true
}

export interface productAttributeRelation {
    productID: number
    attributeID: number,
    attributeValueID: number
}

export enum AttributeRelationObjType {
    Attribute = "attribute",
    Product = "product",
    AttributeValue = "attribute_value"
}
export const addProductAttributeRelations = async (attributeRelationData: Array<productAttributeRelation>) => {
    const insertData = [];
    for (const key in attributeRelationData) {
        if (Object.prototype.hasOwnProperty.call(attributeRelationData, key)) {
            const { productID: product_id, attributeID: attribute_id, attributeValueID: attribute_value_id } = attributeRelationData[key];
            insertData.push({
                product_id,
                attribute_id,
                attribute_value_id
            })
        }
    }

    const { data, error } = await dbClient
        .from('product_attribute_relations')
        .insert(insertData)
        .select()

    if (error) {
        console.error(error.message);
        return false;
    }

    return data;
}

export const getProductAttributeRelation = async (objectID: number, objectType: AttributeRelationObjType = AttributeRelationObjType.Product) => {
    let query = dbClient
        .from('product_attribute_relations')
        .select("*")

    switch (objectType) {
        case 'attribute':
            query = query.eq('attribute_id', objectID)
            break;

        case 'attribute_value':
            query = query.eq('attribute_value_id', objectID)
            break;

        default:
            query = query.eq('product_id', objectID)
            break;
    }

    const { data, error } = await query;

    if (error) {
        console.error(error.message);
        return false;
    }

    return data;
}
/** EOF Product Attributes **/