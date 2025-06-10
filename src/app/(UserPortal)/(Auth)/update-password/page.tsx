"use client"

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import SignInWelcomeText from "@/Components/Applications/SignIn/SignInWelcomeText";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody } from "reactstrap";
import { validatePassword } from "@/Helper/commonHelpers";
import { updatePassword } from "../actions";
import { dbClient, getUserMembership, membershipStatus } from "@/DbClient";
import { EmailOtpType } from "@supabase/supabase-js";

interface UpdatePasswordValidation {
    password: boolean | undefined,
    confirmPassword: boolean | undefined
}

const userUpdatePasswordPage = () => {

    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenHashFromURL = searchParams.get('token_hash') || "";
    const code = searchParams.get('code');
    const errorDescription = searchParams.get('error_description');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [accessToken, setAccessToken] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [validation, setValidation] = useState<UpdatePasswordValidation>({
        password: true,
        confirmPassword: true
    });
    const [passwordValidation, setPasswordValidation] = useState<Array<string>>([]);

    const handleUpdatePassword = async () => {
        if (!password) {
            toast.error("Password is required");
            return;
        } else if (password !== confirmPassword) {
            toast.error("Password is not matched with confirm password");
            return;
        }

        setIsLoading(true);

        const { error, data: {
            user
        } } = await dbClient.auth.updateUser({
            password: password
        });

        if (error) {
            toast.error(error.message);
            router.push(`/forgot-password`);
            setIsLoading(false);
            return;
        }

        if (user === null) {
            toast.error("Password is not updated. Please try again.");
            router.push(`/forgot-password`);
            return;
        }

        const userID = user.id;
        const { data: userData, error: userError } = await dbClient
            .from("users")
            .select("user_role, first_name, last_name")
            .eq("user_id", userID)
            .single();

        if (userError) {
            await dbClient.auth.signOut();
            router.push(`/forgot-password`);
            toast.error(userError.message);
            setIsLoading(false);
            return;
        }

        const {
            user_role: userRole,
            first_name: firstName,
            last_name: lastName,
        } = userData;

        if (userRole === "user") {
            const membershipData = await getUserMembership(userID);
            if (typeof membershipData == "boolean" && !membershipData) {
                await dbClient.auth.signOut();
                toast.error("Membership does not found! Please contact our support team.");
                router.push(`/forgot-password`);
                setIsLoading(false);
                return;
            }

            if (membershipData.status !== membershipStatus.Active) {
                await dbClient.auth.signOut();
                toast.error(
                    `Your Membership is not active so you are not allowed to login.`,
                    { toastId: "error3" }
                );
                router.push(`/forgot-password`);
                setIsLoading(false);
                return;
            }
        }

        localStorage.setItem("userId", userID);
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userDisplayName", `${firstName} ${lastName}`);

        const dashboardURL = (userRole === "admin") ? "/admin/admin_dashboard" : "/dashboard";
        router.push(dashboardURL);
        setIsLoading(false);
        return;
    }

    const verifyUser = async () => {

        if (tokenHashFromURL !== "") {
            setIsLoading(true);
            const type = 'email' as EmailOtpType;

            const { data, error } = await dbClient.auth.verifyOtp({
                token_hash: tokenHashFromURL,
                type
            });

            if (error) {
                toast.error('The link provided in your email appears to be invalid or expired; please contact the support team for further assistance.');
                router.push(`/forgot-password`);
                setIsLoading(false);
                return;
            }

            if (data.session) {
                const { session: {
                    access_token, refresh_token, expires_at
                } } = data;

                const { error: sessionError } = await dbClient.auth.setSession({
                    access_token,
                    refresh_token
                });
                if (sessionError) {
                    toast.error(sessionError.message);
                    router.push(`/forgot-password`);
                    setIsLoading(false);
                    return;
                }

                localStorage.setItem("authToken", access_token || "");
                localStorage.setItem("refreshToken", refresh_token || "");
                localStorage.setItem(
                    "expires_at",
                    (expires_at ?? 0).toString()
                );
            } else {
                toast.error('The link provided in your email appears to be invalid or expired; please contact the support team for further assistance.');
                router.push(`/forgot-password`);
                setIsLoading(false);
                return;
            }

            const params = new URLSearchParams(searchParams);
            params.delete("token_hash");
            params.delete("utm_id");
            params.delete("utm_source");
            params.delete("utm_medium");
            params.delete("utm_campaign");
            params.delete("utm_content");
            params.delete("utm_term");
            router.replace(`?${params.toString()}`, { scroll: false });
            setIsLoading(false);
        }
    }

    useEffect(() => {
        verifyUser();
    }, [tokenHashFromURL])

    useEffect(() => {
        if (!password) {
            setValidation({ ...validation, password: true });
            setPasswordValidation([]);
        } else {
            const passwordValidate = validatePassword(password)
            setPasswordValidation(passwordValidate);
            setValidation({ ...validation, password: !(passwordValidate.length > 0) });
        }

        if (confirmPassword && password && password !== confirmPassword) {
            setValidation({ ...validation, confirmPassword: false });
        } else {
            setValidation({ ...validation, confirmPassword: true });
        }
    }, [password, confirmPassword]);

    useEffect(() => {
        if (errorDescription) {
            toast.error(errorDescription)
            router.push(`/forgot-password`);
        }
    }, [errorDescription, router]);

    return <div className="user-signin-page user-update-password-page">
        <Card className="m-0">
            <CardBody>
                <div className="row">
                    <div className="col-md-7 align-self-center">
                        <SignInWelcomeText />
                    </div>
                    <div className="col-md-5 border-start ps-5">
                        <div className="position-relative">
                            <input type="hidden" name="accessToken" value={accessToken} />
                            {isLoading && <LoadingIcon withOverlap={true} />}
                            <h4 className="mb-3 ff-sora-medium">Update Password</h4>
                            <p className="mb-5">Enter your new password below.</p>
                            <div className="mb-3">
                                <label htmlFor="passwordInput" className="form-label">New Password</label>
                                <div className="position-relative">
                                    <input
                                        type={(showPassword) ? 'text' : 'password'}
                                        name="newPassword"
                                        id="passwordInput"
                                        className={`form-control ${(validation?.password === false) ? `is-invalid` : ``}`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-visibility-btn position-absolute top-50 translate-middle-y bg-white border-0 text-primary p-0 m-0"
                                        onClick={e => setShowPassword(!showPassword)}>
                                        {(showPassword) ? 'hide' : 'show'}
                                    </button>
                                </div>
                                {passwordValidation.length > 0 &&
                                    passwordValidation.map((data, key) => <small key={`passwordValidation-${key}`} className="password-validation-notice mt-2 d-block">{data}</small>)
                                }
                            </div>
                            <div className="mb-3">
                                <label htmlFor="confirmPasswordInput" className="form-label">Confirm Password</label>
                                <div className="position-relative">
                                    <input
                                        type={(showConfirmPassword) ? 'text' : 'password'}
                                        id="confirmPasswordInput"
                                        className={`form-control ${(validation?.confirmPassword === false) ? `is-invalid` : ``}`}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="password-visibility-btn position-absolute top-50 translate-middle-y bg-white border-0 text-primary p-0 m-0"
                                        onClick={e => setShowConfirmPassword(!showConfirmPassword)}>
                                        {(showConfirmPassword) ? 'hide' : 'show'}
                                    </button>
                                </div>
                                {(validation.confirmPassword === false && password !== "") && <small className="password-validation-notice mt-2 d-block">Password and re-type password does not match.</small>}
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary w-100 py-2"
                                disabled={!(password != "" && confirmPassword != "" && validation.confirmPassword === true && validation.password === true && passwordValidation.length <= 0)}
                                onClick={e => {
                                    handleUpdatePassword();
                                }}
                            >
                                Save Password
                            </button>
                        </div>
                    </div>
                </div>

            </CardBody>
        </Card>
    </div>
}

export default userUpdatePasswordPage;