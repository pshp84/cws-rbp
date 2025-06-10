import { Loading } from "@/Constant";
import UserPortalFooter from "@/Layout/Footer/UserPortal";
import UserPortalHeader from "@/Layout/Header/UserPortal";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

const AmazonDealsLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div style={{ backgroundColor: "white" }} className="rbp-user-portal min-vh-100 position-relative">
            <UserPortalHeader />
            <div className="bg-white">
                <section className="container py-4 min-vh-50">
                    <Suspense fallback={<Loading />}>{children}</Suspense>
                </section>
            </div>
            <UserPortalFooter />
        </div>
    );
}

export default AmazonDealsLayout;