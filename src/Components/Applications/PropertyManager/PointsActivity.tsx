"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { affiliatesDBInterface, getAffiliateByUserID, getRewadPointTransactions, referralsDBInterface, RewardPointsTransactionType } from "@/DbClient";
import { RewardTransaction } from "@/Types/Rewards";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PointsEarnedTable from "./PointsEarnedTable";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PointsRedeemTable from "./PointsRedeemTable";

interface PointsEarnedTableProps {
    className?: string;
    pagination?: boolean;
    statusFilter?: boolean | undefined;
    planFilter?: number | undefined;
    perPage?: number;
    affiliateData?: affiliatesDBInterface;
    transactionType?: RewardPointsTransactionType;
    loadingState?: (isLoading: boolean) => void;
}

const PointsActivity: React.FC<PointsEarnedTableProps> = (props) => {
    const {
        className,
        pagination = false,
        statusFilter,
        planFilter,
        perPage = 10,
        affiliateData: affiliateDataProps,
        loadingState,
        transactionType = RewardPointsTransactionType.Earn
    } = props;

    const [userID, setUserID] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(perPage);
    const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
    const [affiliateData, setAffiliateData] = useState<affiliatesDBInterface>();
    const [transactionData, setTransactionData] = useState<RewardTransaction[]>([]);

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

    const fetchTransactionData = async (page: number = 0) => {
        if (isLoading) return;

        setIsLoading(true);
        const rewardsData = await getRewadPointTransactions({
            page: page === 0 ? currentPage : page,
            limit: perPage,
            order: displayOrder,
            userID: userID as string,
            type: transactionType
        });

        const { status, data, totalPages, totalRecords } = rewardsData;

        if (!status) {
            setTotalPages(1);
            setTotalRecords(0);
            setTransactionData([]);
            setIsLoading(false);
            return;
        }

        if (totalPages) setTotalPages(totalPages);
        if (totalRecords) setTotalRecords(totalRecords);

        if (data && data.length > 0) {
            setTransactionData(data);
        } else {
            setTransactionData([]);
        }

        setIsLoading(false);
        return;
    };

    useEffect(() => {
        fetchTransactionData();
    }, [currentPage]);

    useEffect(() => {
        fetchTransactionData(1);
    }, [limit, displayOrder, planFilter, statusFilter]);

    useEffect(() => {
        if (affiliateData?.affiliate_id) {
            setUserID(affiliateData.user_id)
        }
    }, [affiliateData]);

    useEffect(() => {
        if (userID) {
            fetchTransactionData(1);
        }
    }, [userID]);

    useEffect(() => {
        if (loadingState) loadingState(isLoading)
    }, [isLoading]);

    useEffect(() => {
        fetchAffiliateData();
    }, []);

    return <div className={`points-earned-activity ${className || ""}`}>

        {transactionType === RewardPointsTransactionType.Earn && <PointsEarnedTable isLoading={isLoading} transactionData={transactionData} details="maximum" displayOrder={(displayOrder === "asc" ? "asc" : "desc")} changeDisplayOrder={setDisplayOrder} />}

        {transactionType === RewardPointsTransactionType.Redeem && <PointsRedeemTable isLoading={isLoading} transactionData={transactionData} displayOrder={(displayOrder === "asc" ? "asc" : "desc")} changeDisplayOrder={setDisplayOrder} />}

        {/* Pagination */}
        {(!isLoading && pagination) &&
            <div className="pagination-bar d-flex justify-content-between align-items-center g-2">
                <PaginationInfo currentPage={currentPage} recordsPerPage={limit} totalRecords={totalRecords} onPerPageChange={data => setLimit(data)} showDropDown={true} />

                {totalPages > 1 &&
                    <PaginationComponent currentPage={currentPage} perPage={limit} totalRecords={totalRecords} onPageChange={data => setCurrentPage(data)} />
                }
            </div>
        }
        {/* EOF Pagination */}
    </div>
};

export default PointsActivity;