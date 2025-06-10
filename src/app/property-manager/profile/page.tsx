"use client";

import ChangePassword from "@/Components/Applications/Profile/ChangePassword";
import ProfileSteps from "@/Components/Applications/Profile/profileSteps";
import UserDetails from "@/Components/Applications/Profile/UserDetails";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const PropertyManagerProfile = () => {
    const userId = localStorage.getItem("userId");
    const searchParams = useSearchParams();
    const search = searchParams.get("tab");
    const defaultTab = search ? search : "userDetails";
    const [activeStep, setActiveStep] = useState<string>(defaultTab);

    return <div className="user-profile-page property-manager-profile-page">
        <nav className="text-sm" aria-label="breadcrumb"><ol className="breadcrumb"><li className="text-secondary breadcrumb-item"><a className="" href="/">Home</a></li><li className="text-dark breadcrumb-font active breadcrumb-item" aria-current="page">User Profile</li></ol></nav>

        <div className="row gx-5">
            <div className="col-md-3">
                <ProfileSteps activeStep={activeStep} tabClick={setActiveStep} tabs={["userDetails", "changePassword"]} />
            </div>
            <div className="col-md-9 mb-5">
                {activeStep == "userDetails" && <UserDetails />}
                {activeStep == "changePassword" && <ChangePassword />}
            </div>
        </div>
    </div>
}

export default PropertyManagerProfile;