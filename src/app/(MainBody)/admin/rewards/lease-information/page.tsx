"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import { dataResponseInterface, getLeaseInfoList, getLeaseInfoListArgs, getUsersFromLeaseInfo, updateLeaseInfo } from "@/DbClient";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "reactstrap";

const leaseInformationsPage = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [displayOrderBy, setDisplayOrderBy] = useState<"updated_at" | "created_at">("created_at");
    const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
    const [displayOrderCreatedAt, setDisplayOrderCreatedAt] = useState<"asc" | "desc">("desc");
    const [displayOrderUpdatedAt, setDisplayOrderUpdatedAt] = useState<"asc" | "desc">("desc");
    const [leaseInfoList, setLeaseInfoList] = useState<Array<any>>([]);
    const [userIDFilter, setUserIDFilter] = useState<string>();
    const [verificationStatusFilter, setVerificationStatusFilter] = useState<boolean | undefined>();
    const [isUsersListLoading, setIsUsersListLoading] = useState<boolean>(false);
    const [usersList, setUsersList] = useState<Array<any>>([]);
    const [userAvailablePoints, setUserAvailablePoints] = useState<number>();

    const fatchLeaseInfoUsers = async () => {
        setIsUsersListLoading(true);
        const data = await getUsersFromLeaseInfo();
        if (typeof data === "boolean") {
            setIsUsersListLoading(false);
            return;
        }
        setUsersList(data);
        setIsUsersListLoading(false);
    }

    const fetchLeaseInfoList = async (page: number = 0) => {
        setIsLoading(true);
        let pageNumber = currentPage
        if (page !== 0) {
            pageNumber = page;
            setCurrentPage(page);
        }

        const getLeaseInfoArgs: getLeaseInfoListArgs = {
            limit: perPage,
            page: pageNumber,
            order: displayOrder,
            orderBy: displayOrderBy
        }

        if (userIDFilter != "") getLeaseInfoArgs.userID = userIDFilter;
        if (typeof verificationStatusFilter !== "undefined") getLeaseInfoArgs.verificationStatus = verificationStatusFilter;

        const data: dataResponseInterface | boolean = await getLeaseInfoList(getLeaseInfoArgs);

        if (typeof data === "boolean") {
            setLeaseInfoList([]);
            setIsLoading(false);
            return;
        }

        if (!data.status) {
            setLeaseInfoList([]);
            setIsLoading(false);
            return;
        }

        if (data.data) setLeaseInfoList(data.data);
        if (data.totalRecords) setTotalRecords(data.totalRecords);
        if (data.totalPages) setTotalPages(data.totalPages);
        setIsLoading(false);
    }

    const updateLeaseInfoStatus = async (userID: string, newStatus: boolean) => {

        setIsLoading(true);
        const updatedData = await updateLeaseInfo(userID, {
            verificationStatus: newStatus
        });

        if (typeof updatedData === "boolean") {
            toast.error("Something is wrong! status is not updated");
            setIsLoading(false);
            return;
        }
        const newLeaseInfoList = leaseInfoList.map(data => {
            if (data.user_id === userID) {
                data.verification_status = newStatus
                data.updated_at = updatedData.updated_at
            }
            return data;
        });
        setLeaseInfoList(newLeaseInfoList);
        toast.success("Status updated successfully.");
        setIsLoading(false);
    }

    useEffect(() => {
        if (!isLoading) {
            fetchLeaseInfoList(1);
        }
    }, [perPage, displayOrder, displayOrderBy, userIDFilter, verificationStatusFilter]);

    useEffect(() => {
        fatchLeaseInfoUsers();
        fetchLeaseInfoList();
    }, []);

    return <div className="lease-informations-admin mb-4 col-12">
        {/* Top bar */}
        <div className={`lease-informations-top-bar d-flex justify-content-${(isLoading) ? 'end' : 'between'} align-items-center gap-2 mb-3`}>
            {!isLoading && <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={true} onPerPageChange={setPerPage} />}

            {(!isLoading && userIDFilter && userAvailablePoints) &&
                <span className="m-0 d-flex align-items-center gap-1 btn btn-sm btn-outline-primary px-2">Total Available Points: <span className="badge bg-primary">{userAvailablePoints}</span></span>
            }

            <div className="d-flex justify-content-end align-items-center gap-2">
                <select className="form-select form-select-sm" disabled={isLoading || isUsersListLoading} value={userIDFilter} onChange={e => setUserIDFilter(e.target.value)}>
                    <option value="">Select User</option>
                    {usersList.length > 0 &&
                        usersList.map((user, userIndex) => {
                            return <option key={`rewards-pointsuser-select-${userIndex}`} value={user.user_id}>{`${user.first_name} ${user.last_name}`}</option>
                        })
                    }
                </select>

                <select
                    className="form-select form-select-sm"
                    disabled={isLoading}
                    value={
                        verificationStatusFilter === true
                            ? "1"
                            : verificationStatusFilter === false
                                ? "0"
                                : ""
                    }
                    onChange={e => {
                        switch (e.target.value) {
                            case "0":
                                setVerificationStatusFilter(false);
                                break;

                            case "1":
                                setVerificationStatusFilter(true);
                                break;

                            default:
                                setVerificationStatusFilter(undefined);
                                break;
                        }
                    }}
                >
                    <option value="">Select Type</option>
                    <option value="1">Verified</option>
                    <option value="0">Unverified</option>
                </select>
            </div>
        </div>
        {/* EOF Top bar */}

        {/* Card Table */}
        <Card className="overflow-hidden position-relative">
            <div className="table-responsive">
                {isLoading && <LoadingIcon withOverlap={true} />}
                <table className="table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: "50px" }}>#</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Rent Amount</th>
                            <th>Rent Day</th>
                            <th className="text-center" style={{ width: "80px" }}>Lease</th>
                            <th className="text-center" style={{ width: "80px" }}>Verified</th>
                            <th style={{ width: "135px" }}>Updated Date &nbsp;
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setDisplayOrderCreatedAt("desc");
                                    setDisplayOrderUpdatedAt(displayOrderUpdatedAt == "asc" ? "desc" : "asc");
                                    setDisplayOrder(displayOrder == "asc" ? "desc" : "asc");
                                }}
                                >
                                    <i className={`fa fa-sort-${displayOrderUpdatedAt}`}></i>
                                </a>
                            </th>
                            <th style={{ width: "135px" }}>Created Date &nbsp;
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setDisplayOrderUpdatedAt("desc");
                                    setDisplayOrderCreatedAt(displayOrderCreatedAt == "asc" ? "desc" : "asc");
                                    setDisplayOrder(displayOrder == "asc" ? "desc" : "asc");
                                }}
                                >
                                    <i className={`fa fa-sort-${displayOrderCreatedAt}`}></i>
                                </a>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!isLoading && leaseInfoList.length <= 0) &&
                            <tr>
                                <td className="text-center" colSpan={9}>Lease informations not found.</td>
                            </tr>
                        }
                        {leaseInfoList.length > 0 &&
                            leaseInfoList.map((leaseInfo, leaseInfoIndex) => {
                                return <tr key={`lease-informations-tr-${leaseInfoIndex}`}>
                                    <td className="text-center">{leaseInfo.lease_info_id}</td>
                                    <td>{`${leaseInfo.users.first_name} ${leaseInfo.users.last_name}`}</td>
                                    <td>
                                        <a href={`mailto:${leaseInfo.users.user_email}`}>{leaseInfo.users.user_email}</a>
                                    </td>
                                    <td>{priceFormat(leaseInfo.rent_amount)}</td>
                                    <td>{leaseInfo.rent_date}</td>
                                    <td className="text-center">
                                        {leaseInfo.leaseDocumentURL &&
                                            <a href={leaseInfo.leaseDocumentURL} target="_blank"><i className="fa fa-file-o fs-5"></i></a>
                                        }
                                    </td>
                                    <td className="text-center">
                                        <a
                                            href="#"
                                            title="Click to update status"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateLeaseInfoStatus(leaseInfo.user_id, !leaseInfo.verification_status);
                                            }}
                                        >
                                            {(leaseInfo.verification_status) ? <i className="fa fa-check-circle text-success fs-5"></i> : <i className="fa fa-check-circle-o text-danger fs-5"></i>}
                                        </a>
                                    </td>
                                    <td>
                                        {leaseInfo.updated_at &&
                                            formatDate(leaseInfo.updated_at)
                                        }
                                    </td>
                                    <td>{formatDate(leaseInfo.created_at)}</td>
                                </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Card >
        {/* EOF Card Table */}

        {/* Bottom bar */}
        {
            !isLoading && leaseInfoList.length > 0 && (
                <div className="rewards-points-log-bottom-bar d-flex justify-content-between align-items-center gap-2">
                    <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={false} />

                    {totalPages > 1 && (
                        <PaginationComponent totalRecords={totalRecords} perPage={perPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                    )}
                </div>
            )
        }
        {/* EOF Bottom bar */}
    </div >;
}

export default leaseInformationsPage;