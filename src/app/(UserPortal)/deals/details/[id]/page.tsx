"use client";
import {
  getLeaseInfo,
  getUserMeta,
} from "@/DbClient";
import { DealData } from "@/Types/Deals";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Breadcrumb, BreadcrumbItem } from "reactstrap";
import ActionsProgress from "@/Components/Applications/ProgressBar/ActionsProgress";
import DealDetails from "@/Components/Applications/Deal/DealDetails";

const DealDetailsPage = () => {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const [deal, setDeal] = useState<DealData>();
  const [actionData, setActionData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchUserMeta = async () => {
    try {
      const result = await getUserMeta(userId as string, "plaid_access_token");
      if (result && result[0]) {
        setToken(result[0].meta_value);
      } else {
        setToken(null);
      }
    } catch (error) { }
  };

  const fetchPendingActions = async () => {
    try {
      const result = await getLeaseInfo(userId as string);
      if (result) {
        setActionData(result);
      } else {
        setActionData(null);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchPendingActions();
    fetchUserMeta();
  }, []);

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
      <div className="user-deals-details-page">
        <Breadcrumb className="text-sm">
          <BreadcrumbItem className="text-secondary">
            <Link
              className="text-secondary breadcrumb-font crumb-link"
              href="/"
            >
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem className="text-secondary">
            <Link
              className="text-secondary breadcrumb-font crumb-link"
              href="/deals"
            >
              Deals
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem className="text-dark breadcrumb-font" active>
            {deal ? deal.name : ""}
          </BreadcrumbItem>
        </Breadcrumb>
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
        <DealDetails
          dealId={Number(id)}
          userId={userId || undefined}
          dealDetails={setDeal}
        />
      </div>
    </>
  );
};

export default DealDetailsPage;
