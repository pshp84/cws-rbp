"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import PointsActivity from "@/Components/Applications/PropertyManager/PointsActivity";
import ReferralActivity from "@/Components/Applications/PropertyManager/ReferralActivity";
import { affiliatesDBInterface, dbClient, getAffiliate, getAffiliateState, getAffiliateStateDBData, getMembershipPlans, getPointsData, membershipPlansDbFieldsInterface, RewardPointsTransactionType } from "@/DbClient";
import { generateReferralLink } from "@/Helper/referrals";
import { Points } from "@/Types/Rewards";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody } from "reactstrap";

const AffiliateReportAdminPage = () => {
    const { affiliate_id } = useParams();
    const [isAffiliateLoading, setIsAffiliateLoading] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [perPage, setPerPage] = useState(50);
    const [statusFilter, setStatusFilter] = useState<boolean>();
    const [affiliate, setAffiliate] = useState<affiliatesDBInterface>({});
    const [affiliateDisplayName, setAffiliateDisplayName] = useState<string>("");
    const [affiliateFullName, setAffiliateFullName] = useState<string>("");
    const [affiliateUserEmail, setAffiliateUserEmail] = useState<string>("");
    const [affiliateUserPhone, setAffiliateUserPhone] = useState<number>();
    const [currentView, setCurrentView] = useState<"Referrals" | "Rewards">();
    const [isPlansLoading, setIsPlansLoading] = useState<boolean>(true);
    const [planFilter, setPlanFilter] = useState<number | undefined>();
    const [plans, setPlans] = useState<Array<membershipPlansDbFieldsInterface>>([]);
    const [transactionType, setTransactionType] = useState<RewardPointsTransactionType>(RewardPointsTransactionType.Earn);
    const [allPoints, setAllPoints] = useState<Points>();
    const [quickStatesData, setQuickStatesData] = useState<getAffiliateStateDBData>({});
    const [isReferralUpdate, setIsReferralUpdate] = useState<boolean>(false);

    const fetchAffiliateData = async () => {
        if (isAffiliateLoading || !affiliate_id) return;
        setIsAffiliateLoading(true);
        const affiliateID = Number(affiliate_id);
        const data = await getAffiliate(affiliateID);
        setIsAffiliateLoading(false);

        if (typeof data === "boolean" || !data.users) {
            toast.error("Unable to find Affiliate details");
            return;
        }

        const { first_name: firstName, last_name: lastName, user_email, phone_number } = data.users;
        if (firstName && lastName) {
            const displayName = firstName.split("")[0] + lastName.split("")[0];
            setAffiliateDisplayName(displayName);
            setAffiliateFullName(`${firstName} ${lastName}`);
        }
        if (user_email) setAffiliateUserEmail(user_email);
        if (phone_number) setAffiliateUserPhone(phone_number);
        setAffiliate(data);
    }

    const fetchPlans = async () => {
        setIsPlansLoading(true);
        const data = await getMembershipPlans();
        setIsPlansLoading(false);
        if (typeof data === "boolean") {
            setPlans([]);
            toast.error("Something is wrong! unable to find plans. Please contact our support team.");
            return;
        }
        setPlans(data);
    }

    const fetchUserPoints = async () => {
        if (!affiliate.user_id) return;
        const points = await getPointsData(affiliate.user_id);
        setAllPoints(points);
    };

    const fetchAffiliateState = async () => {
        if (!affiliate || !affiliate.affiliate_id) return;
        const data = await getAffiliateState(affiliate.affiliate_id);
        if (typeof data === "boolean") return;
        setQuickStatesData(data);
    };

    const updateAffiliateStatus = async (affiliateID: number, newStatus: boolean) => {
        if (!confirm("Are you sure you want to change status?")) return;
        setIsLoading(true);
        setIsAffiliateLoading(true);
        const { data, error } = await dbClient
            .from("affiliates")
            .update({ affiliate_status: newStatus })
            .eq("affiliate_id", affiliateID);
        setIsLoading(false);
        setIsAffiliateLoading(false);
        if (error) {
            console.error("Error while updateAffiliateStatus", error.message);
            toast.error("Unable to update Affiliate status. Please contact to support team.");
            return;
        }
        const newAffiliatesData = affiliate;
        newAffiliatesData.affiliate_status = newStatus;
        setAffiliate(newAffiliatesData);
    }

    const resetData = () => {
        setPerPage(50);
        setPlanFilter(undefined);
        setStatusFilter(undefined);
        setTransactionType(RewardPointsTransactionType.Earn);
    }

    useEffect(() => {
        if (!affiliate.affiliate_id && !currentView) return;
        resetData();
        if (currentView === "Referrals") fetchAffiliateState();
        if (currentView === "Rewards") fetchUserPoints();
    }, [currentView]);

    useEffect(() => {
        if (!affiliate.affiliate_id) return;
        fetchUserPoints();
        fetchAffiliateState();
        setCurrentView("Referrals");
    }, [affiliate]);

    useEffect(() => {
        if (isReferralUpdate) {
            fetchAffiliateState();
            setIsReferralUpdate(false);
        }
    }, [isReferralUpdate]);

    useEffect(() => {
        fetchAffiliateData();
        fetchPlans();
    }, []);

    return <div className="affiliate-report-admin mb-4 col-12">
        <Card className="overflow-hidden">
            <CardBody className="border-bottom position-relative">
                {isAffiliateLoading && <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(255,255,255, 0.8)", zIndex: "1091" }} >
                    Loading please wait...
                </div>}
                <div className="d-flex align-items-center gap-2">
                    <Link className="bg-dark rounded-circle d-flex justify-content-center align-items-center border border-3 border-secondary text-uppercase" style={{ width: "75px", height: "75px", fontSize: "30px" }} href={`/admin/users/edit_user/${affiliate.user_id}`} target="_blank">
                        {affiliateDisplayName}
                    </Link>
                    <div className="flex-fill">
                        <div className="mb-2 d-flex gap-1 align-items-center">
                            <Link className="h3 m-0" href={`/admin/users/edit_user/${affiliate.user_id}`} target="_blank">{affiliateFullName}</Link>
                            {typeof affiliate.affiliate_status === "boolean" &&
                                <button
                                    type="button"
                                    className={`btn-pill btn-air-undefined btn btn-xs btn-air-${affiliate.affiliate_status ? `success` : `danger`} btn-${affiliate.affiliate_status ? `success` : `danger`}`}
                                    onClick={e => {
                                        if (!affiliate.affiliate_id) return;
                                        updateAffiliateStatus(affiliate.affiliate_id, !affiliate.affiliate_status);
                                    }}
                                >
                                    {affiliate.affiliate_status ? `Active` : `Inactive`}
                                </button>
                            }
                        </div>
                        {affiliate.referral_code && <ul>
                            <li><p className="mb-1">Referral Link: <span style={{ backgroundColor: "#EEE" }} className="px-1 text-dark">{generateReferralLink(affiliate.referral_code)}</span></p></li>
                            <li><p className="m-0">Referral Code: <span className="text-dark">{affiliate.referral_code}</span></p></li>
                        </ul>}
                    </div>
                    <div>
                        <ul>
                            {affiliateUserEmail && <li>
                                <a href={`mailto:${affiliateUserEmail}`}><i className="fa fa-envelope"></i> {affiliateUserEmail}</a>
                            </li>}
                            {affiliateUserPhone && <li>
                                <a href={`tel:${affiliateUserPhone}`}><i className="fa fa-phone"></i> {affiliateUserPhone}</a>
                            </li>}
                        </ul>
                    </div>
                </div>
            </CardBody>
            <CardBody className="py-0 d-flex align-items-center justify-content-between gap-4">
                <ul className="nav gap-4">
                    <li className="nav-item">
                        <button
                            className="nav-link px-0 py-3 position-relative text-dark"
                            onClick={() => setCurrentView("Referrals")}
                            disabled={isLoading}
                        >Referrals
                            {currentView === "Referrals" && <span className="border border-bottom border-3 position-absolute bottom-0 w-100 start-0"></span>}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className="nav-link px-0 py-3 position-relative text-dark"
                            onClick={() => setCurrentView("Rewards")}
                            disabled={isLoading}
                        >Reward Points
                            {currentView === "Rewards" && <span className="border border-bottom border-3 position-absolute bottom-0 w-100 start-0"></span>}
                        </button>
                    </li>
                </ul>

                <div className="d-flex flex-fill justify-content-center align-items-center gap-2">
                    {allPoints && currentView === "Rewards" && <>
                        <span>Available Points: <b>{allPoints.available_points || 0}</b></span>|
                        <span>Earned Points: <b>{allPoints.total_earned_points || 0}</b></span>|
                        <span>Redeemed Points: <b>{allPoints.total_redeemed_points || 0}</b></span>
                    </>}

                    {quickStatesData && currentView === "Referrals" && <>
                        <span>Total Referrals: <b>{quickStatesData.total_referrals || 0}</b></span>|
                        <span>Active Members: <b>{quickStatesData.active_members || 0}</b></span>|
                        <span>Monthly New Signups: <b>{quickStatesData.monthly_signups || 0}</b></span>
                    </>}

                </div>

                <div className="d-flex align-items-center justify-content-end gap-2">
                    {currentView === "Referrals" && <>

                        <div>
                            <select
                                className="form-select form-select-sm"
                                disabled={isLoading}
                                onChange={e => {
                                    const value = e.target.value;
                                    if (!value || value === "") {
                                        setPlanFilter(undefined);
                                        return;
                                    }
                                    setPlanFilter(parseInt(value));
                                }}
                            >
                                <option value={``}>{`${isPlansLoading ? `Loading Plans` : `Membership Plan`}`}</option>
                                {(!isPlansLoading && plans.length > 0) &&
                                    plans.map((plan, planIndex) => {
                                        return <option
                                            value={plan.plan_id as number}
                                            key={`plan-select-${planIndex}-${plan.plan_id}`}
                                        >
                                            {plan.plan_name} Plan
                                        </option>
                                    })
                                }
                            </select>
                        </div>

                        <div>
                            <select
                                className="form-select form-select-sm"
                                disabled={isLoading}
                                onChange={e => {
                                    switch (e.target.value) {
                                        case "active":
                                            setStatusFilter(true);
                                            break;
                                        case "inactive":
                                            setStatusFilter(false);
                                            break;
                                        default:
                                            setStatusFilter(undefined);
                                            break;
                                    }
                                }}
                            >
                                <option value="">Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </>}

                    {currentView === "Rewards" && <>
                        <div>
                            <select
                                className="form-select form-select-sm"
                                disabled={isLoading}
                                onChange={e => {
                                    if (e.target.value == RewardPointsTransactionType.Redeem) {
                                        setTransactionType(RewardPointsTransactionType.Redeem)
                                    } else {
                                        setTransactionType(RewardPointsTransactionType.Earn)
                                    }
                                }}
                            >
                                <option value={RewardPointsTransactionType.Earn}>Points Earned</option>
                                <option value={RewardPointsTransactionType.Redeem}>Points Redeemed</option>
                            </select>
                        </div>
                    </>}

                    <Link href={`/admin/affiliates`} className="btn btn-sm btn-primary px-2 py-1">Back</Link>
                </div>
            </CardBody>
        </Card>


        {currentView === "Referrals" && affiliate &&
            <div className="referrals-view">
                <ReferralActivity affiliateData={affiliate} pagination={true} perPage={perPage} planFilter={planFilter} statusFilter={statusFilter} isReferralUpdate={setIsReferralUpdate} />
            </div>
        }

        {currentView === "Rewards" && affiliate &&
            <div className="rewards-view">
                {transactionType === RewardPointsTransactionType.Earn && <PointsActivity affiliateData={affiliate} loadingState={setIsLoading} pagination={true} perPage={perPage} />}

                {transactionType === RewardPointsTransactionType.Redeem && <PointsActivity affiliateData={affiliate} loadingState={setIsLoading} pagination={true} perPage={perPage} transactionType={transactionType} />}

            </div>
        }

    </div>
}

export default AffiliateReportAdminPage;