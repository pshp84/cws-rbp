"use client";
import { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbItem } from "reactstrap";
import ProfileSteps from "@/Components/Applications/Profile/profileSteps";
import UserDetails from "@/Components/Applications/Profile/UserDetails";
import ChangePassword from "@/Components/Applications/Profile/ChangePassword";
import UserMembership from "@/Components/Applications/Profile/membership";
import UpdatePaymentMethod from "@/Components/Applications/Profile/UpdatePaymentMethod";
import Link from "next/link";
import UserRent from "@/Components/Applications/Profile/UserRent";
import UserLeaseDocument from "@/Components/Applications/Profile/UserLeaseDocument";
import { useSearchParams } from "next/navigation";
import ActionsProgress from "@/Components/Applications/ProgressBar/ActionsProgress";
import { getLeaseInfo, getUserMeta } from "@/DbClient";

const userProfilePage = () => {
  const userId = localStorage.getItem("userId");
  const searchParams = useSearchParams();
  const search = searchParams.get("tab");
  const defaultTab = search ? search : "userDetails";
  const [activeStep, setActiveStep] = useState<string>(defaultTab);
  const [actionData, setActionData] = useState<any>(null);
  const [methodType, setMethodType] = useState<string | null>(null);

    const fetchUserMeta = async () => {
      try {
        const result1 = await getUserMeta(
          userId as string,
          "plaid_access_token"
        );
        if (result1 && result1[0]) {
          setMethodType(result1[0].meta_value);
        } else {
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

  useEffect(() => {
    fetchPendingActions();
    fetchUserMeta();
  }, []);

  const handleActionComplete = () => {
    fetchPendingActions();
  };

  const pendingActionsCount = () => {
    if (!actionData) return !methodType  ? 4 : 3;
    const pendingActions = [
      !actionData.lease_document?.trim(),
      !actionData.rent_amount,
      !actionData.rent_date?.trim(),
    ].filter(Boolean);

    const additionalCount = !methodType ? 1 : 0;

    return pendingActions.length + additionalCount;
  };

  const pendingCount = pendingActionsCount();

  return (
    <div className="user-profile-page">
      {pendingCount !== 0 && (
        <ActionsProgress   progressWidth={
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
        }/>
      )}

      <Breadcrumb className="text-sm">
        <BreadcrumbItem className="text-secondary">
          <Link className="text-secondary breadcrumb-font crumb-link" href="/">
            Home
          </Link>
        </BreadcrumbItem>
        <BreadcrumbItem className="text-dark breadcrumb-font" active>
          User Profile
        </BreadcrumbItem>
      </Breadcrumb>
      {/* <Card className="m-0">
            <CardBody> */}
      <div className="row gx-5">
        <div className="col-md-3">
          <ProfileSteps
            activeStep={activeStep}
            tabClick={setActiveStep}
          ></ProfileSteps>
        </div>
        <div className="col-md-9 mb-5">
          {activeStep == "userDetails" && <UserDetails></UserDetails>}
          {activeStep == "changePassword" && <ChangePassword></ChangePassword>}
          {activeStep == "membership" && <UserMembership></UserMembership>}
          {activeStep == "updatePaymentMethod" && (
            <UpdatePaymentMethod />
          )}
          {activeStep == "rent" && (
            <UserRent onComplete={handleActionComplete} />
          )}
          {activeStep === "leaseDocument" && (
            <UserLeaseDocument onComplete={handleActionComplete} />
          )}
        </div>
      </div>
      {/* </CardBody>
        </Card> */}
    </div>
  );
};

export default userProfilePage;
