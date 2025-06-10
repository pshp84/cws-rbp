
interface SignUpSteps {
    activeStep?: string;
    selectedPlan?: number;
}

const SignUpSteps: React.FC<SignUpSteps> = (props) => {
    const { activeStep = "plan", selectedPlan } = props;
    return <div className="notification mt-5">
        <div className="dark-timeline">
            <ul className="simple-list">
                {(selectedPlan != 4) &&
                    <li className="d-flex">
                        <div className={(activeStep == "plan" ? `activity-dot-primary` : `activity-dot-secondary`)}></div>
                        <div className={`w-100 ms-4 py-3 px-4 rounded-3 sm-ms ${(activeStep == "plan") && `bg-light text-dark`}`}>
                            <h5 className={`f-w-500 mb-2 ${(activeStep == "plan") && `text-primary`}`}>Select Plan</h5>
                            <p>Choose the plan that best suits your needs and unlock exclusive perks.</p>
                        </div>
                    </li>
                }

                <li className="d-flex">
                    <div className={(activeStep == "enrollment" ? `activity-dot-primary` : `activity-dot-secondary`)}></div>
                    <div className={`w-100 ms-4 py-3 px-4 rounded-3 sm-ms ${(activeStep == "enrollment") && `bg-light text-dark`}`}>
                        <h5 className={`f-w-500 mb-2 ${(activeStep == "enrollment") && `text-primary`}`}>Enrollment</h5>
                        <p>Fill in your details to create your account and start your journey.</p>
                    </div>
                </li>
                <li className="d-flex">
                    <div className={((activeStep == "verification" || activeStep == "verified") ? `activity-dot-primary` : `activity-dot-secondary`)}></div>
                    <div className={`w-100 ms-4 py-3 px-4 rounded-3 sm-ms ${(activeStep == "verification" || activeStep == "verified") && `bg-light text-dark`}`}>
                        <h5 className={`f-w-500 mb-2 ${(activeStep == "verification" || activeStep == "verified") && `text-primary`}`}>Verification</h5>
                        <p>Securely verify your identity to ensure safe access to all benefits.
                        </p>
                    </div>
                </li>
                {/* {(selectedPlan != 4) &&
                    <li className="d-flex">
                        <div className={(activeStep == "payment" ? `activity-dot-primary` : `activity-dot-secondary`)}></div>
                        <div className={`w-100 ms-4 py-3 px-4 rounded-3 sm-ms ${(activeStep == "payment") && `bg-light text-dark`}`}>
                            <h5 className={`f-w-500 mb-2 ${(activeStep == "payment") && `text-primary`}`}>Payment</h5>
                            <p>Complete your subscription and begin enjoying your RBP Club membership!</p>
                        </div>
                    </li>
                } */}
            </ul>
        </div>
    </div>;
}

export default SignUpSteps;