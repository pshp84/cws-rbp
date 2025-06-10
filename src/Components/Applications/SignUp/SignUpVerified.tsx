"use client";

interface SignUpVerification {
    proceedBtnAction: () => void;
}

const SignUpVerified: React.FC<SignUpVerification> = (props) => {

    const { proceedBtnAction } = props

    return <div className="signup-verification-step h-100 position-relative">
        <h3 className="mb-5 f-w-500">Your email has been successfully verified! You're all set to continue your journey with us.</h3>

        <div className="check-email-notifications d-flex align-items-center gap-3 mb-5">
            <div className="email-icon d-flex justify-content-center align-items-center rounded-circle">
                <i className="fa fa-envelope-o"></i>
            </div>
            <div>
                <h4 className="mb-2 text-dark">Verified</h4>
            </div>
        </div>

        <div className="signup-action-bar w-100 d-flex justify-content-end align-items-center">
            <button type="submit" className="btn btn-primary" onClick={proceedBtnAction}>Proceed</button>
        </div>

    </div>;
}

export default SignUpVerified;