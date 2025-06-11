"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import SignInWelcomeText from "@/Components/Applications/SignIn/SignInWelcomeText";
import Link from "next/link";
import { dbClient, getFreeMembershipsRequestStatusByUserID, getUserMembership, getUserMeta, membershipStatus, userRoles } from "@/DbClient";
import { validateEmail } from "@/Helper/commonHelpers";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody } from "reactstrap";
import TurnstileWrapper from "@/CommonComponent/TurnstileWrapper";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { EmailOtpType } from "@supabase/supabase-js";

interface loginValidation {
  email: boolean | undefined;
  password: boolean | undefined;
}

const userSignInPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  console.log("searchParams",searchParams)
  const tokenHashFromURL = searchParams.get('token_hash') || "";
  const erroMessageURL = searchParams.get('error-message');
  const messageURL = searchParams.get('message')
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validation, setValidation] = useState<loginValidation>({
    email: undefined,
    password: undefined,
  });
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // const resetTurnstile = () => {
  //   setTurnstileKey((prevKey) => prevKey + 1);
  // };

  const handleLogin = async () => {
    // if (!turnstileToken) {
    //   toast.error("Please complete the CAPTCHA.");
    //   return;
    // }

    let isError = false;
    let validationData: loginValidation = {
      email: true,
      password: true,
    };

    setValidation(validationData);

    if (!email) {
      isError = true;
      validationData = { ...validationData, email: false };
    } else if (!validateEmail(email)) {
      isError = true;
      validationData = { ...validationData, email: false };
    }

    if (!password) {
      isError = true;
      validationData = { ...validationData, password: false };
    }

    if (isError) {
      setValidation(validationData);
      return;
    }

    setIsLoading(true);

    // try {
    //   const verifyTurnstile = await rbpApiCall.post("/verify-turnstile", {
    //     turnstileToken,
    //   });
    //   if (!verifyTurnstile.data.success) {
    //     toast.error("CAPTCHA verification failed. Please try again.");
    //     resetTurnstile();
    //     setIsLoading(false);
    //     return;
    //   }
    // } catch (error) {
    //   toast.error("CAPTCHA verification failed. Please try again.");
    //   resetTurnstile();
    //   setIsLoading(false);
    //   return;
    // }

    const { data, error } = await dbClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      //resetTurnstile();
      setIsLoading(false);
      toast.error(`${error.message}.`);
      return;
    }

    const {
      user: { id: userID },
      session: { access_token, refresh_token },
    } = data;

    if (!access_token || !refresh_token || !userID) {
      //resetTurnstile();
      toast.error("Something is wrong! please try again.");
      setIsLoading(false);
      return;
    }

    const { error: sessionError } = await dbClient.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      //resetTurnstile();
      toast.error(sessionError.message);
      setIsLoading(false);
      return;
    }

    const { data: userData, error: userError } = await dbClient
      .from("users")
      .select("user_role, first_name, last_name")
      .eq("user_id", userID)
      .single();

    if (userError) {
      await dbClient.auth.signOut();
      //resetTurnstile();
      toast.error(userError.message);
      setIsLoading(false);
      return;
    }

    const {
      user_role: userRole,
      first_name: firstName,
      last_name: lastName,
    } = userData;

    if (userRole == userRoles.User) {
      const membershipData = await getUserMembership(userID);
      if (typeof membershipData == "boolean" && !membershipData) {
        let errorMessage = "It seems your membership is not active or available at the moment. Please contact our support team.";
        const freeMemebershipRequestStatus = await getFreeMembershipsRequestStatusByUserID(userID);
        if (typeof freeMemebershipRequestStatus != "boolean") {
          switch (freeMemebershipRequestStatus) {
            case 'pending':
              errorMessage = `It looks like you've applied for a free membership, but it hasn't been approved yet. Please contact our support team for assistance.`;
              break;

            case 'rejected':
              errorMessage = `It looks like your free membership request has been rejected. If you have any questions, please contact our support team.`;
              break;

            default:
              break;
          }
          await dbClient.auth.signOut();
          //resetTurnstile();
          toast.error(errorMessage, {
            toastId: "error2",
          });
          setIsLoading(false);
          return;
        }
        const signupSelectedPlan = await getUserMeta(userID, 'signup_selected_plan', true);
        const planID = (typeof signupSelectedPlan != "boolean") ? parseInt(signupSelectedPlan) : 1;
        const signUpURL = `/sign-up?plan=${planID}&error-message=Membership is currently unavailable.`;
        router.push(signUpURL);
        setIsLoading(false);
        return;
      }

      if (membershipData.status !== membershipStatus.Active) {
        await dbClient.auth.signOut();
        //resetTurnstile();
        toast.error(
          `It seems your membership is not active. Please contact our support team to resolve this issue.`,
          { toastId: "error3" }
        );
        setIsLoading(false);
        return;
      }
    }

    localStorage.setItem("authToken", access_token || "");
    localStorage.setItem("refreshToken", refresh_token || "");
    localStorage.setItem(
      "expires_at",
      (data.session?.expires_at ?? 0).toString()
    );
    localStorage.setItem("userId", userID);
    localStorage.setItem("userRole", userRole);
    localStorage.setItem("userDisplayName", `${firstName} ${lastName}`);

    let dashboardURL;
    switch (userRole) {
      case userRoles.Admin:
        dashboardURL = "/admin/admin_dashboard";
        break;

      case userRoles.PropertyManager:
        dashboardURL = "/property-manager/dashboard";
        break;

      default:
        dashboardURL = "/dashboard";
        break;
    }

    router.push(dashboardURL);
    setIsLoading(false);
    return;
  };

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
          setIsLoading(false);
          return;
        }

        localStorage.setItem("authToken", access_token || "");
        localStorage.setItem("refreshToken", refresh_token || "");
        localStorage.setItem(
          "expires_at",
          (expires_at ?? 0).toString()
        );
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
    if (!erroMessageURL || erroMessageURL == "") return;
    toast.error(erroMessageURL);
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('error-message');
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [erroMessageURL]);

  useEffect(() => {
    if (!messageURL || messageURL == "") return;
    toast.success(messageURL);
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('message');
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [messageURL]);

  return (
    <>

      <div className="user-signin-page">
        <Card className="m-0">
          <CardBody>
            <div className="row">
              <div className="col-12 col-md-7 align-self-center">
                <SignInWelcomeText />
              </div>
              <div className="col-md-5 border-start ps-5 card-res">
                <div className="position-relative">
                  {isLoading && <LoadingIcon withOverlap={true} />}
                  <h4 className="mb-3 ff-sora-medium">SignIn to the club</h4>
                  <div className="mb-3">
                    <label htmlFor="emailInput" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="emailInput"
                      className={`form-control ${validation?.email === false ? "is-invalid" : ""
                        }`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {validation?.email === false && !email && (
                      <div className="text-danger mt-2">
                        Email address is required.
                      </div>
                    )}
                    {validation?.email === false &&
                      email &&
                      !emailRegex.test(email) && (
                        <div className="text-danger mt-2">
                          Please enter a valid email address.
                        </div>
                      )}
                  </div>
                  <div className="mb-3">
                    <label htmlFor="passwordInput" className="form-label">
                      Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="passwordInput"
                        className={`form-control ${validation?.password === false ? "is-invalid" : ""
                          }`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-visibility-btn position-absolute top-50 translate-middle-y bg-white border-0 text-primary p-0 m-0"
                        onClick={(e) => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "hide" : "show"}
                      </button>
                    </div>
                    {validation?.password === false && password.length <= 0 && (
                      <div className="text-danger mt-2">
                        Password is required.
                      </div>
                    )}
                  </div>
                  <div className="mb-3 text-end">
                    <Link
                      href={"/forgot-password"}
                      className="text-danger ff-sora-regular"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  {/* <TurnstileWrapper key={turnstileKey} onVerify={setTurnstileToken} /> */}
                  <button
                    onClick={(e) => handleLogin()}
                    className="btn btn-primary w-100 mb-3 py-2"
                  >
                    Sign In
                  </button>
                  <p className="text-center text-muted">
                    Don't have account?{" "}
                    <Link href={"/sign-up"} className="text-primary">
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default userSignInPage;
