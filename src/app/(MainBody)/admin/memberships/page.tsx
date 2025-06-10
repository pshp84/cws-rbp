"use client";

import MembershipDetailsListContainer from "@/Components/Applications/Ecommerce/MembershipDetailsList";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const AdminMembershipPage = () => {
  return <MembershipDetailsListContainer />;
};

export default withAuth(AdminMembershipPage);
