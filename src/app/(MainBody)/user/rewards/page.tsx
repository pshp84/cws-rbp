"use client";

import withAuth from "@/Components/WithAuth/WithAuth";
import {
  getOptions,
  getUserById,
  getUserMeta,
  updateUserMeta,
} from "@/DbClient";
import {
  getAvailablePoints,
  getPointsData,
  getRewadPointTransactions,
  RewardPointsTransactionType,
} from "@/DbClient/rewardPoints";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import { Points, ReferenceData, RewardTransaction } from "@/Types/Rewards";
import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "reactstrap";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import plaidImg from "../../../../../public/assets/images/plaid/plaidImg.jpeg";
import { createPlaidLinkToken } from "@/Helper/plaidHelper";
import { usePlaidLink } from "react-plaid-link";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { redeemRewardPoints, refreshRewardPoints } from "@/Helper/rewardPoints";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import { toast } from "react-toastify";

interface AmountPointsInterface {
  points: number;
  amount: number;
}

const UserDeals = () => {
  const [modal, setModal] = useState(false);
  const [activeView, setActiveView] = useState("earnedPoints");
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemPointsAmount, setRedeemPointsAmount] = useState(0);
  const [value, setValue] = useState<AmountPointsInterface>();
  const [transactionData, setTransactionData] = useState<RewardTransaction[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const userId = localStorage.getItem("userId");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [accessToken, setAccessToken] = useState<string | null>("");
  const [userData, setUserData] = useState<any>();
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string | null>(null);
  const [plaidData, setPlaidData] = useState<any>();
  const [referenceData, setReferenceData] = useState<ReferenceData[]>([]);
  const [tokenLoading, setTokenLoading] = useState<boolean>(true);
  const [pointsRedeemed, setPointsRedeemed] = useState<RewardTransaction[]>([]);
  const [earnedTransaction, setEarnedTransaction] = useState<
    RewardTransaction[]
  >([]);
  const [pointsEarned, setPointsEarned] = useState<ReferenceData[]>([]);
  const [redeemLoading, setRedeemLoading] = useState<boolean>(false);
  const [earnLoading, setEarnLoading] = useState<boolean>(false);
  const [lastDate, setLastDate] = useState<any>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [allPoints, setAllPoints] = useState<Points>();
  const [loader, setLoader] = useState(false);

  const plaidSuccess = async (accessToken: string) => {
    setNewToken(accessToken);
    setPlaidAccessToken(accessToken);
    const authResponse = await rbpApiCall.post("/plaid/auth", {
      access_token: accessToken,
    });

    if (authResponse.data.ach_data) {
      console.log("ACH Bank Details", authResponse.data.ach_data);
      const firstAchData = authResponse.data.ach_data[0];
      setPlaidData(firstAchData);
    }
  };

  const plaidError = (error: any, metadata: any) => {
    console.log("Plaid Error", error);
    console.log("Plaid Metadata", metadata);
    if (error) {
      toast.error(
        error.display_message ? error.display_message : "Something went wrong"
      );
    }
  };

  const updatePlaidAccessNewTokenToUser = async () => {
    if (newToken !== null) {
      await updateUserMeta(userId as string, "plaid_access_token", newToken);
    }
  };

  // const getPlaidLinkToken = async () => {
  //   if (!accessToken) {
  //     if (userId) {
  //       const linkToken = await createPlaidLinkToken(userId as string);
  //       if (linkToken) setPlaidLinkToken(linkToken);
  //     }
  //   }
  // };

  // const plaidOnSuccess = async (public_token: string) => {
  //   try {
  //     const response = await rbpApiCall.post("/plaid/exchange-token", {
  //       public_token,
  //     });
  //     const accessToken = response.data.access_token;
  //     setPlaidAccessToken(accessToken);

  //     const authResponse = await rbpApiCall.post("/plaid/auth", {
  //       access_token: accessToken,
  //     });

  //     if (authResponse.data.ach_data) {
  //       console.log("ACH Bank Details", authResponse.data.ach_data);
  //       const firstAchData = authResponse.data.ach_data[0];
  //       setPlaidData(firstAchData);
  //     }
  //   } catch (error) {
  //     console.error("Error exchanging public token:", error);
  //   }
  // };

  // const { open: plaidLinkOpen, ready: plaidLinkReady } = usePlaidLink({
  //   token: plaidLinkToken!,
  //   onSuccess: plaidOnSuccess,
  // });

  const updatePlaidAccessTokenToUser = async () => {
    if (plaidAccessToken !== null) {
      setLoader(true);
      const data = await updateUserMeta(
        userId as string,
        "plaid_access_token",
        plaidAccessToken
      );
      if (data) {
        setLoader(false);
      }
    }
  };

  const points = value && value ? value?.points : 0;

  const toggleModel = () => setModal(!modal);

  const fetchAvialiablePoints = async () => {
    try {
      const result = await getAvailablePoints(userId as string);
      setAvailablePoints(result);
    } catch (error) {}
  };

  const fetchPointsOptions = async () => {
    try {
      const optionData = await getOptions(["redemption_conversion_rate"]);
      if (optionData) {
        const option = optionData.find(
          (item: any) => item.option_key === "redemption_conversion_rate"
        );
        if (option) {
          const parseJson = JSON.parse(option.option_value);
          setValue(parseJson);
        }
      }
    } catch (error) {}
  };

  const fetchRewardTransactions = async (page: number = 0) => {
    setLoading(true);

    const rewardsData = await getRewadPointTransactions({
      page: page === 0 ? currentPage : page,
      limit: perPage,
      order: displayOrder,
      userID: userId as string,
      type:
        activeView === "earnedPoints"
          ? ("earn" as RewardPointsTransactionType)
          : ("redeem" as RewardPointsTransactionType),
    });

    // if (!rewardsData || !rewardsData.status) {
    //   setTransactionData([]);
    //   setLoading(false);
    //   return;
    // }
    if (rewardsData.data?.length === 0) {
      const reloadRewardsData = await refreshRewardPoints(userId as string);
      if (reloadRewardsData === false) {
        setTransactionData([]);
        setLoading(false);
      }
      return;
    }
    if (rewardsData && rewardsData.status) {
      if (rewardsData.totalPages) setTotalPages(rewardsData.totalPages);
      if (rewardsData.totalRecords) setTotalRecords(rewardsData.totalRecords);
      if (rewardsData.data) setTransactionData(rewardsData.data);
      if (rewardsData.data) {
        const getData: any[] = rewardsData.data.map((el) => el.reference_data);
        const convertData = getData.map((data) => JSON.parse(data));
        setReferenceData(convertData);
      }
      setLoading(false);
      return;
    }
  };

  const fetchRedeemPoints = async () => {
    setRedeemLoading(true);
    const data = await getRewadPointTransactions({
      page: currentPage,
      limit: perPage,
      order: displayOrder,
      userID: userId as string,
      type: "redeem" as RewardPointsTransactionType,
    });
    if (!data || !data.data) {
      setRedeemLoading(false);
      return;
    }
    if (data && data.data) setPointsRedeemed(data.data);
    setRedeemLoading(false);

    return;
  };

  const fetchEarnPoints = async () => {
    setEarnLoading(true);
    const data = await getRewadPointTransactions({
      page: currentPage,
      limit: perPage,
      order: displayOrder,
      userID: userId as string,
      type: "earn" as RewardPointsTransactionType,
    });
    if (!data || !data.data) {
      setEarnLoading(false);
      return;
    }
    if (data && data.status) {
      if (data.data) setEarnedTransaction(data.data);
      const getData: any[] = data.data.map((el) => el.reference_data);
      const convertData = getData.map((data) => JSON.parse(data));
      setPointsEarned(convertData);
      setEarnLoading(false);
    }

    return;
  };

  const handleRedeemPoints = async (redeemPoint: number) => {
    try {
      setShowMessage(true);
      if (availablePoints > 0) {
        setShowMessage(false);
        const points = await redeemRewardPoints(userId as string, redeemPoint);
        if (points) {
          setModal(false);
        }
      } else {
        setShowMessage(true);
      }
    } catch (error) {}
  };

  const fetchMeta = async () => {
    try {
      const userMetaData = await getUserMeta(
        userId as string,
        "plaid_access_token"
      );
      if (userMetaData) {
        setAccessToken(userMetaData[0].meta_value);
      } else {
        setAccessToken(null);
      }
    } catch (error) {
      setAccessToken(null);
    } finally {
      setTokenLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const user = await getUserById(userId as string, [
        "first_name",
        "last_name",
        "user_email",
      ]);
      if (user) {
        setUserData(user);
      }
    } catch (error) {}
  };

  const fetchPoints = async () => {
    try {
      const points = await getPointsData(userId as string);
      setAllPoints(points);
    } catch (error) {}
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
  }, [loadingStatus]);

  useEffect(() => {
    fetchAvialiablePoints();
    fetchPointsOptions();
    fetchUser();
    fetchPoints();
  }, [userId]);

  useEffect(() => {
    fetchMeta();
  }, [plaidData]);

  useEffect(() => {
    updatePlaidAccessTokenToUser();
  }, [plaidAccessToken]);

  useEffect(() => {
    updatePlaidAccessNewTokenToUser();
  }, [newToken]);

  useEffect(() => {
    fetchRewardTransactions(currentPage);
    fetchRedeemPoints();
    fetchEarnPoints();
  }, [activeView, currentPage, perPage, displayOrder]);

  if (tokenLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
      </div>
    );
  }

  return (
    <>
      {accessToken && (
        <div className="user-rewards-section mb-4 col-12">
          <div className="row">
            <div className="col-md-12 mx-auto">
              {/* reward points summary */}
              <div className="row mb-5">
                <div className="col-md-4">
                  <Card className="mb-0">
                    <CardHeader className="border-t-primary">
                      <h4 className="widget m-0">Available Points</h4>
                    </CardHeader>
                    <CardBody>
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                            <h2>
                              {allPoints?.available_points
                                ? allPoints.available_points
                                : 0}
                            </h2>
                            <button
                              onClick={toggleModel}
                              className="btn btn-primary px-2"
                            >
                              Redeem Points
                            </button>
                          </div>
                          <p className="text-truncate">
                            {`Every ${
                              value && value?.points
                            } points are worth ${priceFormat(
                              value?.amount as number
                            )}`}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="col-md-4">
                  <Card className="mb-0">
                    <CardHeader className="border-t-success">
                      <h4 className="widget m-0">Total Points Earned</h4>
                    </CardHeader>
                    <CardBody>
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                            <h2>
                              {allPoints?.total_earned_points
                                ? allPoints.total_earned_points
                                : 0}
                            </h2>
                          </div>
                          <p className="text-truncate">
                            {/* {`Last earned on ${
                              pointsEarned && pointsEarned.length > 0
                                ? formatDate(
                                    pointsEarned[0].authorized_date ||
                                      pointsEarned[0].date ||
                                      earnedTransaction[0].created_at
                                  )
                                : ""
                            }`} */}
                            {`${pointsEarned && pointsEarned.length > 0 ? `Last earned on ${formatDate(
                                    pointsEarned[0].authorized_date ||
                                      pointsEarned[0].date ||
                                      earnedTransaction[0].created_at
                                  )}` : 'No earned points available'}`}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="col-md-4">
                  <Card className="mb-0">
                    <CardHeader className="border-t-danger">
                      <h4 className="widget m-0">Total Points Redeemed</h4>
                    </CardHeader>
                    <CardBody>
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                            <h2>
                              {allPoints?.total_redeemed_points
                                ? allPoints.total_redeemed_points
                                : 0}
                            </h2>
                          </div>
                          <p className="text-truncate">
                            {/* {`Last redeemed on ${
                              pointsRedeemed && pointsRedeemed.length > 0
                                ? formatDate(pointsRedeemed[0].created_at)
                                : ""
                            }`} */}
                            {pointsRedeemed && pointsRedeemed.length > 0 ? `Last redeemed on ${formatDate(pointsRedeemed[0].created_at)}` : "No redeemed points available"}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>
              {/* EOF reward points summary */}

              {/* Update plaid button */}
              <div style={{ width: "40%" }}>
                <PlaidLinkButton
                  cssClasses="mb-4"
                  buttonText="Update"
                  userID={userId as string}
                  onSuccess={plaidSuccess}
                  onError={plaidError}
                  isLoading={setLoadingStatus}
                />
              </div>
              {/* EOF Update plaid button */}
              {/* Title section */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">
                  {activeView == "earnedPoints"
                    ? `Points Earned`
                    : `Points Redeemed`}
                </h3>
                <div className="d-flex justify-content-between align-items-center bg-white rounded-3 shadow overflow-hidden">
                  <button
                    onClick={() => setActiveView("earnedPoints")}
                    className={`p-2 px-3 flex-fill bg-${
                      activeView == "earnedPoints" ? "primary" : "transparent"
                    } border-0`}
                  >
                    Points Earned
                  </button>
                  <button
                    onClick={() => setActiveView("pointsRedeemed")}
                    className={`p-2 px-3 flex-fill bg-${
                      activeView == "pointsRedeemed" ? "primary" : "transparent"
                    } border-0`}
                  >
                    Points Redeemed
                  </button>
                </div>
              </div>
              {/* EOF Title section */}
              <div className="flex-fill">
                {!loading && transactionData.length > 0 && (
                  <div className="d-flex align-items-center gap-2">
                    {PaginationInfo({
                      currentPage,
                      limit: perPage,
                      totalRecords,
                    })}
                    <span>|</span>
                    <div className="d-flex align-items-center gap-1">
                      <span>Per Page:</span>
                      <Dropdown
                        size="sm"
                        isOpen={perPageDropdownOpen}
                        toggle={togglePerPageDropdown}
                      >
                        <DropdownToggle
                          className="px-2 py-1"
                          color="primary"
                          caret
                        >
                          {perPage}
                        </DropdownToggle>
                        <DropdownMenu>
                          <DropdownItem onClick={() => setPerPage(10)}>
                            10
                          </DropdownItem>
                          <DropdownItem onClick={() => setPerPage(20)}>
                            20
                          </DropdownItem>
                          <DropdownItem onClick={() => setPerPage(50)}>
                            50
                          </DropdownItem>
                          <DropdownItem onClick={() => setPerPage(80)}>
                            80
                          </DropdownItem>
                          <DropdownItem onClick={() => setPerPage(100)}>
                            100
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                )}
              </div>
              {/* Earned Points */}
              {activeView == "earnedPoints" && (
                <div className="reward-points-earned-points mt-4">
                  <Card className="overflow-hidden">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: "120px" }}>Date</th>
                            {/* <th style={{ width: "125px" }}>Transaction ID</th> */}
                            <th style={{ width: "200px" }}>Account Details</th>
                            <th className="">Paid To</th>
                            <th>Payment Channel</th>
                            <th className="text-end" style={{ width: "110px" }}>
                              Amount Paid
                            </th>
                            <th className="text-end" style={{ width: "120px" }}>
                              Points Earned
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(transactionData.length <= 0 ||
                            referenceData.length <= 0) && (
                              <tr>
                                <td className="text-center" colSpan={9}>
                                  No data found.
                                </td>
                              </tr>
                            )}
                          {transactionData.map((data, index) => {
                            const ref = referenceData[index];
                            if (!referenceData || !ref) {
                              <tr key={index}>
                                <td className="text-center" colSpan={9}>
                                  No data found.
                                </td>
                              </tr>;
                            }

                            return (
                              <React.Fragment key={index}>
                                <tr>
                                  <td>
                                    {formatDate(
                                      ref.authorized_date ||
                                        ref.date ||
                                        data.created_at
                                    )}
                                  </td>
                                  <td>
                                    {ref &&
                                    ref.account_data &&
                                    ref.account_data.official_name &&
                                    ref.account_data.mask &&
                                    ref.account_data.name
                                      ? `${
                                          ref.account_data.official_name.split(
                                            " "
                                          )[0]
                                        } xx${ref.account_data.mask.slice(
                                          -4
                                        )} ${ref.account_data.name}`
                                      : ""}
                                  </td>
                                  <td className="">
                                    {ref.merchant_name
                                      ? ref.merchant_name
                                      : ref.name}
                                  </td>
                                  <td className="" style={{ width: "145px" }}>
                                    {ref.payment_channel}
                                  </td>
                                  <td className="text-end">
                                    {priceFormat(ref.amount)}
                                  </td>
                                  <td className="text-end">{data.points}</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
              {/* EOF Earned Points */}

              {/* Points Redeemed */}
              {activeView == "pointsRedeemed" && (
                <div className="reward-points-redeemed mt-4">
                  <Card className="overflow-hidden">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th style={{ width: "150px" }}>Date</th>
                            <th>Description</th>
                            <th className="text-end" style={{ width: "100px" }}>
                              Points
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ||
                            (transactionData.length <= 0 && (
                              <tr>
                                <td className="text-center" colSpan={9}>
                                  No data found.
                                </td>
                              </tr>
                            ))}
                          {transactionData.map((data, index) => {
                            if (data.transaction_type != "earn")
                              return (
                                <tr key={`transactionsHistory${index}`}>
                                  <td>{formatDate(data.created_at)}</td>
                                  <td>
                                    {data.description}{" "}
                                    {/* {data.transaction_type ===
                                      ("earn" as RewardPointsTransactionType) && (
                                      <a href="#">View Details</a>
                                    )} */}
                                    {/* {data.description} */}
                                  </td>
                                  <td className="text-end">-{data.points}</td>
                                </tr>
                              );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
              {/* EOF Points Redeemed */}
            </div>
            {!loading && transactionData.length > 0 && (
              <div className="d-flex justify-content-end align-items-center gap-2">
                <div className="flex-fill">
                  {PaginationInfo({
                    currentPage,
                    limit: perPage,
                    totalRecords,
                  })}
                </div>

                {totalPages > 1 && (
                  <PaginationComponent
                    totalRecords={totalRecords}
                    perPage={perPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>

          {/* Redeem Model */}
          <Modal isOpen={modal} toggle={toggleModel}>
            <ModalHeader toggle={toggleModel}>Redeem Points</ModalHeader>
            <ModalBody>
              <p>Enter the number of points you want to redeem.</p>
              <label htmlFor="pointsInput">Points*:</label>
              <input
                type="number"
                id="pointsInput"
                className="form-control mb-2"
                value={redeemPointsAmount}
                onChange={(e) =>
                  setRedeemPointsAmount(parseInt(e.target.value))
                }
              />
              {redeemPointsAmount > 0 &&
                redeemPointsAmount <= availablePoints && (
                  <p className="m-0">
                    You will receive a{" "}
                    <b>{priceFormat(redeemPointsAmount / points)}</b> reward via{" "}
                    <a
                      href="https://www.tremendous.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      tremendous.com
                    </a>
                    , which will be sent to your{" "}
                    <b>{userData && userData?.user_email}</b> email address.
                  </p>
                )}
              {redeemPointsAmount > availablePoints && (
                <div className="alert alert-danger m-0">
                  Please enter value less than{" "}
                  {availablePoints && availablePoints + 1}
                </div>
              )}
              {showMessage && (
                <div className="alert alert-danger m-0">
                  {"You don't have points to redeem"}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                onClick={() => {
                  handleRedeemPoints(redeemPointsAmount);
                }}
              >
                Redeem Points
              </Button>
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
      )}

      {!accessToken && (
        <div className="mt-8 text-center">
          <h1>{"Please connect your account to plaid"}</h1>
          <br />
          
          <div style={{ display: "inline-block", width: "30%" }}>
            <PlaidLinkButton
              cssClasses="mb-4"
              buttonText="Connect to"
              userID={userId as string}
              onSuccess={plaidSuccess}
              onError={plaidError}
              isLoading={setLoadingStatus}
            />
          </div>
        </div>
      )}
    </>
  );
};

const PaginationInfo = ({
  totalRecords,
  limit,
  currentPage,
}: {
  totalRecords: number;
  limit: number;
  currentPage: number;
}) => {
  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <p className="m-0">
      Showing <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{totalRecords}</span>
    </p>
  );
};

export default withAuth(UserDeals);
