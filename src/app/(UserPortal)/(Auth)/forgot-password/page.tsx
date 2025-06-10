"use client"

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import TurnstileWrapper from "@/CommonComponent/TurnstileWrapper";
import SignInWelcomeText from "@/Components/Applications/SignIn/SignInWelcomeText";
import { dbClient } from "@/DbClient";
import { validateEmail } from "@/Helper/commonHelpers";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import Head from "next/head";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody } from "reactstrap";

interface ForgotPasswordValidation {
    email: boolean | undefined
}

const userForgotPasswordPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const erroMessageURL = searchParams.get('error-message');

    const [turnstileKey, setTurnstileKey] = useState(0);
    const [turnstileToken, setTurnstileToken] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [validation, setValidation] = useState<ForgotPasswordValidation>();

    const resetTurnstile = () => {
        setTurnstileKey((prevKey) => prevKey + 1);
    };

    const handleForgotPassword = async () => {
        if (!turnstileToken) {
            toast.error('Please complete the CAPTCHA.');
            return;
        }

        let isError = false;
        let validationData: ForgotPasswordValidation = {
            email: true
        }

        setValidation(validationData);

        if (!email) {
            isError = true;
            validationData = { ...validationData, email: false };
        } else if (!validateEmail(email)) {
            isError = true;
            validationData = { ...validationData, email: false };
        }

        if (isError) {
            setValidation(validationData);
            return;
        }

        setIsLoading(true);

        try {
            const verifyTurnstile = await rbpApiCall.post('/verify-turnstile', { turnstileToken });
            if (!verifyTurnstile.data.success) {
                resetTurnstile();
                toast.error('CAPTCHA verification failed. Please try again.');
                setIsLoading(false);
                return;
            }
        } catch (error) {
            resetTurnstile();
            toast.error('CAPTCHA verification failed. Please try again.');
            setIsLoading(false);
            return;
        }

        const { error } = await dbClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}update-password`
        })

        resetTurnstile();
        
        if (error) {
            toast.error(error.message);
            setIsLoading(false);
            return;
        }

        toast.success("We've sent a link to your email address. Please check your inbox to proceed with resetting your password.");
        setIsLoading(false);
        return;
    }

    useEffect(() => {
        if (!erroMessageURL || erroMessageURL == "") return;
        toast.error(erroMessageURL);
        const currentParams = new URLSearchParams(searchParams.toString());
        currentParams.delete('error-message');
        const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
        router.replace(newUrl, { scroll: false });
    }, [erroMessageURL]);

    return( 
        <>
      
    <div className="user-signin-page user-forgot-password-page">
        <Card className="m-0">
            <CardBody>
                <div className="row">
                    <div className="col-md-7 align-self-center">
                        <SignInWelcomeText />
                    </div>
                    <div className="col-md-5 border-start ps-5">
                        <div className="position-relative">
                            {isLoading && <LoadingIcon withOverlap={true} />}
                            <h4 className="mb-3 ff-sora-medium">Forgot Password</h4>
                            <p className="mb-5">Please enter your email. You will receive a link to create a new password via email.</p>
                            <div className="mb-4">
                                <label htmlFor="emailInput" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    id="emailInput"
                                    className={`form-control ${(validation?.email === false) ? `is-invalid` : ``}`}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                              {validation?.email === false && !email && (
                                 <div className="text-danger mb-4 validation-size">{"Email is required."}</div>
                              )}
                              {email && !validateEmail(email) && (
                              <div className="password-validation-notice mb-4 validation-size">{"Please enter a valid email address."}</div>
                               )}
                            </div>
                            <TurnstileWrapper key={turnstileKey} onVerify={setTurnstileToken} />
                            <button onClick={e => handleForgotPassword()} className="btn btn-primary w-100 mb-3 py-2">Get New Password</button>
                            <p className="text-center text-muted">Don't have account? <Link href={"/sign-up"} className="text-primary">Create Account</Link></p>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    </div>
    </>
    )
}

export default userForgotPasswordPage;