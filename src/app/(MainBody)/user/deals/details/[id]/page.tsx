"use client";

import ProductPageContainer from "@/Components/Applications/Ecommerce/ProductPage";
import withAuth from "@/Components/WithAuth/WithAuth";
import { useParams } from "next/navigation";
import React from "react";

const DealDetailsContainer = () => {
  const { id } = useParams();
  const dealId = Number(id);
  return (
    <>
      {/* <Link href={`/user/deals`}>Back to deals</Link> */}
      <ProductPageContainer dealId={dealId}/>
    </>
  );
};

export default withAuth(DealDetailsContainer);
