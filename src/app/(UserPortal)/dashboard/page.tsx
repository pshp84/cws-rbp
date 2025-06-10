"use client";
import React, { useEffect, useState } from "react";
import PointsImg from "../../../../public/assets/images/home/Points.png";
import TotalPoints from "../../../../public/assets/images/home/Total_Points.png";
import PlaidLogo from "../../../../public/assets/images/plaid/plaid-logo-blue.svg";
import RedeemPoints from "../../../../public/assets/images/home/Redeem_points.png";
// import Pattern from "../../../../public/assets/images/home/Pattern1.png";
// import RightContent from "../../../../public/assets/images/home/Right-Content.png";
import Rent from "../../../../public/assets/images/home/Rent.png";
import RentDay from "../../../../public/assets/images/home/RentDay.png";
import LeaseDoc from "../../../../public/assets/images/home/LeaseDoc.png";
import DefaultImg from "../../../../public/assets/images/home/defaultImg.jpg";
import { Carousel } from "react-bootstrap";
import { useRouter } from "next/navigation";
import {
  addDealReport,
  getDeals,
  getDealsBanner,
  getLeaseInfo,
  getPointsData,
  getUserById,
  getUserMeta,
  ReportType,
  updateUserMeta,
} from "@/DbClient";
import { Points } from "@/Types/Rewards";
import { DealData } from "@/Types/Deals";
import { toast } from "react-toastify";
import { Spinner } from "reactstrap";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";

