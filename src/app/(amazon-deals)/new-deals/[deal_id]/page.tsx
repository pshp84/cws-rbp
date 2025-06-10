"use client";

import DealDetails from "@/Components/Applications/Deal/DealDetails";
import Link from "next/link";
import { useParams } from "next/navigation";

const AmazonDealsPage = () => {
  const { deal_id } = useParams();

  return <div className="user-deals-details-page">
    <div className="d-flex justify-content-end mb-3">
      <Link href={`/new-deals`} className="btn btn-outline-primary btn-sm deals-text">Back</Link>
    </div>
    <DealDetails
      dealId={Number(deal_id)}
      dealDetailPath="/new-deals"
      dealsListPath="/new-deals"
    />
  </div>;
}

export default AmazonDealsPage;