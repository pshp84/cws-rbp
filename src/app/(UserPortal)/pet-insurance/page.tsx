"use client";

import ActionsProgress from "@/Components/Applications/ProgressBar/ActionsProgress";
import { getLeaseInfo, getUserMeta } from "@/DbClient";
import { useState, useEffect } from "react";
import { Spinner } from "reactstrap";

const petInsurancePage = () => {
  const userId = localStorage.getItem("userId");
  const [actionData, setActionData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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

  const fetchPendingActions = async () => {
    setLoading(true);
    try {
      const result = await getLeaseInfo(userId as string);
      if (result) {
        setActionData(result);
        setLoading(false);
      } else {
        setActionData(null);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingActions();
    fetchUserMeta();
  }, []);

  if (loading) {
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
      <div className="pet-insurance-page py-4">
        <h3 className="mb-3 text-dark f-w-500 details">Pet Insurance</h3>
        <p className="mb-2">
          Protect your furry friends with the best pet insurance—
          <b>launching soon!</b>
        </p>
        <p className="mb-0">
          Stay tuned for more details about our exciting new pet insurance
          plans.
        </p>
      </div>
    </>
  );
};

export default petInsurancePage;
