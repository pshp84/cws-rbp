"use client";
import {
  getLeaseInfo,
  getUserMeta,
} from "@/DbClient";
import React, { useEffect, useState } from "react";
import {
  Container,
  Spinner,
} from "reactstrap";
import ActionsProgress from "@/Components/Applications/ProgressBar/ActionsProgress";
import DealsList from "@/Components/Applications/Deal/DealsList";

const userDealsPage = () => {
  const userId = localStorage.getItem("userId");
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
      <div className="user-deals-page py-4">
        <Container fluid className="product-wrapper">
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

          <DealsList
            title="Marketplace Offers"
            subTitle="We Know What's Best for You – Handpicked Just for You!"
            userId={userId || undefined}
          />

        </Container>
      </div>
    </>
  );
};

export default userDealsPage;
