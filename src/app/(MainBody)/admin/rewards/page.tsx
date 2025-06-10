"use client";

import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import withAuth from "@/Components/WithAuth/WithAuth";
import { dataResponseInterface } from "@/DbClient";
import {
  getAvailablePoints,
  GetRewadPointTransactionsArgs,
  getRewadPointTransactions,
  getRewadPointUsers,
  RewardPointsTransactionType,
} from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "reactstrap";

const RewardsListingAdmin = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
  const [rewardPoints, setRewardPoints] = useState<Array<any>>([]);
  const [userIDFilter, setUserIDFilter] = useState<string>();
  const [rewardPointTypeFilter, setRewardPointTypeFilter] = useState<any>();
  const [isUsersListLoading, setIsUsersListLoading] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<Array<any>>([]);
  const [userAvailablePoints, setUserAvailablePoints] = useState<number>();

  const fatchRewadPointUsers = async () => {
    setIsUsersListLoading(true);
    const data = await getRewadPointUsers();
    if (!data) {
      setIsUsersListLoading(false);
      return;
    }
    setUsersList(data);
    setIsUsersListLoading(false);
  };

  const fetchRewardPoints = async (page: number = 0) => {
    setIsLoading(true);
    let pageNumber = currentPage;
    if (page !== 0) {
      pageNumber = page;
      setCurrentPage(page);
    }

    const getRewadPointTransactionsArgs: GetRewadPointTransactionsArgs = {
      limit: perPage,
      page: pageNumber,
      order: displayOrder,
    };

    if (userIDFilter != "") getRewadPointTransactionsArgs.userID = userIDFilter;
    if (rewardPointTypeFilter)
      getRewadPointTransactionsArgs.type = rewardPointTypeFilter;

    const data: dataResponseInterface = await getRewadPointTransactions(
      getRewadPointTransactionsArgs
    );

    if (!data.status) {
      toast.error(data.message);
      setRewardPoints([]);
      setIsLoading(false);
      return;
    }

    if (data.data) setRewardPoints(data.data);
    if (data.totalRecords) setTotalRecords(data.totalRecords);
    if (data.totalPages) setTotalPages(data.totalPages);
    setIsLoading(false);
  };

  const fatchAvailableRewadPoint = async () => {
    if (!userIDFilter) return;
    const data = await getAvailablePoints(userIDFilter);
    if (data) setUserAvailablePoints(data);
  };

  useEffect(() => {
    if (!isLoading) {
      fetchRewardPoints(1);
    }
  }, [perPage, displayOrder, userIDFilter, rewardPointTypeFilter]);

  useEffect(() => {
    fatchAvailableRewadPoint();
  }, [userIDFilter]);

  useEffect(() => {
    if (!isLoading) {
      fetchRewardPoints();
    }
  }, [currentPage]);

  useEffect(() => {
    fatchRewadPointUsers();
    fetchRewardPoints();
  }, []);

  return (
    <div className="rewards-points-log-admin mb-4 col-12">
      {/* Top bar */}
      <div
        className={`rewards-points-log-top-bar d-flex justify-content-${
          isLoading ? "end" : "between"
        } align-items-center gap-2 mb-3`}
      >
        <div className="flex-fill">
          {!isLoading && (
            <PaginationInfo
              totalRecords={totalRecords}
              recordsPerPage={perPage}
              currentPage={currentPage}
              showDropDown={true}
              onPerPageChange={setPerPage}
            />
          )}
        </div>
        {!isLoading && userIDFilter && userAvailablePoints && (
          <span className="m-0 d-flex align-items-center gap-1 btn btn-sm btn-outline-primary px-2">
            Total Available Points:{" "}
            <span className="badge bg-primary">{userAvailablePoints}</span>
          </span>
        )}

        <div className="d-flex justify-content-end align-items-center gap-2">
          <select
          style={{width:'200px',maxWidth:"100%"}}
            className="form-select form-select-sm"
            disabled={isLoading || isUsersListLoading}
            value={userIDFilter}
            onChange={(e) => setUserIDFilter(e.target.value)}
          >
            <option value="">Select User</option>
            {usersList.length > 0 &&
              usersList.map((user, userIndex) => {
                return (
                  <option
                    key={`rewards-pointsuser-select-${userIndex}`}
                    value={user.user_id}
                  >{`${user.first_name} ${user.last_name}`}</option>
                );
              })}
          </select>

          <select
            className="form-select form-select-sm"
            disabled={isLoading}
            value={rewardPointTypeFilter}
            onChange={(e) => setRewardPointTypeFilter(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value={RewardPointsTransactionType.Earn}>
              {RewardPointsTransactionType.Earn}
            </option>
            <option value={RewardPointsTransactionType.Redeem}>
              {RewardPointsTransactionType.Redeem}
            </option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/rewards/add-points')}
          className="btn btn-primary px-3 btn-sm"
        >
          <i className="fa fa-plus"></i> Add new
        </button>
      </div>
      {/* EOF Top bar */}

      {/* Card Table */}
      <Card className="overflow-hidden position-relative">
        <div className="table-responsive">
          {isLoading && (
            <div
              className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
              style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
            >
              Loading please wait...
            </div>
          )}
          <table className="table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "50px" }}>
                  #
                </th>
                <th style={{ width: "200px" }}>User</th>
                <th style={{ width: "100px" }}>Points</th>
                <th style={{ width: "100px" }}>Type</th>
                <th>Description</th>
                <th style={{ width: "125px" }}>
                  Date &nbsp;
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      const newDisplayOrder =
                        displayOrder == "asc" ? "desc" : "asc";
                      setDisplayOrder(newDisplayOrder);
                    }}
                  >
                    <i className={`fa fa-sort-${displayOrder}`}></i>
                  </a>
                </th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && rewardPoints.length <= 0 && (
                <tr>
                  <td className="text-center" colSpan={6}>
                    Points log not found.
                  </td>
                </tr>
              )}
              {rewardPoints.length > 0 &&
                rewardPoints.map((rewardPoint, rewardPointIndex) => {
                  return (
                    <tr key={`reward-point-tr-${rewardPointIndex}`}>
                      <td className="text-center">
                        {rewardPoint.transaction_id}
                      </td>
                      <td>{`${rewardPoint.users.first_name} ${rewardPoint.users.last_name}`}</td>
                      <td>
                        {`${
                          rewardPoint.transaction_type == "earn" ? `+` : `-`
                        }` + rewardPoint.points}
                      </td>
                      <td className="text-capitalize">
                        {rewardPoint.transaction_type}
                      </td>
                      <td>{rewardPoint.description}</td>
                      <td>{formatDate(rewardPoint.date)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
      {/* EOF Card Table */}

      {/* Bottom bar */}
      {!isLoading && rewardPoints.length > 0 && (
        <div className="rewards-points-log-bottom-bar d-flex justify-content-between align-items-center gap-2">
          <PaginationInfo
            totalRecords={totalRecords}
            recordsPerPage={perPage}
            currentPage={currentPage}
            showDropDown={false}
          />

          {totalPages > 1 && (
            <PaginationComponent
              totalRecords={totalRecords}
              perPage={perPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
      {/* EOF Bottom bar */}
    </div>
  );
};

export default withAuth(RewardsListingAdmin);
