"use client";

import { affiliatesDBInterface, getAffiliateByUserID, getAffiliateState, getAffiliateStateDBData, getRewadPointTransactions, getUserById, RewardPointsTransactionType } from "@/DbClient";
import { useEffect, useState } from "react";
import PointsImg from "@/public/assets/images/home/Points.png";
import TotalPoints from "@/public/assets/images/home/Total_Points.png";
import RedeemPoints from "@/public/assets/images/home/Redeem_points.png";
import Link from "next/link";
import ReferralDetailsBar from "@/Components/Applications/PropertyManager/ReferralDetailsBar";
import ReferralActivity from "@/Components/Applications/PropertyManager/ReferralActivity";
import { RewardTransaction } from "@/Types/Rewards";
import PointsEarnedTable from "@/Components/Applications/PropertyManager/PointsEarnedTable";
import { toast } from "react-toastify";
import LoadingIcon from "@/CommonComponent/LoadingIcon";

const PropertyManagerDashboard = () => {
    const userID = localStorage.getItem("userId");
    const [user, setUser] = useState<any>();
    const [isTransactionDataLoading, setIsTransactionDataLoading] = useState<boolean>(false);
    const [transactionData, setTransactionData] = useState<RewardTransaction[]>([]);
    const [affiliateData, setAffiliateData] = useState<affiliatesDBInterface>();
    const [quickStatesData, setQuickStatesData] = useState<getAffiliateStateDBData>({});
    const [quickStatesLoading, setQuickStatesLoading] = useState<boolean>(false);

    const fetchUserDetails = async () => {
        if (!userID || userID == "") return;
        const details = await getUserById(userID as string);
        if (typeof details == "boolean") return;
        setUser(details);
    };

    const fetchAffiliateData = async () => {
        if (!userID) return;
        setQuickStatesLoading(true);
        const data = await getAffiliateByUserID(userID);
        if (typeof data === "boolean") {
            setQuickStatesLoading(false);
            toast.error("Something is wrong! unable to find your affiliate details. Please contact our support team.");
            return;
        }
        setAffiliateData(data);

    }

    const fetchAffiliateState = async () => {
        if (!affiliateData || !affiliateData.affiliate_id) return;
        setQuickStatesLoading(true);
        const data = await getAffiliateState(affiliateData.affiliate_id);
        setQuickStatesLoading(false);
        if (typeof data === "boolean") return;
        setQuickStatesData(data);
    };

    const fetchTransactionData = async () => {
        if (isTransactionDataLoading) return;

        setIsTransactionDataLoading(true);
        const rewardsData = await getRewadPointTransactions({
            limit: 5,
            userID: userID as string,
            type: RewardPointsTransactionType.Earn
        });

        const { status, data } = rewardsData;
        setIsTransactionDataLoading(false);
        if (!status) {
            setTransactionData([]);
            return;
        }

        if (data && data.length > 0) {
            setTransactionData(data);
            return;
        }
        setTransactionData([]);
    };

    useEffect(() => {
        if (affiliateData)
            fetchAffiliateState();
    }, [affiliateData])

    useEffect(() => {
        fetchUserDetails();
        fetchAffiliateData();
        fetchTransactionData();
    }, []);

    return <div className="user-dashboard-page property-manager-dashboard-page">
        {/* Quick States */}
        <div className="row">
            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
                <h2 className="h4 mb-2">{`Welcome Back, ${user ? user.first_name : ""}!`}</h2>
                <p className="mb-0 font-normal text-base ">Here's a quick update on your referrals & activity.</p>
            </div>

            <div className="col-12 col-lg-8">
                <div className="row g-2">
                    <div className="col-12 col-md-4">
                        <div className="border rounded p-2 h-100 d-flex align-items-center">
                            <img src={PointsImg.src} alt="Points" className="me-3" width="40" height="40" />
                            <div>
                                <div style={{ color: "#797979" }} className="mb-1 fs-6 fw-normal">Total Referrals</div>
                                <div className="d-flex align-items-center">
                                    {quickStatesLoading && <LoadingIcon iconSize={5} />}
                                    {!quickStatesLoading &&
                                        <span className="h5 mb-0 me-2">
                                            {quickStatesData.total_referrals || 0}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="border rounded p-2 h-100 d-flex align-items-center">
                            <img src={TotalPoints.src} alt="Total Points" className="me-3" width="40" height="40" />
                            <div>
                                <div style={{ color: "#797979" }} className="fs-6 mb-1 fw-normal">Active Members</div>
                                <div className="d-flex align-items-center">
                                    {quickStatesLoading && <LoadingIcon iconSize={5} />}
                                    {!quickStatesLoading &&
                                        <span className="h5 mb-0 me-2">
                                            {quickStatesData.active_members || 0}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="border rounded p-2 h-100 d-flex align-items-center">
                            <img src={RedeemPoints.src} alt="Redeem Points" className="me-3" width="40" height="40" />
                            <div>
                                <div style={{ color: "#797979" }} className="fs-6 mb-1 fw-normal">Monthly New Signups</div>
                                <div className="d-flex align-items-center">
                                    {quickStatesLoading && <LoadingIcon iconSize={5} />}
                                    {!quickStatesLoading &&
                                        <span className="h5 mb-0 me-2">
                                            {quickStatesData.monthly_signups || 0}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* EOf Quick States */}

        <div className="row">
            <div className="col-12">
                <ReferralDetailsBar className="border-top border-bottom py-3 my-5" />
            </div>
            {/* Recent Referral Activity */}
            <div className="col-md-7">

                <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
                    <h3 className="mb-0 text-dark f-w-500 ff-sora fs-5">Recent Referral Activity</h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Link href={`/property-manager/referral-management`} className="btn btn-dark btn-sm ff-sora-regular" style={{ letterSpacing: "inherit" }}>View All</Link>
                    </div>
                </div>

                <ReferralActivity affiliateData={affiliateData} perPage={5} />

            </div>
            {/* EOF Recent Referral Activity */}

            {/* Monthly Earnings */}
            <div className="col-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
                    <h3 className="mb-0 text-dark f-w-500 ff-sora fs-5">Monthly Earnings</h3>
                    <div className="d-flex gap-2 align-items-center">
                        <Link href={`/property-manager/reward-points`} className="btn btn-dark btn-sm ff-sora-regular" style={{ letterSpacing: "inherit" }}>View All</Link>
                    </div>
                </div>
                <PointsEarnedTable isLoading={isTransactionDataLoading} transactionData={transactionData} details="minimum" className="user-reward-points-page" />
            </div>
            {/* Monthly Earnings */}
        </div>

    </div>
}

export default PropertyManagerDashboard;