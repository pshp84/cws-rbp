import { dbClient } from ".";

export interface addOptionArgs {
    optionKey: string,
    optionValue?: any
}

export const getOption = async (optionKey: string = "", single: boolean = false) => {
    let query: any = dbClient.from('options').select('option_key, option_value');

    if (optionKey != "") {
        query = query.eq('option_key', optionKey);
    }

    if (single) {
        query = query.select('option_value').single();
    }

    const { data: options, error: optionsError } = await query;

    // Handle errors
    if (optionsError) {
        console.error("Error fetching Option: ", optionsError);
        return false;
    }

    if (single && options.option_value) {
        return options.option_value;
    }

    return options;
}

export const getOptions = async (optionKeys: Array<string>) => {
    let query: any = dbClient.from('options').select('option_key, option_value');

    if (optionKeys.length > 0) {
        query = query.in('option_key', optionKeys);
    }

    const { data: options, error: optionsError } = await query;

    // Handle errors
    if (optionsError) {
        console.error("Error fetching Options: ", optionsError);
        return false;
    }

    return options;
}

export const addOption = async (addOptionArgs: addOptionArgs) => {
    const { optionKey, optionValue } = addOptionArgs;
    const { error: insertError } = await dbClient
        .from('options')
        .insert([{ 'option_key': optionKey, 'option_value': optionValue }]);
    if (insertError) {
        console.error("Error while addin option", insertError.message);
        return false;
    }
    return true;
}

export const addOptions = async (addOptionsArgs: Array<addOptionArgs>) => {
    const insertData: Array<{ 'option_key': string, 'option_value'?: any }> = [];
    addOptionsArgs.forEach(data => {
        insertData.push({ option_key: data.optionKey, option_value: data.optionValue })
    });

    if (insertData.length <= 0) return false;

    const { error: insertError } = await dbClient
        .from('options')
        .insert(insertData);
    if (insertError) {
        console.error("Error while addin options", insertError.message);
        return false;
    }
    return true;
}

export const updateOption = async (optionKey: string, optionValue: any, forceUpdate: boolean = false): Promise<boolean> => {
    if (!forceUpdate) {
        const isAvailable = await getOption(optionKey, true);
        if (!isAvailable) {
            return await addOption({ optionKey, optionValue });
        } else {
            return await updateOption(optionKey, optionValue, true);
        }
    }

    const { data, error: updateError } = await dbClient
        .from('options')
        .update({ 'option_value': optionValue })
        .eq('option_key', optionKey);

    if (updateError) {
        console.error("Error while updating option", updateError.message);
        return false;
    }

    return true;
}