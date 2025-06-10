"use client";

import PropertyManagerHeader from "@/Layout/Header/PropertyManager";
import UserPortalFooter from "@/Layout/Footer/UserPortal";
import { Suspense } from "react";
import Loading from "@/app/(UserPortal)/loading";


const PropertyManagerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ backgroundColor: "white" }} className="rbp-user-portal rbp-property-manager-portal min-vh-100 position-relative">
      <PropertyManagerHeader />
      <div className="bg-white">
        <section className="container py-4 min-vh-50">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </section>
      </div>
      <UserPortalFooter />
    </div>
  );
};

export default PropertyManagerLayout;
