interface ProfileStepsInterface {
    activeStep?: string,
    tabClick: (tab: string) => void,
    tabs?: Array<"userDetails" | "changePassword" | "membership" | "updatePaymentMethod" | "rent" | "leaseDocument">
}

const ProfileSteps: React.FC<ProfileStepsInterface> = (props) => {
    const { activeStep, tabClick, tabs = ["userDetails", "changePassword", "membership", "updatePaymentMethod", "rent", "leaseDocument"] } = props;
    return <div className="h-100">
        <div className="steps-list bg-light rounded-3 py-3 px-3 h-100">
            <ul className="simple-list">
                {tabs.includes("userDetails") &&
                    <li className="d-flex pointer" onClick={() => tabClick("userDetails")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "userDetails") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "userDetails" ? `text-white` : 'text-dark'}`}>User Details</span>
                        </div>
                    </li>
                }

                {tabs.includes("changePassword") &&
                    <li className="d-flex pointer" onClick={() => tabClick("changePassword")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "changePassword") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "changePassword" ? `text-white` : 'text-dark'}`}>Change Password</span>
                        </div>
                    </li>
                }

                {tabs.includes("membership") &&
                    <li className="d-flex pointer" onClick={() => tabClick("membership")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "membership") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "membership" ? `text-white` : 'text-dark'}`}>Membership</span>
                        </div>
                    </li>
                }

                {tabs.includes("updatePaymentMethod") &&
                    <li className="d-flex pointer" onClick={() => tabClick("updatePaymentMethod")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "updatePaymentMethod") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "updatePaymentMethod" ? `text-white` : 'text-dark'}`}>Update Payment Method</span>
                        </div>
                    </li>
                }

                {tabs.includes("rent") &&
                    <li className="d-flex pointer" onClick={() => tabClick("rent")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "rent") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "rent" ? `text-white` : 'text-dark'}`}>Rent</span>
                        </div>
                    </li>
                }

                {tabs.includes("leaseDocument") &&
                    <li className="d-flex pointer" onClick={() => tabClick("leaseDocument")}>
                        <div className={`w-100 py-3 px-4 rounded-3 ${(activeStep == "leaseDocument") && `bg-primary`}`}>
                            <span className={`ff-sora-regular ${activeStep == "leaseDocument" ? `text-white` : 'text-dark'}`}>Lease Document</span>
                        </div>
                    </li>
                }
            </ul>
        </div>
    </div>;
}

export default ProfileSteps;