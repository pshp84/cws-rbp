"use client";

import PointsImg from "@/public/assets/images/home/Points.png";
import TotalPoints from "@/public/assets/images/home/Total_Points.png";
import RedeemPoints from "@/public/assets/images/home/Redeem_points.png";
import { Card, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import { useEffect, useState } from "react";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { getOption, getPointsData, getRewadPointTransactions, getUserById, RewardPointsTransactionType } from "@/DbClient";
import { toast } from "react-toastify";
import { Points, RewardTransaction } from "@/Types/Rewards";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import { redeemRewardPoints } from "@/Helper/rewardPoints";
import PointsEarnedTable from "@/Components/Applications/PropertyManager/PointsEarnedTable";

interface AmountPointsInterface {
    points: number;
    amount: number;
}

const PropertyManagerRewardPoints = () => {

    const userID = localStorage.getItem("userId");
    const [userData, setUserData] = useState<any>();
    const [modal, setModal] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [showMessage, setShowMessage] = useState<boolean>(false);
    const [transactionType, setTransactionType] = useState<RewardPointsTransactionType>(RewardPointsTransactionType.Earn);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(50);
    const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
    const [transactionData, setTransactionData] = useState<RewardTransaction[]>([]);
    const [allPoints, setAllPoints] = useState<Points>();
    const [redeemPointsAmount, setRedeemPointsAmount] = useState<number | undefined>(undefined);
    const [availablePoints, setAvailablePoints] = useState(0);
    const [redemptionPointConversionRate, setRedemptionPointConversionRate] = useState(0);

    const toggleModel = () => setModal(!modal);

    const fetchRedemptionConversionRate = async () => {
        const redemptionConversionRateStr = await getOption("redemption_conversion_rate", true);
        if (typeof redemptionConversionRateStr === "boolean" || redemptionConversionRateStr === "") return;
        const { points } = JSON.parse(redemptionConversionRateStr.toString());
        if (!points) return;
        setRedemptionPointConversionRate(points);
    };

    const fetchUserDetails = async () => {
        if (!userID) {
            const details = await getUserById(userID as string);
            if (typeof details == "boolean") {
                toast.error("We couldn't retrieve your details! Please try logging out and logging back in, or contact our support team for assistance.");
                setIsLoading(false);
                return;
            }
            setUserData(details);
        }
    };

    const fetchUserPoints = async () => {
        try {
            const userIDValue = userID as string;
            const points = await getPointsData(userIDValue);
            setAllPoints(points);
            setAvailablePoints(points.available_points);
        } catch (error) { }
    };

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

    const handleRedeemPoints = async (redeemPoint: number) => {
        setSubmitted(true);
        if ((redeemPointsAmount ?? 0) <= 0 || Number.isNaN(redeemPointsAmount ?? 0)) {
            return;
        }

        try {
            setShowMessage(true);
            if (availablePoints > 0) {
                setShowMessage(false);
                setIsLoading(true);
                const points = await redeemRewardPoints(userID as string, redeemPoint);
                if (points) {
                    setModal(false);
                    setIsLoading(false);
                    fetchUserPoints();
                    setTransactionType(RewardPointsTransactionType.Redeem);
                    toast.success("Points redeemed successfully.");
                    setRedeemPointsAmount(undefined);
                    setSubmitted(false);
                } else {
                    toast.error("Something went wrong! Please try again later or contact our support team.");
                    setIsLoading(false);
                    setModal(false);
                    setRedeemPointsAmount(undefined);
                    setSubmitted(false);
                }
            } else {
                setIsLoading(false);
                setShowMessage(true);
                setModal(false);
                toast.error("Something went wrong. Please try again later!");
                setRedeemPointsAmount(undefined);
                setSubmitted(false);
            }
        } catch (error) {
            console.log(error.response);
            setModal(false);
            setIsLoading(false);
            toast.error("Something went wrong.");
            setRedeemPointsAmount(undefined);
            setSubmitted(false);
        }
    };

    useEffect(() => {
        if (isLoading || !userID) return;
        fetchTransactionData();
    }, [perPage, currentPage, transactionType, displayOrder]);

    useEffect(() => {
        fetchRedemptionConversionRate();
        fetchUserDetails();
        fetchUserPoints();
        fetchTransactionData();
    }, []);

    return <div className="user-reward-points-page property-manager-earnings-page">
        {/* Earnings states  */}
        <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
                <div className="border rounded p-2 h-100 d-flex align-items-center">
                    <img src={PointsImg.src} alt="Points" className="me-3" width="40" height="40" />
                    <div>
                        <div style={{ color: "#797979" }} className="mb-1 fs-6 fw-normal">Available Points</div>
                        <div className="d-flex align-items-center">
                            <span className="h5 mb-0 me-2">
                                {allPoints?.available_points ? allPoints.available_points : 0}
                            </span>
                            {(allPoints?.available_points && allPoints?.available_points > 0) &&
                                <button className="btn btn-outline-primary btn-sm" type="button" onClick={e => setModal(true)}>Redeem Points</button>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-md-4">
                <div className="border rounded p-2 h-100 d-flex align-items-center">
                    <img src={TotalPoints.src} alt="Total Points" className="me-3" width="40" height="40" />
                    <div>
                        <div style={{ color: "#797979" }} className="fs-6 mb-1 fw-normal">Total Points Earned</div>
                        <div className="h5 mb-0">
                            {allPoints?.total_earned_points ? allPoints.total_earned_points : 0}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12 col-md-4">
                <div className="border rounded p-2 h-100 d-flex align-items-center">
                    <img src={RedeemPoints.src} alt="Redeem Points" className="me-3" width="40" height="40" />
                    <div>
                        <div style={{ color: "#797979" }} className="fs-6 mb-1 fw-normal">Total Points Redeemed</div>
                        <div className="h5 mb-0">
                            {allPoints?.total_redeemed_points ? allPoints.total_redeemed_points : 0}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* EOF Earnings states  */}

        {/* Title and toggle section */}
        <div className="d-flex justify-content-between align-items-center mb-4 gap-2 mt-4">
            <h3 className="mb-0 text-dark f-w-500 ff-sora fs-5">
                {(transactionType == RewardPointsTransactionType.Redeem) ? `Points Redeemed` : `Points Earned`}
            </h3>
            <div className="d-flex justify-content-between align-items-center bg-white rounded-3 shadow overflow-hidden ms-auto">
                <button
                    className={`p-2 px-3 flex-fill ff-sora border-0 ${(transactionType == RewardPointsTransactionType.Earn) ? `bg-primary` : `bg-transparent`}`}
                    onClick={e => setTransactionType(RewardPointsTransactionType.Earn)}
                    disabled={isLoading}
                >Points Earned</button>
                <button
                    className={`p-2 px-3 flex-fill ff-sora border-0 ${(transactionType == RewardPointsTransactionType.Redeem) ? `bg-primary` : `bg-transparent`}`}
                    onClick={e => setTransactionType(RewardPointsTransactionType.Redeem)}
                    disabled={isLoading}
                >Points Redeemed</button>
            </div>
        </div>
        {/* EOF Title and toggle section */}

        <div className="reward-points-earned-points mt-4">

            {/* Earned Points */}
            {transactionType == RewardPointsTransactionType.Earn &&
                <PointsEarnedTable isLoading={isLoading} transactionData={transactionData} />
            }
            {/* EOF Earned Points */}

            {/* Redeemed Points */}
            {transactionType == RewardPointsTransactionType.Redeem &&
                <Card className="overflow-hidden">
                    <div className="table-responsive">
                        <table className="table">
                            <thead className="ff-sora table-color">
                                <tr>
                                    <th style={{ width: "125px" }}>Date</th>
                                    <th>Description</th>
                                    <th className="text-end" style={{ width: "100px" }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading &&
                                    <tr>
                                        <td colSpan={3}><LoadingIcon /></td>
                                    </tr>
                                }
                                {(!isLoading && transactionData.length <= 0) &&
                                    <tr>
                                        <td colSpan={3} className="text-center">Points are not available!</td>
                                    </tr>
                                }
                                {(!isLoading && transactionData.length > 0) &&
                                    transactionData.map((data, dataIndex) => {
                                        return <tr key={`redeemed-points-tr-${dataIndex}`}>
                                            <td>{formatDate(data.created_at)}</td>
                                            <td>{data.description}</td>
                                            <td className="text-end">{data.points}</td>
                                        </tr>
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </Card>
            }
            {/* EOF Redeemed Points */}

        </div>

        {/* Pagination */}
        <div className="pagination-bar d-flex justify-content-between align-items-center g-2">
            <PaginationInfo currentPage={currentPage} recordsPerPage={perPage} totalRecords={totalRecords} onPerPageChange={data => setPerPage(data)} showDropDown={true} />

            {totalPages > 1 &&
                <PaginationComponent currentPage={currentPage} perPage={perPage} totalRecords={totalRecords} onPageChange={data => setCurrentPage(data)} />
            }
        </div>
        {/* EOF Pagination */}

        {/* Redeem Model */}
        <Modal className="rbp-user-portal" isOpen={modal} toggle={toggleModel}>
            <ModalHeader toggle={toggleModel}>Redeem Points</ModalHeader>
            <ModalBody className="">
                <p>Enter the number of points you want to redeem.</p>
                <label htmlFor="pointsInput">Points<span className="text-danger">*</span></label>
                <input
                    type="number"
                    id="pointsInput"
                    className="form-control mb-2"
                    value={redeemPointsAmount}
                    min={0}
                    onChange={(e) => setRedeemPointsAmount(parseInt(e.target.value))}
                />
                {(redeemPointsAmount ?? 0) > 0 &&
                    (redeemPointsAmount ?? 0) <= (availablePoints ?? 0) && (
                        <p className="m-0">
                            You will receive a <b>{priceFormat((redeemPointsAmount ?? 0) / redemptionPointConversionRate)}</b> reward via <a href="https://www.tremendous.com/" target="_blank" rel="noopener noreferrer" className="text-dark crumb-link">tremendous.com</a>, which will be sent to your <b>{userData && userData?.user_email}</b> email address.
                        </p>
                    )}
                {(redeemPointsAmount ?? 0) > availablePoints && (
                    <div className="text-danger m-0">
                        Please enter value less than {availablePoints}
                    </div>
                )}
                {showMessage && (
                    <div className="alert alert-danger m-0">
                        {"You don't have points to redeem."}
                    </div>
                )}
                {submitted &&
                    ((redeemPointsAmount ?? 0) <= 0 || Number.isNaN(redeemPointsAmount)) && (
                        <div className="text-danger m-0">
                            {"Please enter the points to redeem."}
                        </div>
                    )}
            </ModalBody>
            <ModalFooter>
                <button
                    className="btn btn-outline-primary btn-sm redeem-points"
                    onClick={() => {
                        handleRedeemPoints(redeemPointsAmount ?? 0);
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <LoadingIcon withOverlap={true} />
                            {"Redeem Points"}
                        </>
                    ) : (
                        "Redeem Points"
                    )}
                </button>
                {showMessage && (
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => {
                            setModal(false);
                            setShowMessage(false);
                        }}
                    >
                        Close
                    </button>
                )}
            </ModalFooter>
        </Modal>
        {/* EOF Redeem Model */}

    </div>
}

export default PropertyManagerRewardPoints;