const userDashboardPage = () => {
  const router = useRouter();
  const userId = localStorage.getItem("userId");
  const [allPoints, setAllPoints] = useState<Points>();
  const [user, setUser] = useState<any>();
  const [deals, setDeals] = useState<DealData[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<DealData[]>([]);
  const [actionData, setActionData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string | null>(null);
  const [plaidData, setPlaidData] = useState<any>();
  const [token, setToken] = useState<string | null>(null);
  const [sliderData, setSliderData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserMeta = async () => {
    try {
      const result = await getUserMeta(userId as string, "plaid_access_token");
      if (result && result[0]) {
        setToken(result[0].meta_value);
      } else {
        setToken(null);
      }
    } catch (error) {}
  };

  const plaidSuccess = async (accessToken: string) => {
    if (accessToken) {
      setPlaidAccessToken(accessToken);
      const authResponse = await rbpApiCall.post("/plaid/auth", {
        access_token: accessToken,
      });

      if (authResponse.data.ach_data) {
        // console.log("ACH Bank Details", authResponse.data.ach_data);
        const firstAchData = authResponse.data.ach_data[0];
        setPlaidData(firstAchData);
      }
    }
  };

  const plaidError = (error: any, metadata: any) => {
    console.log("Plaid Error", error);
    if (error) {
      toast.error(
        error.display_message ? error.display_message : "Something went wrong"
      );
    }
  };

  const updatePlaidAccessTokenToUser = async () => {
    if (plaidAccessToken !== null) {
      await updateUserMeta(
        userId as string,
        "plaid_access_token",
        plaidAccessToken
      );
      fetchUserMeta();
    }
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

  const filterValidDeals = (deals: DealData[]): DealData[] => {
    const currentDate = new Date();
    const today = new Date(currentDate.toISOString().split("T")[0]);
    return deals.filter((deal) => {
      const dealEndDate = deal.end_date ? new Date(deal.end_date) : null;
      return deal.end_date === null || (dealEndDate && dealEndDate >= today);
    });
  };

  const fetchUserPoints = async () => {
    try {
      const points = await getPointsData(userId as string);
      setAllPoints(points);
    } catch (error) {}
  };

  const fetchUserDetails = async () => {
    try {
      const details = await getUserById(userId as string);
      setUser(details);
    } catch (error) {}
  };

  const fetchUserDeals = async () => {
    setLoading(true);
    try {
      const result = await getDeals({ limit: -1, isFeatured: false });
      const featureDeals = await getDeals({ limit: -1, isFeatured: true });
      if (result && result.data && featureDeals && featureDeals.data) {
        const validDeals = filterValidDeals(result.data);
        const validFeatureDeals = filterValidDeals(featureDeals.data);
        setDeals(validDeals);
        setFeaturedDeals(validFeatureDeals);
        setLoading(false);
      } else {
        toast.error("Something went wrong");
        setLoading(false);
      }
    } catch (error) {}
  };

  const fetchSliderContent = async () => {
    setIsLoading(true);
    try {
      const result = await getDealsBanner();
      console.log("result", result);
      if (result) {
        setSliderData(result);
        setIsLoading(false);
      } else {
        setSliderData([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong.");
      setIsLoading(false);
    }
  };

  const viewDeal = async (id: number) => {
    try {
      await addDealReport({
        dealID: id,
        userID: userId as string,
        reportType: "view" as ReportType.View,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchUserDetails();
    fetchUserDeals();
    fetchUserMeta();
    fetchSliderContent();
  }, []);

  useEffect(() => {
    fetchPendingActions();
  }, []);

  useEffect(() => {
    updatePlaidAccessTokenToUser();
  }, [plaidAccessToken]);

  // useEffect(() => {
  //   const updatePaymentMethod = async () => {
  //     try {
  //       if (plaidData) {
  //         const achData: AchPaymentMethodData = {
  //           nameOnAccount: plaidData.name,
  //           accountNumber: plaidData.account_number,
  //           accountType: plaidData.account_type,
  //           routingNumber: plaidData.routing_number,
  //         };
  //         const customerData: paymentMethodDataInterface = {
  //           paymentMethodType: "ach" as BanquestPaymentMethodTypes,
  //           achData: achData,
  //         };

  //         const result: boolean = await updateUserPaymentMethod(
  //           userId as string,
  //           customerData
  //         );
  //         if (result) {
  //           fetchUserMeta();
  //         }
  //       }
  //     } catch (err) {
  //       console.error("Error updating payment method", err);
  //     }
  //   };

  //   updatePaymentMethod();
  // }, [plaidData, userId]);

  if (loading || isLoading) {
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
      <div className="user-dashboard-page">
        <div className="">
          {/* pending actions layout */}
          {pendingCount !== 0 && (
            <div className="mb-3">
              <div className="text-dark ff-sora-medium">Pending Actions</div>
              <div className="d-flex align-items-center">
                <div className="text-secondary ff-sora-light">
                  Complete these actions to fully setup your account
                </div>

                <div className="ms-auto">
                  <div className="badge me-1 text-black text-center justify-center remaining-badge">
                    {`${pendingCount} remaining`}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* boxes */}
          {pendingCount !== 0 && (
            <div className="">
              <div className="row g-2 mb-4">
                {/* Box 1 */}
                {!actionData ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={Rent.src}
                        alt="RentImg"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div className="mb-1 ff-sora-medium text-dark">
                          Add Rent Amount
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Specify the monthly rent amount for the property,
                            ensuring accuracy for payment records.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=rent")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !actionData.rent_amount ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={Rent.src}
                        alt="RentImg"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div className="mb-1 ff-sora-medium text-dark">
                          Add Rent Amount
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Specify the monthly rent amount for the property,
                            ensuring accuracy for payment records.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=rent")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}
                {/* Box 2 */}
                {!actionData ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={RentDay.src}
                        alt="RentDay"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div
                          style={{ color: "#797979" }}
                          className="mb-1 ff-sora-medium text-dark"
                        >
                          Select Rent Day
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Choose the specific day of the month when the rent
                            payment is due.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=rent")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !actionData.rent_date?.trim() ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={RentDay.src}
                        alt="RentDay"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div
                          style={{ color: "#797979" }}
                          className="mb-1 ff-sora-medium text-dark"
                        >
                          Select Rent Day
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Choose the specific day of the month when rent
                            payments are due.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=rent")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}
                {/* Box 3 */}
                {!actionData ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={LeaseDoc.src}
                        alt="LeaseDoc"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div
                          style={{ color: "#797979" }}
                          className="mb-1 ff-sora-medium text-dark"
                        >
                          Upload Lease Document
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Upload the signed lease document to maintain an
                            official record for the agreement.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=leaseDocument")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : !actionData.lease_document?.trim() ? (
                  <div
                    className={`${token ? "col-md-4" : "col-md-6"} col-12 mb-4`}
                  >
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={LeaseDoc.src}
                        alt="LeaseDoc"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div
                          style={{ color: "#797979" }}
                          className="mb-1 ff-sora-medium text-dark"
                        >
                          Upload Lease Document
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className={`${
                              !token
                                ? "pending-action-plaid"
                                : "pending-actions"
                            } ff-sora-light mb-0 me-2`}
                          >
                            Upload the signed lease document to maintain an
                            official record for the agreement.
                          </span>
                          <button
                            onClick={() =>
                              router.push("/user_profile?tab=leaseDocument")
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Add Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}

                {/* Box 4 */}
                {!token && (
                  <div className="col-12 col-md-6 mb-4">
                    <div className="border rounded p-2 d-flex align-items-center h-100">
                      <img
                        src={PlaidLogo.src}
                        alt="RentImg"
                        className="me-3"
                        width="21"
                        height="21"
                      />
                      <div>
                        <div className="mb-1 ff-sora-medium text-dark">
                          Add Plaid Account
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            style={{ flexBasis: "66%" }}
                            className="ff-sora-light mb-0 me-2 pending-action-plaid"
                          >
                            Link your Plaid account to enable seamless rent
                            payment tracking and reconciliation.
                          </span>
                          <PlaidLinkButton
                            userID={userId as string}
                            cssClasses="btn btn-dark ff-sora-regular"
                            buttonText={"Connect to plaid"}
                            onSuccess={plaidSuccess}
                            onError={plaidError}
                            isLoading={setLoadingStatus}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* points */}
          <div className="row mb-4">
            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
              <h2 className="h4 mb-2">{`Welcome Back, ${
                user ? user.first_name : ""
              }!`}</h2>
              <p className="mb-0 font-normal text-base ">
                New deals added while you have been away.
              </p>
            </div>

            <div className="col-12 col-lg-8">
              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <div className="border rounded p-2 h-100 d-flex align-items-center">
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
                        <button
                          onClick={() => router.push("/reward-points")}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Redeem
                        </button>
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
                      width="40"
                      height="40"
                    />
                    <div>
                      <div
                        style={{ color: "#797979" }}
                        className="fs-6 mb-1 fw-normal"
                      >
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
                      width="40"
                      height="40"
                    />
                    <div>
                      <div
                        style={{ color: "#797979" }}
                        className="fs-6 mb-1 fw-normal"
                      >
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

          <div className="mt-4">
            <Carousel className="dashboard-slider">
              {sliderData &&
                sliderData.map((el: any, index: any) => (
                   <Carousel.Item key={index}>
                  <div className="carousel-content">
                  <div className="row g-0 flex-column flex-md-row">
                    <div className="col-12 col-md-12 bg-info position-relative">
                      <div className="carousel-image-wrapper">
                        {el.bannerImageURL && (
                          <img
                            // src={Pattern.src}
                            src={el.bannerImageURL}
                            alt="Pattern"
                            className="img-fluid w-100 h-100 object-fit-cover slider-bg"
                          
                          />
                        )}
                        {!el.bannerImageURL && (
                          <div style={{width:"100%",height:"340px",backgroundColor:"rgb(43, 50, 65)"}}></div>
                        )}
                      </div>
                      <div
                        style={{
                          // marginTop: "-10rem",
                          // marginLeft: "3rem",
                        }}
                        className="carousel-text-overlay"
                      >
                        <div className="text-white">
                          <h3 className="display-6 mb-2 text-white">
                            {el.bannerTitle ? el.bannerTitle : ""}
                          </h3>
                          <p className="mb-3">
                            {/* Lorem ipsum is simple a dummy text. */}
                            {el.bannerText ? el.bannerText : ""}
                          </p>
                          {el.bannerButtonLink && (
                            <button
                              onClick={() => {
                                router.push(el.bannerButtonLink);
                              }}
                              className="btn btn-light cursor-pointer"
                            >
                              {/* Explore */}
                              {el.bannerButtonText
                                ? el.bannerButtonText
                                : "Explore"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                   </Carousel.Item>
                ))}
            </Carousel>
          </div>

          {/* Featured deals */}
          <div className="mt-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
              <div>
                <h3 className="h5 mb-1">Featured Marketplace Offers</h3>
                <p className="mb-0 font-normal text-base">
                  We Know What's Best for You – Handpicked Just for You!
                </p>
              </div>
              <button
                onClick={() => router.push("/deals")}
                className="all-font btn btn-outline-secondary mt-2 mt-md-0 dashboard-badge"
              >
                See All
              </button>
            </div>

            {featuredDeals.length === 0 && (
              <div className="col-12">
                <div
                  style={{
                    borderColor: "#cfe2ff",
                    backgroundColor: "#cfe2ff",
                    color: "black",
                  }}
                  className="alert alert-primary"
                  role="alert"
                >
                  No featured deals are available.
                </div>
              </div>
            )}
            {/* featured Deals list */}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 gy-3 gx-3 mobile-row">
              {featuredDeals.map((el, index) => (
                <div key={index} className="col mb-3">
                  <div className="h-100 d-flex flex-column">
                    <div className="position-relative mb-2 mx-auto">
                      {el && el.dealImageURL && (
                        <img
                          src={el.dealImageURL}
                          alt={el.name}
                          className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
                          style={{
                            width: "100%",
                            height: "154px",
                            objectFit: "cover",
                          }}
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                        />
                      )}
                      {!el.dealImageURL && (
                        <img
                          src={DefaultImg.src}
                          alt={"product"}
                          className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
                          style={{
                            width: "100%",
                            height: "154px",
                            objectFit: "cover",
                          }}
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                        />
                      )}

                      <div className="position-absolute top-0 start-0 m-2">
                        {el &&
                          el.categories.map((category, index) => (
                            <span
                              key={index}
                              style={{ backgroundColor: "#D1FD64" }}
                              className="badge text-black text-center justify-center ms-1"
                            >
                              {category.name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-grow-1">
                      <h5
                        className="mb-2 fs-6 cursor-pointer"
                        onClick={() => {
                          router.push(`/deals/details/${el.deal_id}`);
                          viewDeal(el.deal_id);
                        }}
                      >
                        {el.name}
                      </h5>
                      <p
                        className="mb-2 cursor-pointer"
                        onClick={() => {
                          router.push(`/deals/details/${el.deal_id}`);
                          viewDeal(el.deal_id);
                        }}
                      >
                        {el.small_description ? el.small_description : ""}
                      </p>
                      <div className="mt-auto">
                        {el.discount_text && (
                          <span className="badge bg-danger mb-2 d-inline-block dashboard-badge">
                            {el.discount_text}
                          </span>
                        )}
                        <div>
                          <span className="me-2 list-color">
                            {el.sale_price ? "$" : ""}
                            {el.sale_price ? el.sale_price : ""}
                          </span>
                          <span
                            color="#565959"
                            className="text-decoration-line-through font-normal"
                          >
                            {el.regular_price ? "$" : ""}
                            {el.regular_price
                              ? el.regular_price.toFixed(2)
                              : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                          className="btn btn-outline-primary mt-2 btn-sm dashboard-badge custom-width"
                        >
                          Explore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* deals list and title */}
          <div className="mt-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
              <div>
                <h3 className="h5 mb-1">Marketplace Deals</h3>
                <p className="mb-0 font-normal text-base ">
                  We Know What's Best for You – Handpicked Just for You!
                </p>
              </div>
              <button
                onClick={() => router.push("/deals")}
                className="all-font btn btn-outline-secondary mt-2 mt-md-0 dashboard-badge"
              >
                See All
              </button>
            </div>
            {deals.length === 0 && (
              <>
                <div className="col-12">
                  <div
                    style={{
                      borderColor: "#cfe2ff",
                      backgroundColor: "#cfe2ff",
                      color: "black",
                    }}
                    className="alert alert-primary"
                    role="alert"
                  >
                    No deals are available.
                  </div>
                </div>
              </>
            )}
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 gy-3 gx-3 mobile-row">
              {deals.map((el, index) => (
                <div key={index} className="col mb-3">
                  <div className="h-100 d-flex flex-column">
                    <div className="position-relative mb-2 mx-auto">
                      {el && el.dealImageURL && (
                        <img
                          src={el.dealImageURL}
                          alt={el.name}
                          className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
                          style={{
                            width: "100%",
                            height: "154px",
                            objectFit: "cover",
                          }}
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                        />
                      )}
                      {!el.dealImageURL && (
                        <img
                          src={DefaultImg.src}
                          alt={"product"}
                          className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
                          style={{
                            width: "100%",
                            height: "154px",
                            objectFit: "cover",
                          }}
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                        />
                      )}

                      <div className="position-absolute top-0 start-0 m-2">
                        {el &&
                          el.categories.map((category, index) => (
                            <span
                              key={index}
                              style={{
                                backgroundColor: "#D1FD64",
                                marginTop: "inherit",
                              }}
                              className="badge text-black text-center justify-center ms-1"
                            >
                              {category.name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-grow-1">
                      <h5
                        className="mb-2 fs-6 cursor-pointer"
                        onClick={() => {
                          router.push(`/deals/details/${el.deal_id}`);
                          viewDeal(el.deal_id);
                        }}
                      >
                        {el.name}
                      </h5>
                      <p
                        className="mb-2 cursor-pointer"
                        onClick={() => {
                          router.push(`/deals/details/${el.deal_id}`);
                          viewDeal(el.deal_id);
                        }}
                      >
                        {el.small_description ? el.small_description : ""}
                      </p>
                      <div className="mt-auto">
                        {el.discount_text && (
                          <span className="badge bg-danger mb-2 d-inline-block dashboard-badge">
                            {el.discount_text}
                          </span>
                        )}
                        <div>
                          <span className="me-2 list-color">
                            {el.sale_price ? "$" : ""}
                            {el.sale_price ? el.sale_price : ""}
                          </span>
                          <span
                            color="#565959"
                            className="text-decoration-line-through font-normal"
                          >
                            {el.regular_price ? "$" : ""}
                            {el.regular_price
                              ? el.regular_price.toFixed(2)
                              : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            router.push(`/deals/details/${el.deal_id}`);
                            viewDeal(el.deal_id);
                          }}
                          className="btn btn-outline-primary mt-2 btn-sm dashboard-badge custom-width"
                        >
                          Explore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default userDashboardPage;
