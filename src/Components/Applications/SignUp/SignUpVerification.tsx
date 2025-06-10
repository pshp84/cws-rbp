"use client";

interface SignUpVerification {
    backBtnAction: (previousStep: string) => void;
    resendBtnAction: () => void;
}

const SignUpVerification: React.FC<SignUpVerification> = (props) => {

    const { backBtnAction, resendBtnAction } = props

    return <div className="signup-verification-step h-100 position-relative">
        <h3 className="mb-5 f-w-500">Almost there! Please verify your email to secure your account <br />and continue your journey with us.</h3>

        <div className="check-email-notifications d-flex align-items-center gap-3 mb-4">
            <div className="email-icon d-flex justify-content-center align-items-center rounded-circle">
                <i className="fa fa-envelope-o"></i>
            </div>
            <div>
                <h4 className="mb-2 text-dark">Check your email</h4>
                <p className="m-0">open mail app to verify</p>
            </div>
        </div>

        <div className="mb-5">
            <p><small>Didn't receive the email? <button onClick={resendBtnAction} className="bg-transparent border-0 p-0 text-primary">Click to resend</button></small></p>
        </div>

        <div className="signup-action-bar w-100 d-flex justify-content-between align-items-center">
            <button className="btn btn-light" disabled>Back</button>
            <button type="submit" className="btn btn-primary" disabled>Proceed</button>
        </div>

    </div>;
}

export default SignUpVerification;