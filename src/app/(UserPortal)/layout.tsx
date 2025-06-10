"use client";

import UserPortalFooter from "@/Layout/Footer/UserPortal";
import UserPortalHeader from "@/Layout/Header/UserPortal";
import { Suspense, useEffect } from "react";
import Loading from "@/app/(UserPortal)/loading";
//import Script from "next/script";
//import Clarity from '@microsoft/clarity';

const userLayout = ({ children }: { children: React.ReactNode }) => {
  // const projectId = "pxg1sdb4nu"

  // useEffect(() => {
  //   Clarity.init(projectId);
  // }, [projectId]);

  return (
    <div
      style={{ backgroundColor: "white" }}
      className="rbp-user-portal min-vh-100 position-relative"
    >
      <UserPortalHeader />
      <div className="bg-white">
        <section className="container py-4 min-vh-50">
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </section>
      </div>
      <UserPortalFooter />
    </div>
  );
};

export default userLayout;
