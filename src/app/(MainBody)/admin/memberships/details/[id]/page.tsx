"use client";

import ViewMembershipDetails from "@/Components/Applications/Ecommerce/MembershipDetailsList/ViewDetails";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const MembershipDetails = () => {
  return <ViewMembershipDetails />;
};

export default withAuth(MembershipDetails);
