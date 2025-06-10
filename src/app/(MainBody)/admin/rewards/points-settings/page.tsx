"use client";

import withAuth from "@/Components/WithAuth/WithAuth";
import { getOptions, updateOption } from "@/DbClient";
import { priceFormat } from "@/Helper/commonHelpers";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody, CardFooter, InputGroup } from "reactstrap";

const RewardsPointsSettingsAdmin = () => {

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [optionData, setOptionData] = useState<Array<any>>([]);
    const [earnPointsRate, setEarnPointsRate] = useState<number>();
    const [redemptionConversionRate, setRedemptionConversionRate] = useState<any>({ amount: 0, points: 0 });
    const [tremendousCampaignID, setTremendousCampaignID] = useState<any>();
    const [tremendousFundingSourceID, setTremendousFundingSourceID] = useState<any>();
    const [tremendousCampaignList, setTremendousCampaignList] = useState([]);
    const [tremendousFundingSourceList, setTremendousFundingSourceList] = useState([]);
    const [isTremendousCampaignListLoading, setIsTremendousCampaignListLoading] = useState<boolean>(false);
    const [isTremendousFundingSourceListLoading, setIsTremendousFundingSourceListLoading] = useState<boolean>(false);

    const loadTremendousCampaignList = async () => {
        setIsTremendousCampaignListLoading(true);
        try {
            const campaignsResponse = await rbpApiCall.post("/tremendous/campaigns");
            const { data, status } = campaignsResponse.data;

            if (!status) {
                toast.error("Something is wrong! tremendous campaigns are not available");
                setIsTremendousCampaignListLoading(false);
                return;
            }

            if (data.length > 0) {
                const campaignData = data.map((campaignData: { id: any; name: any; }) => {
                    return {
                        id: campaignData.id,
                        campaignName: campaignData.name
                    }
                })
                setTremendousCampaignList(campaignData);
            }
            setIsTremendousCampaignListLoading(false);

        } catch (error) {
            toast.error("Something is wrong! tremendous campaigns are not available");
            setIsTremendousCampaignListLoading(false);
            return;
        }
    }

    const loadTremendousFundingSourceList = async () => {
        setIsTremendousFundingSourceListLoading(true);
        try {
            const fundingSourcesResponse = await rbpApiCall.post("/tremendous/funding_sources");
            const { data, status } = fundingSourcesResponse.data;

            if (!status) {
                toast.error("Something is wrong! tremendous funding sources are not available");
                setIsTremendousFundingSourceListLoading(false);
                return;
            }

            if (data.length > 0) {
                const fundingSourcesData = data.map((fundingSourcesData: { id: any; method: any, meta: any; }) => {
                    return {
                        id: fundingSourcesData.id,
                        fundingSourceName: fundingSourcesData.method,
                        fundingSourceAmount: fundingSourcesData.meta.available_cents
                    }
                })
                setTremendousFundingSourceList(fundingSourcesData);
            }
            setIsTremendousFundingSourceListLoading(false);

        } catch (error) {
            toast.error("Something is wrong! tremendous campaigns are not available");
            setIsTremendousFundingSourceListLoading(false);
            return;
        }
    }

    const loadRewardsPointsSettings = async () => {
        setIsLoading(true);
        const data = await getOptions(['earn_points_rate', 'redemption_conversion_rate', 'tremendous_campaign_id', 'tremendous_funding_source_id']);

        if (!data) {
            toast.error("Something is wrong! settings are not loading");
            setIsLoading(false);
            return;
        }

        setOptionData(data);
        setIsLoading(false);
    }

    const saveSettings = async () => {
        setIsLoading(true);

        const earnPointsValueUpdate = await updateOption('earn_points_rate', earnPointsRate);
        const redemptionConversionValueUpdate = await updateOption('redemption_conversion_rate', redemptionConversionRate);
        const tremendousCampaignIDValueUpdate = await updateOption('tremendous_campaign_id', tremendousCampaignID);
        const tremendousFundingSourceIDValueUpdate = await updateOption('tremendous_funding_source_id', tremendousFundingSourceID);

        if (!earnPointsValueUpdate) {
            toast.error("Earn points rate is not save");
            setIsLoading(false);
            return;
        }

        if (!redemptionConversionValueUpdate) {
            toast.error("Redemption conversion rate are not save");
            setIsLoading(false);
            return;
        }

        if (!tremendousCampaignIDValueUpdate) {
            toast.error("Campaign for Redemption is not save");
            setIsLoading(false);
            return;
        }

        if (!tremendousFundingSourceIDValueUpdate) {
            toast.error("Funding Source for Redemption is not save");
            setIsLoading(false);
            return;
        }

        toast.success("Points settings saved successfully.");
        await loadRewardsPointsSettings();
    }

    useEffect(() => {
        if (optionData?.length > 0) {
            optionData.map(option => {
                if (option.option_key && option.option_value) {
                    switch (option.option_key) {
                        case "earn_points_rate":
                            setEarnPointsRate(option.option_value);
                            break;

                        case "redemption_conversion_rate":
                            setRedemptionConversionRate(JSON.parse(option.option_value));
                            break;

                        case "tremendous_campaign_id":
                            setTremendousCampaignID(option.option_value);
                            break;

                        case "tremendous_funding_source_id":
                            setTremendousFundingSourceID(option.option_value);
                            break;
                    }
                }
            });
        }
    }, [optionData]);

    useEffect(() => {
        loadRewardsPointsSettings();
        loadTremendousCampaignList();
        loadTremendousFundingSourceList();
    }, []);

    return <div className="rewards-points-settings-admin col-md-5">
        <Card className="position-relative overflow-hidden">
            {isLoading &&
                <div className="position-absolute w-100 h-100 top-0 star-0 d-flex justify-content-center align-items-center z-3" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
                    Loading please wait...
                </div>
            }
            <CardBody>
                <h5 className="mb-3">Points Conversion Rate Settings</h5>
                <div className="row g-3 align-items-center mb-4">
                    <div className="col-5">
                        <label htmlFor="earnPointsRate" className="col-form-label">Earn Points Rate</label>
                    </div>
                    <div className="col-7">
                        <input
                            type="number"
                            className="form-control"
                            id="earnPointsRate"
                            placeholder="40"
                            min={0}
                            value={earnPointsRate}
                            onChange={e => setEarnPointsRate(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="col-5">
                        <label className="col-form-label">Redemption Conversion Rate</label>
                    </div>
                    <div className="col-7">
                        <InputGroup>
                            <input min={0} type="number" className="form-control" value={redemptionConversionRate.points} onChange={e => setRedemptionConversionRate({ ...redemptionConversionRate, points: parseFloat(e.target.value) })} />
                            <span className="input-group-text rounded-0">Points = $</span>
                            <input min={0} type="number" className="form-control" value={redemptionConversionRate.amount} onChange={e => setRedemptionConversionRate({ ...redemptionConversionRate, amount: parseFloat(e.target.value) })} />
                        </InputGroup>
                    </div>
                </div>

                <h5 className="mb-3">Tremendous Settings</h5>
                <div className="row g-3 align-items-center">

                    <div className="col-5">
                        <label htmlFor="fundingSourceforRedemption" className="col-form-label">Funding Source for Redemption</label>
                    </div>
                    <div className="col-7">
                        <select id="fundingSourceforRedemption" className="form-select" value={tremendousFundingSourceID} onChange={e => setTremendousFundingSourceID(e.target.value)}>
                            <option value="">{(isTremendousFundingSourceListLoading) ? `Loading...` : `Select Funding Source`}</option>
                            {tremendousFundingSourceList.length > 0 &&
                                tremendousFundingSourceList.map((FundingSource: any, FundingSourceIndex) => {
                                    return <option key={`FundingSourceoption${FundingSourceIndex}`} value={FundingSource.id}>{`${FundingSource.fundingSourceName} - ${priceFormat(FundingSource.fundingSourceAmount)}`}</option>
                                })
                            }
                        </select>
                    </div>

                    <div className="col-5">
                        <label htmlFor="campaignforRedemption" className="col-form-label">Campaign for Redemption</label>
                    </div>
                    <div className="col-7">
                        <select id="campaignforRedemption" className="form-select" value={tremendousCampaignID} onChange={e => setTremendousCampaignID(e.target.value)}>
                            <option value="">{(isTremendousCampaignListLoading) ? `Loading...` : `Select Campaign`}</option>
                            {tremendousCampaignList.length > 0 &&
                                tremendousCampaignList.map((campaign: any, campaignIndex) => {
                                    return <option key={`campaignoption${campaignIndex}`} value={campaign.id}>{campaign.campaignName}</option>
                                })
                            }
                        </select>
                    </div>

                </div>
            </CardBody>
            <CardFooter className="d-flex justify-content-end">
                <button className="btn btn-primary" onClick={saveSettings}>Save</button>
            </CardFooter>
        </Card>
    </div>;
}

export default withAuth(RewardsPointsSettingsAdmin);