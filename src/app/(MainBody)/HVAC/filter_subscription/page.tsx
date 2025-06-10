"use client";

//import HvacSubscriptionContainer from "@/Components/Applications/HVAC/HvacSubscription/HvacSubscriptionContainer";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const HVACFilterSubscription = () => {
  return (
    <div>
      {/* <HvacSubscriptionContainer /> */}
      HVAC Filter subscription page
    </div>
  );
};

export default withAuth(HVACFilterSubscription);
