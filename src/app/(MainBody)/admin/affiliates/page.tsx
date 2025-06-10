"use client";

import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import withAuth from "@/Components/WithAuth/WithAuth"
import { affiliatesDBInterface, dbClient, getAffiliates, getAffiliatesArgsInterface, getAffiliateState, getPointsData } from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "reactstrap";

const AffiliatesAdminPage = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [startLoading, setStartLoading] = useState(false);
    const [perPage, setPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
    const [affiliates, setAffiliates] = useState<affiliatesDBInterface[]>([]);
    const [statusFilter, setStatusFilter] = useState<boolean>();

    const fetchAffiliates = async (page: number = 0) => {
        setIsLoading(true);

        const getAffiliatesArgs: getAffiliatesArgsInterface = {
            limit: perPage,
            page: currentPage,
            order: displayOrder
        };
        if (typeof statusFilter !== "undefined") getAffiliatesArgs.status = statusFilter;

        const data = await getAffiliates(getAffiliatesArgs);

        if (typeof data == "boolean") {
            setAffiliates([]);
            setIsLoading(false);
            return;
        }

        const { status, data: affiliatesDBData, totalPages, totalRecords } = data;

        if (!status) {
            setAffiliates([]);
            setIsLoading(false);
            return;
        }

        if (!affiliatesDBData || affiliatesDBData.length <= 0) {
            setAffiliates([]);
            setIsLoading(false);
            return;
        }

        const affiliatesData = affiliatesDBData as affiliatesDBInterface[];
        const newAffiliatesData = await Promise.all(affiliatesData.map(async affiliate => {
            if (!affiliate.affiliate_id || !affiliate.user_id) return { ...affiliate }
            const affiliateID = affiliate.affiliate_id;

            const referralInsights = {
                totalReferrals: 0,
                activeReferrals: 0,
                monthlyNewSignups: 0
            }

            const affiliateStateData = await getAffiliateState(affiliateID);
            if (typeof affiliateStateData !== "boolean") {
                referralInsights.totalReferrals = Number(affiliateStateData.total_referrals);
                referralInsights.activeReferrals = Number(affiliateStateData.active_members);
                referralInsights.monthlyNewSignups = Number(affiliateStateData.monthly_signups);
            }

            const pointsInsights = {
                totalEarned: 0,
                totalRedeemed: 0,
                availablePoints: 0
            }
            const pointsData = await getPointsData(affiliate.user_id);
            if (typeof pointsData !== "boolean") {
                pointsInsights.totalEarned = Number(pointsData.total_earned_points);
                pointsInsights.totalRedeemed = Number(pointsData.total_redeemed_points);
                pointsInsights.availablePoints = Number(pointsData.available_points);
            }

            return { ...affiliate, referralInsights, pointsInsights }
        }));

        if (affiliatesData) setAffiliates(newAffiliatesData);
        if (totalRecords) setTotalRecords(totalRecords);
        if (totalPages) setTotalPages(totalPages);
        setIsLoading(false);
    }

    const updateAffiliateStatus = async (affiliateID: number, newStatus: boolean) => {
        if (!confirm("Are you sure you want to change status?")) return;
        setIsLoading(true);
        const { data, error } = await dbClient
            .from("affiliates")
            .update({ affiliate_status: newStatus })
            .eq("affiliate_id", affiliateID);
        setIsLoading(false);
        if (error) {
            console.error("Error while updateAffiliateStatus", error.message);
            toast.error("Unable to update Affiliate status. Please contact to support team.");
            return;
        }
        const newAffiliatesData = affiliates.map(data => {
            if (data.affiliate_id == affiliateID) return { ...data, affiliate_status: newStatus };
            return { ...data }
        });
        setAffiliates(newAffiliatesData);
    }

    useEffect(() => {
        setCurrentPage(1);
        setStartLoading(true);
    }, [perPage, displayOrder, statusFilter]);

    useEffect(() => {
        setStartLoading(true);
    }, [currentPage]);

    useEffect(() => {
        if (startLoading === true) {
            fetchAffiliates();
            setStartLoading(false);
        }
    }, [startLoading]);

    return <div className="affiliates-admin mb-4 col-12">
        {/* Top bar */}
        <div className={`rewards-points-log-top-bar d-flex justify-content-${(isLoading) ? 'end' : 'between'} align-items-center gap-2 mb-3`}>
            {!isLoading && <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={true} onPerPageChange={setPerPage} />}

            <div className="d-flex justify-content-end align-items-center gap-2">
                <div>
                    <select
                        className="form-select form-select-sm"
                        onChange={e => {
                            switch (e.target.value) {
                                case "1":
                                    setStatusFilter(true)
                                    break;
                                case "0":
                                    setStatusFilter(false)
                                    break;
                                default:
                                    setStatusFilter(undefined)
                                    break;
                            }
                        }}>
                        <option value="">Status</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
            </div>
        </div>
        {/* EOF Top bar */}

        {/* Card Table */}
        <Card className="overflow-hidden position-relative">
            <div className="table-responsive">
                {isLoading && (
                    <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(255,255,255, 0.8)", zIndex: "1091" }} >
                        Loading please wait...
                    </div>
                )}
                <table className="table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: "50px" }}>#</th>
                            <th>User Details</th>
                            <th>Referrals</th>
                            <th>Points</th>
                            <th>Referral Code</th>
                            <th>Status</th>
                            <th style={{ width: "125px" }}>Date &nbsp;
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    const newDisplayOrder =
                                        displayOrder == "asc" ? "desc" : "asc";
                                    setDisplayOrder(newDisplayOrder);
                                }}
                                >
                                    <i className={`fa fa-sort-${displayOrder}`}></i>
                                </a>
                            </th>
                            <th className="text-center" style={{ width: "80px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!isLoading && affiliates.length <= 0) &&
                            <tr>
                                <td className="text-center" colSpan={8}>Affilates not found.</td>
                            </tr>
                        }
                        {affiliates.length > 0 &&
                            affiliates.map((affiliate, affiliateIndex) => {
                                if (!affiliate.affiliate_id) return "";
                                const affiliateID = Number(affiliate.affiliate_id);

                                const referralInsights = affiliate.referralInsights || false;
                                const pointsInsights = affiliate.pointsInsights || false;

                                return <tr key={`affiliate-tr-${affiliateIndex}`}>
                                    <td className="text-center">{affiliate.affiliate_id}</td>
                                    <td>
                                        {affiliate.users && userCard({
                                            user_id: affiliate.user_id || "",
                                            first_name: affiliate.users.first_name || "",
                                            last_name: affiliate.users.last_name || "",
                                            user_email: affiliate.users.user_email || "",
                                            phone_number: affiliate.users.phone_number
                                        })}
                                    </td>
                                    <td>
                                        {referralInsights &&
                                            <ul>
                                                <li><span>Total Referrals:</span> <b>{referralInsights.totalReferrals}</b></li>

                                                <li><span>Active Referrals:</span> <b>{referralInsights.activeReferrals}</b></li>

                                                <li><span>New Signups:</span> <b>{referralInsights.monthlyNewSignups}</b></li>
                                            </ul>
                                        }
                                    </td>
                                    <td>
                                        {pointsInsights &&
                                            <ul>
                                                <li><span>Earned:</span> <b>{pointsInsights.totalEarned}</b></li>

                                                <li><span>Redeemed:</span> <b>{pointsInsights.totalRedeemed}</b></li>

                                                <li><span>Available:</span> <b>{pointsInsights.availablePoints}</b></li>
                                            </ul>
                                        }
                                    </td>
                                    <td>{affiliate.referral_code}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className={`btn-pill btn-air-undefined btn btn-xs btn-air-${(affiliate.affiliate_status) ? `success` : `danger`} btn-${(affiliate.affiliate_status) ? `success` : `danger`}`}
                                            onClick={e => {
                                                updateAffiliateStatus(affiliateID, !affiliate.affiliate_status);
                                            }}
                                            title="Click to update status"
                                        >
                                            {affiliate.affiliate_status ? `Active` : `Inactive`}
                                        </button>
                                    </td>
                                    <td>{formatDate(affiliate.created_at as string)}</td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center align-items-center gap-2">
                                            <Link href={`/admin/affiliates/report/${affiliate.affiliate_id}`}><i className="fa fa-bar-chart-o"></i></Link>
                                        </div>
                                    </td>
                                </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Card >
        {/* EOF Card Table */}

        {/* Bottom bar */}
        {!isLoading && affiliates.length > 0 && (
            <div className="rewards-points-log-bottom-bar d-flex justify-content-between align-items-center gap-2">
                <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={false} />

                {totalPages > 1 && (
                    <PaginationComponent totalRecords={totalRecords} perPage={perPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                )}
            </div>
        )}
        {/* EOF Bottom bar */}

    </div>
}

const userCard = (user: {
    user_id: string;
    first_name: string;
    last_name: string;
    user_email: string;
    phone_number?: number;

}) => {
    const userDisplayName = user.first_name.split("")[0] + user.last_name.split("")[0]
    return <div className="d-flex gap-2">
        <Link className="bg-dark rounded-circle d-flex justify-content-center align-items-center border border-3 border-secondary text-uppercase" style={{ width: "50px", height: "50px" }} href={`/admin/users/edit_user/${user.user_id}`} target="_blank">{userDisplayName}</Link>
        <div>
            <div>
                <Link href={`/admin/users/edit_user/${user.user_id}`} target="_blank">{`${user.first_name} ${user.last_name}`}</Link>
            </div>
            <div>
                <a href={`mailto:${user.user_email}`}><small><i className="fa fa-envelope"></i> {user.user_email}</small></a>
            </div>
            {user.phone_number &&
                <div>
                    <a href={`tel:${user.phone_number}`}><small><i className="fa fa-phone"></i> {user.phone_number}</small></a>
                </div>
            }
        </div>
    </div>
}

export default withAuth(AffiliatesAdminPage)