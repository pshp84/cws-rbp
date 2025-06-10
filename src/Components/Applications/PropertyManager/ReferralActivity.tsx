"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import { addAffiliate, affiliatesDBInterface, dbClient, getAffiliateByUserID, getMembershipPlans, getReferrals, getReferralsArgsInterface, getUserById, membershipPlansDbFieldsInterface, referralMethod, referralsDBInterface } from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import { generateReferralCode } from "@/Helper/referrals";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Card } from "reactstrap";

interface ReferralDetailsBarProps {
    className?: string;
    pagination?: boolean;
    statusFilter?: boolean | undefined;
    planFilter?: number | undefined;
    perPage?: number;
    affiliateData?: affiliatesDBInterface;
    loadingState?: (isLoading: boolean) => void;
    isReferralUpdate?: (isReferralUpdate: boolean) => void;
}

const ReferralActivity: React.FC<ReferralDetailsBarProps> = (props) => {
    const {
        className,
        pagination = false,
        statusFilter,
        planFilter,
        perPage = 10,
        affiliateData: affiliateDataProps,
        loadingState,
        isReferralUpdate
    } = props;

    const userID = localStorage.getItem("userId");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(perPage);
    const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
    const [affiliateData, setAffiliateData] = useState<affiliatesDBInterface>();
    const [referrals, setReferrals] = useState<Array<referralsDBInterface>>([]);

    const fetchAffiliateData = async () => {
        if (affiliateDataProps) {
            setAffiliateData(affiliateDataProps);
            setIsLoading(false);
            return;
        }
        if (!userID) return;
        setIsLoading(true);
        const data = await getAffiliateByUserID(userID);
        setIsLoading(false);
        if (typeof data === "boolean") {
            toast.error("Something is wrong! unable to find your affiliate details. Please contact our support team.");
            return;
        }
        setAffiliateData(data);
    }

    const fetchReferrals = async (pageNumber = 0) => {
        if (!affiliateData || isLoading) return;
        setIsLoading(true);
        const getReferralsArgs: getReferralsArgsInterface = {
            affiliateID: affiliateData?.affiliate_id,
            limit: limit,
            page: (pageNumber === 0) ? page : pageNumber,
            order: displayOrder
        }

        if (planFilter) getReferralsArgs.planID = planFilter;
        if (typeof statusFilter === "boolean") getReferralsArgs.status = statusFilter;

        if ((pageNumber !== 0)) setPage(pageNumber as number);

        const referralsData = await getReferrals(getReferralsArgs);

        if (typeof referralsData === "boolean") {
            setIsLoading(false);
            setReferrals([]);
            return;
        }

        const { status, data, totalPages: resultTotalPages = 1, totalRecords: resultTotalRecords = 0 } = referralsData;
        if (!status || !data) {
            setIsLoading(false);
            setReferrals([]);
            return;
        }

        setTotalPages(resultTotalPages as number);
        setTotalRecords(resultTotalRecords as number);
        setReferrals(data);
        setIsLoading(false);
        return;
    }

    const updateReferralStatus = async (referralID: number, newStatus: boolean) => {
        if (!confirm("Are you sure you want to change status?")) return;
        setIsLoading(true);
        const { data, error } = await dbClient
            .from("referrals")
            .update({ status: newStatus })
            .eq("referral_id", referralID);
        setIsLoading(false);
        if (error) {
            console.error("Error while updateReferralStatus", error.message);
            toast.error("Unable to update status. Please contact to support team.");
            return;
        }
        const newReferralsData = referrals.map(data => {
            if (data.referral_id == referralID) return { ...data, status: newStatus };
            return { ...data }
        });
        setReferrals(newReferralsData);
        if (isReferralUpdate) isReferralUpdate(true);
    }

    useEffect(() => {
        fetchReferrals();
    }, [page]);

    useEffect(() => {
        fetchReferrals(1);
    }, [limit, displayOrder, planFilter, statusFilter]);

    useEffect(() => {
        if (affiliateData?.affiliate_id) {
            fetchReferrals(1);
        }
    }, [affiliateData]);

    useEffect(() => {
        if (loadingState) loadingState(isLoading)
    }, [isLoading]);

    useEffect(() => {
        fetchAffiliateData();
    }, []);

    return <div className={`referral-activity ${className || ""}`}>
        <Card className="overflow-hidden user-reward-points-page position-relative">
            {isLoading && <LoadingIcon withOverlap={true} />}
            <div className="table-responsive">
                <table className="table">
                    <thead className="ff-sora table-color">
                        <tr>
                            <th>Signup Date &nbsp;
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDisplayOrder(displayOrder == "asc" ? "desc" : "asc");
                                    }}
                                >
                                    <i className={`fa fa-sort-${displayOrder}`}></i>
                                </a>
                            </th>
                            <th>Member Name</th>
                            <th>Email</th>
                            <th>Membership Plan</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!isLoading && referrals.length > 0) &&
                            referrals.map((referral, referralIndex) => {
                                const { created_at, membership_plans, referral_id, users, status } = referral;
                                if (!referral_id) return "";
                                return <tr key={`referraltrIndex-${referralIndex}-${referral_id}`}>
                                    <td>{formatDate(created_at as string)}</td>
                                    <td>{`${users?.first_name} ${users?.last_name}`}</td>
                                    <td><a href={`mailto:${users?.user_email}`}>{users?.user_email}</a></td>
                                    <td>{membership_plans?.plan_name} Plan</td>
                                    <td className={`text-${status ? `success` : `danger`}`}>
                                        <button
                                            type="button"
                                            className={`btn-pill btn-air-undefined btn btn-xs py-1 btn-air-${(status) ? `success` : `danger`} btn-${(status) ? `success` : `danger`}`}
                                            onClick={e => {
                                                updateReferralStatus(referral_id, !status);
                                            }}
                                            title="Click to update status"
                                        >
                                            {status ? `Active` : `Inactive`}
                                        </button>
                                    </td>
                                </tr>
                            })
                        }

                        {(!isLoading && referrals.length <= 0) &&
                            <tr>
                                <td colSpan={5} className="text-center">Referral not found!</td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        </Card>

        {/* Pagination */}
        {(!isLoading && pagination) &&
            <div className="pagination-bar d-flex justify-content-between align-items-center g-2">
                <PaginationInfo currentPage={page} recordsPerPage={limit} totalRecords={totalRecords} onPerPageChange={data => setLimit(data)} showDropDown={true} />

                {totalPages > 1 &&
                    <PaginationComponent currentPage={page} perPage={limit} totalRecords={totalRecords} onPageChange={data => setPage(data)} />
                }
            </div>
        }
        {/* EOF Pagination */}
    </div>
};

export default ReferralActivity;