"use client"

import CsvDownloader from 'react-csv-downloader';
import withAuth from "@/Components/WithAuth/WithAuth";
import { dbClient, getOption, getUserAddressForCSV, updateOption } from "@/DbClient";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody, CardFooter } from "reactstrap";

const UtilitiesPage = () => {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [utilitySetupURL, setUtilitySetupURL] = useState<string>("");
    const [isLoadingCsvData, setIsLoadingCsvData] = useState<boolean>(false);
    const [csvColumns, setCsvColumns] = useState([
        {
            id: 'cell1',
            displayName: '#',
        },
        {
            id: 'cell2',
            displayName: 'Full Name',
        },
        {
            id: 'cell3',
            displayName: 'Email',
        },
        {
            id: 'cell4',
            displayName: 'Street',
        },
        {
            id: 'cell5',
            displayName: 'Street 2',
        },
        {
            id: 'cell6',
            displayName: 'State',
        },
        {
            id: 'cell7',
            displayName: 'City',
        },
        {
            id: 'cell8',
            displayName: 'Zip Code',
        },
        {
            id: 'cell9',
            displayName: 'Country'
        }
    ]);
    const [csvData, setCsvData] = useState([]);
    const [userIDforUpdate, setUserIDforUpdate] = useState<Array<string>>([]);
    const optionKey = "utility_setup_url";

    const fetchCsvData = async () => {
        setIsLoadingCsvData(true);
        const data = await getUserAddressForCSV();
        if (!data) {
            setIsLoadingCsvData(false);
            return;
        }

        const userIDs: Array<string> = [];
        const dataForCsv = data.map((userData: { id: any; full_name: any; email: any; street: any; street2: string; state: any; city: any; zip_code: any; country: any; }) => {
            const { id, full_name = "", email = "", street = "", street2 = "", state = "", city = "", zip_code = "", country = "" } = userData;
            userIDs.push(id);

            return {
                cell1: id,
                cell2: full_name,
                cell3: email,
                cell4: street,
                cell5: street2,
                cell6: state,
                cell7: city,
                cell8: zip_code,
                cell9: country
            }
        });
        setUserIDforUpdate(userIDs);
        setCsvData(dataForCsv);
        setIsLoadingCsvData(false);
        return;
    }

    const fetchUtilitySetupURL = async () => {
        setIsLoading(true);
        const data = await getOption(optionKey, true);
        if (!data) {
            setIsLoading(false);
            return;
        }
        setUtilitySetupURL(data);
        setIsLoading(false);
        return;
    }

    const saveUtilitySetupURL = async () => {
        if (!utilitySetupURL || utilitySetupURL == "") {
            toast.error("Utility Setup URL for Tenant is required.");
            return;
        }
        setIsLoading(true);
        const data = await updateOption(optionKey, utilitySetupURL);
        if (!data) {
            toast.error("Something is wrong! Utility Setup URL for Tenant is not save.");
            setIsLoading(false);
            return;
        }
        toast.success("Utility Setup URL for Tenant updated successfully.");
        setIsLoading(false);
        return;
    }

    const csvDownloaderHandleError = async () => {
        await updateUserMetaForCSV("0");
        toast.error("Error while download CSV file.");
    }

    const csvDownloaderHandleEmpty = async () => {
        toast.error("Unable to download empty CSV file.");
    }

    const updateUserMetaForCSV = async (metaValue: string = "1", userIDstoUpdate: Array<string> = []) => {

        const usersToUpdate = (userIDstoUpdate.length > 0) ? userIDstoUpdate : userIDforUpdate;

        if (usersToUpdate.length <= 0) return;

        const { error: deleteMetaError } = await dbClient
            .from('usermeta')
            .delete()
            .eq('meta_key', 'is_address_updated')
            .in('user_id', usersToUpdate);

        if (!deleteMetaError) {
            const insertData: Array<{
                user_id: string,
                meta_key: string,
                meta_value?: any
            }> = usersToUpdate.map(userID => {
                return {
                    user_id: userID,
                    meta_key: 'is_address_updated',
                    meta_value: metaValue
                }
            });

            if (insertData.length > 0) {
                const { data, error } = await dbClient
                    .from('usermeta')
                    .insert(insertData)
            }
        }
    }

    const downloadCsvBtnHandle = async () => {
        await updateUserMetaForCSV();
        return csvData;
    }

    useEffect(() => {
        fetchUtilitySetupURL();
        fetchCsvData();
    }, []);

    return <div className="utilities-admin col-md-6">
        <Card className="position-relative overflow-hidden">
            {isLoading &&
                <div className="position-absolute w-100 h-100 top-0 star-0 d-flex justify-content-center align-items-center z-3" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                    Loading please wait...
                </div>
            }
            <CardBody>
                <div className="row g-3 align-items-center">
                    <div className="col-5">
                        <label htmlFor="UtilityProfitTenantURLInput" className="col-form-label">Utility Setup URL for Tenant</label>
                    </div>
                    <div className="col-7 d-flex gap-2 justify-content-between align-items-center">
                        <input type="url" id="UtilityProfitTenantURLInput" className="form-control" value={utilitySetupURL} onChange={e => setUtilitySetupURL(e.target.value)} required />
                        <button className="btn btn-primary" onClick={saveUtilitySetupURL}>Save</button>
                    </div>
                    <div className="col-5">
                        <label className="col-form-label">New/Updated Tenant Addresses</label>
                    </div>
                    <div className="col-7 d-flex gap-2 align-items-center">
                        <CsvDownloader filename="RBP Club Tenant Addresses" extension=".csv" columns={csvColumns} datas={downloadCsvBtnHandle} disabled={!(csvData.length > 0)} suffix={true} handleEmpty={csvDownloaderHandleEmpty} handleError={csvDownloaderHandleError}>
                            <button className="btn btn-primary btn-sm px-2" disabled={!(csvData.length > 0)}><i className="fa fa-download"></i> Download CSV File</button>
                        </CsvDownloader>

                        {isLoadingCsvData && <span>Finding address, please wait...</span>}
                        {(!isLoadingCsvData && csvData.length <= 0) && <span>Nothing to export.</span>}

                        {(!isLoadingCsvData && csvData.length > 0) &&
                            <span>{csvData.length} {csvData.length > 1 ? `Addresses to export.` : `Address to export.`}</span>
                        }
                    </div>
                </div>
            </CardBody>
        </Card>
    </div >;
}

export default withAuth(UtilitiesPage)