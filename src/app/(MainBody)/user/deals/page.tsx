"use client";
import DealContainer from "@/Components/Applications/Deal";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const UserDeals = () => {
  return (
    <>
      <DealContainer />
    </>
  );
};

export default withAuth(UserDeals);
