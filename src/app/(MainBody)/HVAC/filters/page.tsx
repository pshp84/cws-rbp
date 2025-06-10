"use client";
import React from "react";
import withAuth from "@/Components/WithAuth/WithAuth";
import HvacSubscriptionContainer from "@/Components/Applications/HVAC/HvacSubscription/HvacSubscriptionContainer";

const HVACFilters = () => {
  return <HvacSubscriptionContainer />;
};

export default withAuth(HVACFilters);
