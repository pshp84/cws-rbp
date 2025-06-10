"use client";
import React, { useEffect, useState } from "react";
import PointsImg from "../../../../public/assets/images/home/Points.png";
import TotalPoints from "../../../../public/assets/images/home/Total_Points.png";
import RedeemPoints from "../../../../public/assets/images/home/Redeem_points.png";
import {
  getLeaseInfo,
  getOptions,
  getPointsData,
  getRewadPointTransactions,
  getUserById,
  getUserMeta,
  RewardPointsTransactionType,
  updateUserMeta,
} from "@/DbClient";
import { Points, ReferenceData, RewardTransaction } from "@/Types/Rewards";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import {
  Button,
  Card,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";
import { redeemRewardPoints, refreshRewardPoints } from "@/Helper/rewardPoints";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import UserPaginationComponent from "@/CommonComponent/UserPaginationComponent/UserPaginationComponent";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { boolean } from "yup";
import { setDarkMode } from "@/Redux/Reducers/LayoutSlice";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { toast } from "react-toastify";
import ActionsProgress from "@/Components/Applications/ProgressBar/ActionsProgress";
import { AchPaymentMethodData } from "@/Helper/customers";
import { BanquestPaymentMethodTypes } from "@/app/api/banquest/banquestConfig";

interface AmountPointsInterface {
  points: number;
  amount: number;
}

const userRewardPointsPage = () => {
  const userId = localStorage.getItem("userId");
  const [allPoints, setAllPoints] = useState<Points>();
  const [activeView, setActiveView] = useState("earnedPoints");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [transactionData, setTransactionData] = useState<RewardTransaction[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [referenceData, setReferenceData] = useState<ReferenceData[]>([]);
  const [modal, setModal] = useState(false);
  const [redeemPointsAmount, setRedeemPointsAmount] = useState<number | undefined>(undefined);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [value, setValue] = useState<AmountPointsInterface>();
  const [userData, setUserData] = useState<any>();
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>("");
  const [tokenLoading, setTokenLoading] = useState<boolean>(true);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string | null>(null);
  const [plaidData, setPlaidData] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [actionData, setActionData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [values, setValues] = useState<any>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [methodType, setMethodType] = useState<string>("");
  const [achData, setAchData] = useState<AchPaymentMethodData | undefined>();
  const [paymentMethodType, setPaymentMethodType] = useState<
    BanquestPaymentMethodTypes | undefined
  >();
  const [plaidLoading, setPlaidLoading] = useState<boolean>(true);

  const fetchUserMeta = async () => {
    try {
      const result = await getUserMeta(userId as string, "plaid_access_token");
      const result1 = await getUserMeta(
        userId as string,
        "banquest_payment_method_data"
      );
      const result2 = await getUserMeta(
        userId as string,
        "banquest_payment_method_type"
      );
      if (result && result[0] && result1 && result2) {
        setToken(result[0].meta_value);
        setValues(JSON.parse(result1[0].meta_value));
        setMethodType(result2[0].meta_value);
      } else {
        setToken(null);
        setValues(null);
        setMethodType("");
      }
    } catch (error) {}
  };

  const fetchPendingActions = async () => {
    try {
      const result = await getLeaseInfo(userId as string);
      if (result) {
        setActionData(result);
      } else {
        setActionData(null);
      }
    } catch (err) {}
  };

  const fetchUserPoints = async () => {
    try {
      const points = await getPointsData(userId as string);
      setAllPoints(points);
      setAvailablePoints(points.available_points);
    } catch (error) {}
  };

  const points = value && value ? value?.points : 0;

  const toggleModel = () => setModal(!modal);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);

  const plaidSuccess = async (accessToken: string) => {
    setNewToken(accessToken);
    setPlaidAccessToken(accessToken);
    setAccessToken(accessToken);
    const authResponse = await rbpApiCall.post("/plaid/auth", {
      access_token: accessToken,
    });

    if (authResponse.data.ach_data) {
      //console.log("ACH Bank Details", authResponse.data.ach_data);
      const firstAchData = authResponse.data.ach_data[0];
      setPlaidData(firstAchData);
    }
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
        const points = await redeemRewardPoints(userId as string, redeemPoint);
        if (points) {
          setModal(false);
          setIsLoading(false);
          fetchUserPoints();
          toast.success("Points redeemed successfully.");
          setRedeemPointsAmount(undefined);
          setSubmitted(false);
        }else {
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

  const fetchMeta = async () => {
    setTokenLoading(true);
    try {
      const userMetaData = await getUserMeta(
        userId as string,
        "plaid_access_token"
      );
      if (userMetaData) {
        setAccessToken(userMetaData[0].meta_value);
        setTokenLoading(false);
      } else {
        setAccessToken(null);
        setTokenLoading(false);
      }
    } catch (error) {
      setAccessToken(null);
      setTokenLoading(false);
    }
  };

  const updatePlaidAccessNewTokenToUser = async () => {
    if (newToken !== null) {
      await updateUserMeta(userId as string, "plaid_access_token", newToken);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchUser();
    fetchPointsOptions();
    fetchPendingActions();
    fetchUserMeta();
  }, []);

  useEffect(() => {
    fetchMeta();
  }, [plaidData]);

  useEffect(() => {
    updatePlaidAccessNewTokenToUser();
  }, [newToken]);

  useEffect(() => {
    fetchRewardTransactions(currentPage);
  }, [activeView, currentPage, perPage, displayOrder]);

  useEffect(() => {
    if (!accessToken) return;
    const processPlaidToken = async () => {
      setPlaidLoading(true);
      await updateUserMeta(userId as string, "plaid_access_token", accessToken);
      if (accessToken != "") {
        const plaidAuthResponse = await rbpApiCall.post("/plaid/auth", {
          access_token: accessToken,
        });
        if (plaidAuthResponse.data) {
          const { ach_data } = plaidAuthResponse.data;
          if (ach_data.length > 0) {
            setAchData({
              accountNumber: ach_data[0].account_number,
              accountType: ach_data[0].account_type,
              nameOnAccount: ach_data[0].name,
              routingNumber: ach_data[0].routing_number,
            });
            setPaymentMethodType(BanquestPaymentMethodTypes.ach);
          }
        }
      }
      setPlaidLoading(false);
    };
    processPlaidToken();
  }, [token]);

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

  const pendingActionsCount = () => {
    if (!actionData) return !token ? 4 : 3;
    const pendingActions = [
      !actionData.lease_document?.trim(),
      !actionData.rent_amount,
      !actionData.rent_date?.trim(),
    ].filter(Boolean);

    const additionalCount = !token ? 1 : 0;

    return pendingActions.length + additionalCount;
  };

  const pendingCount = pendingActionsCount();

  return (
    <>
      <div className="user-reward-points-page">
        {" "}
        {pendingCount !== 0 && (
          <ActionsProgress
            progressWidth={
              pendingCount === 1
                ? 75
                : pendingCount === 2
                ? 50
                : pendingCount === 3
                ? 25
                : 0
            }
            percentWidth={
              pendingCount === 1
                ? 75
                : pendingCount === 2
                ? 50
                : pendingCount === 3
                ? 25
                : 0
            }
          />
        )}
        <div className="row mb-4">
          <div className="col-12 col-lg-12">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                {/* <div className="border rounded p-2 h-100 d-flex align-items-center">
                  <img
                    src={PointsImg.src}
                    alt="Points"
                    className="me-3"
                    width="40"
                    height="40"
                  />
                  <div>
                    <div
                      style={{ color: "#797979" }}
                      className="mb-1 fs-6 fw-normal"
                    >
                      Available Points
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="h5 mb-0 me-2">
                        {allPoints?.available_points
                          ? allPoints.available_points
                          : 0}
                      </span>
                      <button className="btn btn-outline-primary btn-sm ms-auto">
                        Redeem Points
                      </button>
                    </div>

                  
                  </div>
                </div> */}

                <div className="border rounded p-2 h-100 d-flex align-items-center">
                  <img
                    src={PointsImg.src}
                    alt="Points"
                    className="me-3"
                    width="58"
                    height="58"
                  />
                  <div className="w-100">
                    <div className="mb-1 fw-normal points-text">
                      Available Points
                    </div>
                    <div className="row">
                      <div className="col">
                        <span className="h5 mb-0 me-2">
                          {allPoints?.available_points
                            ? allPoints.available_points
                            : 0}
                        </span>
                      </div>
                      {allPoints?.available_points &&
                        allPoints?.available_points > 0 && (
                          <div className="col-auto">
                            <button
                              onClick={toggleModel}
                              className="btn btn-outline-primary btn-sm"
                            >
                              Redeem Points
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded p-2 h-100 d-flex align-items-center">
                  <img
                    src={TotalPoints.src}
                    alt="Total Points"
                    className="me-3"
                    width="58"
                    height="58"
                  />
                  <div>
                    <div className="fs-6 mb-1 fw-normal points-text">
                      Total Points Earned
                    </div>
                    <div className="h5 mb-0">
                      {allPoints?.total_earned_points
                        ? allPoints.total_earned_points
                        : 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="border rounded p-2 h-100 d-flex align-items-center">
                  <img
                    src={RedeemPoints.src}
                    alt="Redeem Points"
                    className="me-3"
                    width="58"
                    height="58"
                  />
                  <div>
                    <div className="fs-6 mb-1 fw-normal points-text">
                      Total Points Redeemed
                    </div>
                    <div className="h5 mb-0">
                      {allPoints?.total_redeemed_points
                        ? allPoints.total_redeemed_points
                        : 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {methodType === "ach" && (
          // <div className="border rounded p-2 h-100 d-flex align-items-center">
          <Col className="border rounded p-2" md="7">
            <h4 className="text-dark">Payment details:</h4>
            <div className="mt-2">
              <Row className="mb-3 ">
                <Col md="7">
                  <span className="form-label">Name on account: </span>
                  <div className="text-right text-dark">
                    {achData && achData.nameOnAccount}
                  </div>
                </Col>
                <Col md="5">
                  <span className="form-label">Account type: </span>
                  <div className="text-right text-dark">
                    {achData && achData.accountType}
                  </div>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md="7">
                  <span className="form-label">Acoount Number: </span>
                  <div className="text-right text-dark">
                    {`*****${achData && achData.accountNumber.slice(-4)}`}
                  </div>
                </Col>
                <Col md="5">
                  <span className="form-label">Routing number: </span>
                  <div className="text-right text-dark">
                    {achData && achData.routingNumber}
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
          // </div>
        )}
        {/* Title section */}
        <div className="d-flex justify-content-between align-items-center mb-4 gap-2 mt-4">
          <h3 className="mb-0 text-dark f-w-500 ff-sora fs-5">
            {activeView == "earnedPoints" ? `Points Earned` : `Points Redeemed`}
          </h3>
          <div className="d-flex justify-content-between align-items-center bg-white rounded-3 shadow overflow-hidden ms-auto">
            <button
              onClick={() => setActiveView("earnedPoints")}
              className={`p-2 px-3 flex-fill ff-sora bg-${
                activeView == "earnedPoints" ? "primary" : "transparent"
              } border-0`}
            >
              Points Earned
            </button>
            <button
              onClick={() => setActiveView("pointsRedeemed")}
              className={`p-2 px-3 flex-fill ff-sora bg-${
                activeView == "pointsRedeemed" ? "primary" : "transparent"
              } border-0`}
            >
              Points Redeemed
            </button>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <PlaidLinkButton
              buttonText="Change Account"
              userID={userId as string}
              onSuccess={plaidSuccess}
              cssClasses="btn btn-dark ff-sora-regular"
            />
          </div>
        </div>
        {/* Earned Points table */}
        {activeView == "earnedPoints" && (
          <div className="reward-points-earned-points mt-4">
            <Card className="overflow-hidden">
              <div className="table-responsive">
                <table className="table">
                  <thead className="ff-sora table-color">
                    <tr>
                      <th>Date</th>
                      {/* <th style={{ width: "125px" }}>Transaction ID</th> */}
                      <th>Account Details</th>
                      <th className="">Paid To</th>
                      <th style={{ width: "165px" }}>Payment Channel</th>
                      <th className="text-end">Amount Paid</th>
                      <th className="text-end">Points Earned</th>
                    </tr>
                  </thead>
                  <tbody className="ff-sora">
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
                                ref?.authorized_date ||
                                  ref?.date ||
                                  data?.created_at ||
                                  ""
                              )}
                            </td>
                            <td>
                              {ref &&
                              ref.account_data &&
                              ref.account_data.official_name &&
                              ref.account_data.mask &&
                              ref.account_data.name
                                ? `${
                                    ref.account_data.official_name.split(" ")[0]
                                  } xx${ref.account_data.mask.slice(-4)} ${
                                    ref.account_data.name
                                  }`
                                : ""}
                            </td>
                            <td className="">
                              {ref?.merchant_name || ref?.name || ""}
                            </td>
                            <td className="text-start">
                              {/* {ref.payment_channel} */}
                              {/* {ref?.payment_channel
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ") || ''} */}
                              {(ref?.payment_channel &&
                              typeof ref.payment_channel === "string"
                                ? ref.payment_channel
                                    .split(" ")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")
                                : "") || ""}
                            </td>
                            <td className="text-end">
                              {priceFormat(ref?.amount || 0)}
                            </td>
                            <td className="text-end">
                              {data?.points ? data?.points : ""}
                            </td>
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
        {activeView == "pointsRedeemed" && (
          <div className="reward-points-redeemed mt-4">
            <Card className="overflow-hidden">
              <div className="table-responsive">
                <table className="table">
                  <thead className="ff-sora table-color">
                    <tr>
                      <th style={{ width: "150px" }}>Date</th>
                      <th
                        className={`${
                          transactionData.length <= 0 ? "text-center" : ""
                        }`}
                      >
                        Description
                      </th>
                      <th className="text-end" style={{ width: "100px" }}>
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="ff-sora">
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
        <div className="flex-fill">
          {!loading && transactionData.length > 0 && (
            <div className="d-flex align-items-center gap-2 pagination-mobile">
              <div className="d-flex align-items-center gap-1 text-sm">
                <span>Results per page</span>
                <Dropdown
                  size="sm"
                  isOpen={perPageDropdownOpen}
                  toggle={togglePerPageDropdown}
                  className="text-dark"
                >
                  <DropdownToggle
                    className="px-2 py-1 text-dark bg-white"
                    color="white"
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
              {/* <div className="pagination-mobile-row">
                {PaginationInfo({
                  currentPage,
                  limit: perPage,
                  totalRecords,
                })}
              </div>
              <div className="ms-auto pagination-controls">
                <UserPaginationComponent
                  totalRecords={totalRecords}
                  perPage={perPage}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div> */}
              <div className="pagination-mobile-row">
                {PaginationInfo({
                  currentPage,
                  limit: perPage,
                  totalRecords,
                })}
              </div>
              <div className="ms-auto pagination-controls">
                <UserPaginationComponent
                  totalRecords={totalRecords}
                  perPage={perPage}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </div>
        {/* Redeem Model */}
        <Modal className="rbp-user-portal" isOpen={modal} toggle={toggleModel}>
          <ModalHeader toggle={toggleModel}>Redeem Points</ModalHeader>
          <ModalBody className="">
            <p>Enter the number of points you want to redeem.</p>
            <label htmlFor="pointsInput">
              Points<span className="text-danger">*</span>
            </label>
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
                  You will receive a{" "}
                  <b>{priceFormat((redeemPointsAmount ?? 0) / points)}</b> reward via{" "}
                  <a
                    href="https://www.tremendous.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark crumb-link"
                  >
                    tremendous.com
                  </a>
                  , which will be sent to your{" "}
                  <b>{userData && userData?.user_email}</b> email address.
                </p>
              )}
            {(redeemPointsAmount ?? 0) > availablePoints && (
              <div className="text-danger m-0">
                Please enter value less than{" "}
                {availablePoints && availablePoints + 1}
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
              {/* Redeem Points */}
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
    <p className="m-0 text-dark">
      <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{totalRecords}</span>
    </p>
  );
};

export default userRewardPointsPage;
