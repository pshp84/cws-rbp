"use client";

import { SignupBanquestPaymentRequestBody } from "@/app/api/banquest/signup-payment/route";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import SignUpEnrollment from "@/Components/Applications/SignUp/SignUpEnrollment";
import SignUpPayment from "@/Components/Applications/SignUp/SignUpPayment";
import SignUpPlans from "@/Components/Applications/SignUp/SignUpPlans";
import SignUpSteps from "@/Components/Applications/SignUp/SignUpSteps";
import SignUpVerification from "@/Components/Applications/SignUp/SignUpVerification";
import SignUpVerified from "@/Components/Applications/SignUp/SignUpVerified";
import {
  addMembership,
  addReferral,
  addReferralArgs,
  addTransaction,
  addTransactionMetas,
  affiliatesDBInterface,
  dbClient,
  getUserMeta,
  getUserRole,
  membershipPlansDbFieldsInterface,
  membershipStatus,
  referralMethod,
  updateUserMeta,
  updateUtmEvent,
  updateUtmEventArgs,
  userDbFieldsInterface,
  userRoles,
  UtmEventType,
} from "@/DbClient";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { decryptData } from "@/utils/encryption";
import { captureUTMParams, removeUTMParamsFromLS } from "@/utils/utm";
import { type EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody } from "reactstrap";
import { addUserToBrevo } from "@/CommonComponent/brevoContactLists";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";
import {
  captureReferralCodeParams,
  getReferralCode,
  ReferralCodeURLParam,
  removeReferralCodeParamsFromLS,
} from "@/utils/Referral";
import { calculateNextRunDate } from "@/app/api/banquest/banquestConfig";

interface PlanDetailsForEmail {
  planName: string;
  startDate?: string | Date;
  planAmount?: string;
  nextPaymentDate?: string | Date;
}

interface UserAttributes {
  FIRSTNAME: string;
  LASTNAME: string;
  SMS?: string; // Optional property for SMS
}

interface UserData {
  email: string;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  attributes: UserAttributes;
  listIds: number[];
  listUnsubscribed: null | string;
}

const userSignUpPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromURL = searchParams.get("plan") || "";
  const inviteCode = searchParams.get("invite-code") || "";
  const errorMessage = searchParams.get("error-message") || "";
  const tokenHashFromURL = searchParams.get("token_hash") || "";
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlan, setSelectedPlan] = useState<number>();
  const [activeStep, setActiveStep] = useState<string>("plan");
  const [userSignUpData, setUserSignUpData] = useState<
    | {
        turnstileToken?: string;
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phoneNumber: number;
        emailOptIn?: boolean;
        phoneNumberOptIn?: boolean;
      }
    | undefined
  >();
  const [userID, setUserID] = useState<string>();
  const [turnstileKey, setTurnstileKey] = useState(0);
  const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;

  const resetTurnstile = () => {
    setTurnstileKey((prevKey) => prevKey + 1);
  };

  const sendEmailToUser = async (planDetails: PlanDetailsForEmail) => {
    if (!userSignUpData) return;
    const {
      planName,
      startDate = formatDate(new Date()),
      planAmount = "NA",
      nextPaymentDate = "NA",
    } = planDetails;
    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
      siteURL,
      userName:
        userSignUpData.firstName.charAt(0).toUpperCase() +
        userSignUpData.firstName.slice(1),
      planName,
      startDate,
      planAmount,
      nextPaymentDate,
      userEmail: userSignUpData.email,
    };

    const data = await sendApiEmailToUser({
      sendTo: userSignUpData.email,
      subject: `Welcome to RBP Club! Let's Get Started`,
      template: "welcomeEmail",
      context: emailTemplateData,
      extension: ".html",
      dirpath: "public/email-templates",
    });
    return data;
  };

  const sendEmailToPropertyManager = async (
    planDetails: membershipPlansDbFieldsInterface,
    affilateUser: userDbFieldsInterface
  ) => {
    if (!userSignUpData) return;
    const {
      plan_name: planName,
      plan_amount: planAmount,
      plan_frequency: planFrequency,
    } = planDetails;

    const { user_email: userEmail, first_name } = affilateUser;

    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;

    const emailTemplateData = {
      affilateUserName: first_name,
      siteURL,
      memberFirstName: userSignUpData.firstName,
      memberLastName: userSignUpData.lastName,
      memberEmail: userSignUpData.email,
      planName,
      startDate: formatDate(new Date()),
      planAmount: `${priceFormat(planAmount as number)}/${planFrequency}`,
      nextPaymentDate: formatDate(calculateNextRunDate(planFrequency)),
      userEmail: userEmail,
    };

    const data = await sendApiEmailToUser({
      sendTo: userEmail,
      subject: `New Referral Alert! You've Earned a New Signup`,
      template: "newReferralAlert",
      context: emailTemplateData,
      extension: ".html",
      dirpath: "public/email-templates",
    });
    return data;
  };

  const sendEmailToAdmin = async (planDetails: PlanDetailsForEmail) => {
    if (!userSignUpData) return;
    const {
      planName,
      startDate = formatDate(new Date()),
      planAmount = "NA",
      nextPaymentDate = "NA",
    } = planDetails;
    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
      siteURL,
      userFirstName: userSignUpData.firstName,
      userLastName: userSignUpData.lastName,
      userEmail: userSignUpData.email,
      userID: userID,
      planName,
      startDate,
      planAmount,
      nextPaymentDate,
    };

    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const data = await sendApiEmailToUser({
      sendTo: adminEmail,
      subject: `New Subscription Alert: A User Just Subscribed!`,
      template: "newUserSubscriptionAdminEmail",
      context: emailTemplateData,
      extension: ".html",
      dirpath: "public/email-templates",
      //siteUrl: siteURL
    });
    return data;
  };

  const verifiedProceedBtnHandler = async () => {
    if (selectedPlan === 4) {
      if (!userID || !userSignUpData) return;
      setIsLoading(true);

      await dbClient.from("free_memberships_requests").insert([
        {
          user_id: userID,
        },
      ]);

      utmEventProcess(userID);

      // await sendMail(
      //   {
      //     sendTo: userSignUpData.email,
      //     subject: `Your free membership request is under review`,
      //     template: "freeMembershipWelcomeEmail",
      //     context: {
      //       userName: userSignUpData.firstName,
      //     },
      //   },
      //   { extension: ".html", dirpath: "./EmailTemplates" }
      // );

      await sendApiEmailToUser({
        sendTo: userSignUpData.email,
        subject: `Your free membership request is under review`,
        template: "freeMembershipWelcomeEmail",
        context: {
          userName:
            userSignUpData.firstName.charAt(0).toUpperCase() +
            userSignUpData.firstName.slice(1),
          userEmail: userSignUpData.email,
        },
        extension: ".html",
        dirpath: "public/email-templates",
        //siteUrl: `${siteURL}`
      });

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

      await sendApiEmailToUser({
        sendTo: adminEmail,
        subject: `New request for free membership`,
        template: "freeMembershipRequestAdmin",
        context: {
          userFirstName: userSignUpData.firstName,
          userLastName: userSignUpData.lastName,
          userEmail: userSignUpData.email,
          userID: userID,
          adminEmail: adminEmail,
        },
        extension: ".html",
        dirpath: "public/email-templates",
        //siteUrl: siteURL
      });
      await dbClient.auth.signOut();
      router.push(`/sign-in`);
      toast.success(
        "Thank you for your request for a free membership. We will review your application and send a confirmation to your email shortly."
      );
      setIsLoading(false);
      return;
    }
    setActiveStep("payment");
  };

  const getEmailRedirectToURL = () => {
    const baseUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}sign-up?plan=${selectedPlan}`;

    // Retrieve UTM parameters and referral code from localStorage
    const utmParams = localStorage.getItem("utm_params");
    const referralCode = localStorage.getItem(ReferralCodeURLParam);

    const queryParams = new URLSearchParams();

    // Append UTM parameters if available
    if (utmParams) {
      try {
        const parsedUTMParams = JSON.parse(utmParams);
        Object.entries(parsedUTMParams).forEach(([key, value]) => {
          if (value) queryParams.append(key, value as string);
        });
      } catch (error) {
        console.error("Error parsing UTM parameters:", error);
      }
    }

    // Append referral code if available
    if (referralCode) {
      try {
        const parsedReferral = JSON.parse(referralCode); // Parse referral_code JSON
        if (typeof parsedReferral === "string") {
          queryParams.append("referral_code", parsedReferral);
        } else if (parsedReferral?.referral_code) {
          queryParams.append("referral_code", parsedReferral.referral_code);
        }
      } catch (error) {
        console.error("Error parsing referral code:", error);
      }
    }

    // Return the final URL with all valid query parameters
    return queryParams.toString()
      ? `${baseUrl}&${queryParams.toString()}`
      : baseUrl;
  };

  const verificationResendBtnHandler = async () => {
    if (!userSignUpData) return;
    const { email } = userSignUpData;
    if (!email) return;
    setIsLoading(true);
    const redirectURL = getEmailRedirectToURL();
    const { error } = await dbClient.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: redirectURL,
      },
    });

    if (error) {
      setIsLoading(false);
      toast.error(error.message);
      return false;
    }
    setIsLoading(false);
    toast.success(
      "A link has been sent to your email address. Please check your inbox to access it."
    );
    return true;
  };

  const signUpUser = async () => {
    if (!userSignUpData) return false;
    const {
      email,
      password,
      firstName,
      lastName,
      turnstileToken,
      phoneNumber,
      emailOptIn,
      phoneNumberOptIn,
    } = userSignUpData;
    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !turnstileToken ||
      !phoneNumber
    )
      return false;

    setIsLoading(true);

    try {
      const verifyTurnstile = await rbpApiCall.post("/verify-turnstile", {
        turnstileToken,
      });
      if (!verifyTurnstile.data.success) {
        resetTurnstile();
        toast.error("CAPTCHA verification failed. Please try again.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      resetTurnstile();
      toast.error("CAPTCHA verification failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const redirectURL = getEmailRedirectToURL();
    const { data, error } = await dbClient.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: redirectURL,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          email_opt_in: emailOptIn || false,
          phone_number_opt_in: phoneNumberOptIn || false,
        },
      },
    });

    if (error) {
      resetTurnstile();
      toast.error("Something is wrong! please try again.");
      setIsLoading(false);
      return false;
    }

    setActiveStep("verification");
    setIsLoading(false);
    return true;
  };

  const verifyUser = async () => {
    if (tokenHashFromURL !== "" && planFromURL !== "") {
      setActiveStep("verification");
      setIsLoading(true);
      const type = "email" as EmailOtpType;

      const { data, error } = await dbClient.auth.verifyOtp({
        token_hash: tokenHashFromURL,
        type,
      });

      if (error) {
        toast.error(
          "The link provided in your email appears to be invalid or expired; please contact the support team for further assistance."
        );
        setActiveStep("plan");
        setIsLoading(false);
        return;
      }

      if (data.session) {
        const {
          session: { access_token, refresh_token, expires_at },
          user,
        } = data;

        if (user) {
          const { id } = user;
          const userRole = await getUserRole(id);
          if (
            typeof userRole != "boolean" &&
            userRole == userRoles.PropertyManager
          ) {
            await dbClient.auth.signOut();
            router.push(`/sign-in`);
            toast.success(
              "Your email has been verified. You can now log in with your email and password to continue accessing your account."
            );
            return;
          }
        }

        const { error: sessionError } = await dbClient.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) {
          toast.error(sessionError.message);
          setActiveStep("plan");
          setIsLoading(false);
          return;
        }

        localStorage.setItem("authToken", access_token || "");
        localStorage.setItem("refreshToken", refresh_token || "");
        localStorage.setItem("expires_at", (expires_at ?? 0).toString());
      }

      setSelectedPlan(parseInt(planFromURL));
      await fatchUserData();
      const params = new URLSearchParams(searchParams);
      params.delete("token_hash");
      params.delete("utm_id");
      params.delete("utm_source");
      params.delete("utm_medium");
      params.delete("utm_campaign");
      params.delete("utm_content");
      params.delete("utm_term");
      router.replace(`?${params.toString()}`, { scroll: false });
      setActiveStep("verified");
      setIsLoading(false);
    }
  };

  const fatchUserData = async () => {
    setIsLoading(true);
    const { data, error } = await dbClient.auth.getUser();
    if (!error && data?.user) {
      const { user } = data;
      if (user) {
        const userID = user.id;
        const { data: userData, error: errorUserError } = await dbClient
          .from("users")
          .select("user_email, first_name, last_name, phone_number")
          .eq("user_id", userID)
          .single();
        if (!errorUserError) {
          setUserID(userID);
          setUserSignUpData({
            email: userData.user_email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            password: "",
            phoneNumber: userData.phone_number,
          });

          const signupSelectedPlan = await getUserMeta(
            userID,
            "signup_selected_plan",
            true
          );

          if (!signupSelectedPlan) {
            if (selectedPlan || planFromURL != "") {
              const planID = selectedPlan || parseInt(planFromURL);
              await updateUserMeta(userID, "signup_selected_plan", planID);
              setSelectedPlan(planID);
            }
          } else {
            setSelectedPlan(parseInt(signupSelectedPlan));
          }
          if (
            errorMessage &&
            errorMessage == "Membership is currently unavailable."
          ) {
            toast.error("Please make payment to get membership");
            setActiveStep("payment");
            setIsLoading(false);
            return;
          }
          setActiveStep("verified");
        }
      }
    } else if (
      errorMessage &&
      errorMessage == "Membership is currently unavailable."
    ) {
      toast.error("Membership is currently unavailable");
    }
    setIsLoading(false);
  };

  const proceedToPayment = async (data: any) => {
    if (!userID || !selectedPlan || !userSignUpData) return;

    const affiliateData = data?.referralData || false;

    if (affiliateData) data.discount = "free period";

    setIsLoading(true);
    const paymentData = await banquestPaymentProcess(data);

    if (!paymentData) {
      toast.error("Something is wrong! please try again");
      setIsLoading(false);
      return;
    }

    const {
      chargeData: customerChargeData,
      recurringScheduleData,
      paymentMethodData,
      customerData,
    } = paymentData;

    if (!affiliateData) {
      if (customerChargeData.status && customerChargeData.status == "Error") {
        toast.error("Something is wrong! please try again");
        setIsLoading(false);
        return;
      }
    }

    // Delete old user meta process
    await dbClient
      .from("usermeta")
      .delete()
      .in("meta_key", [
        "street",
        "street2",
        "state",
        "city",
        "zip_code",
        "country",
        "banquest_customer_id",
        "banquest_payment_method_type",
        "banquest_payment_method_id",
        "banquest_payment_method_data",
        "banquest_membership_recurring_schedule_id",
      ])
      .eq("user_id", userID);
    // EOF Delete old user meta process

    // Add user meta
    const insertUserMeta: Array<{
      user_id: string;
      meta_key: string;
      meta_value?: string;
    }> = [];

    if (data.city)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "city",
        meta_value: data.city,
      });

    if (data.state)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "state",
        meta_value: data.state,
      });

    if (data.country)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "country",
        meta_value: data.country,
      });

    if (data.street)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "street",
        meta_value: data.street,
      });

    if (data.street2)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "street2",
        meta_value: data.street2,
      });

    if (data.zipCode)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "zip_code",
        meta_value: data.zipCode,
      });

    if (data.zipCode)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "zip_code",
        meta_value: data.zipCode,
      });

    if (customerData.id)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "banquest_customer_id",
        meta_value: customerData.id,
      });

    if (data.paymentMethodType)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "banquest_payment_method_type",
        meta_value: data.paymentMethodType,
      });

    if (paymentMethodData.id)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "banquest_payment_method_id",
        meta_value: paymentMethodData.id,
      });

    if (paymentMethodData)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "banquest_payment_method_data",
        meta_value: paymentMethodData,
      });

    if (recurringScheduleData.id)
      insertUserMeta.push({
        user_id: userID,
        meta_key: "banquest_membership_recurring_schedule_id",
        meta_value: recurringScheduleData.id,
      });

    await dbClient.from("usermeta").insert(insertUserMeta);
    // EOF Add user meta

    // Add membership and transaction
    let membershipStatusValue: membershipStatus = membershipStatus.Active;
    if (!affiliateData) {
      if (
        !customerChargeData.status ||
        customerChargeData.status === "Declined"
      ) {
        membershipStatusValue = membershipStatus.Hold;
      }
    }

    const membershipId = await addMembership({
      planId: selectedPlan,
      userId: userID,
      status: membershipStatusValue,
      banquestRecurringScheduleId: recurringScheduleData.id,
      nextPaymentDate: recurringScheduleData.next_run_date,
    });

    if (customerChargeData && customerChargeData.transaction) {
      const transactionId = await addTransaction({
        membershipId: membershipId,
        planId: selectedPlan,
        userId: userID,
        status:
          customerChargeData.transaction.status_details.status.toLowerCase(),
      });
      const banquestTransaction = customerChargeData.transaction;
      let transactionMeta: any = {
        banquest_data: customerChargeData.transaction,
        banquest_transaction_id: banquestTransaction.id,
        banquest_transaction_customer_id:
          banquestTransaction.customer.customer_id,
        banquest_transaction_status: banquestTransaction.status_details.status,
        banquest_transaction_description:
          banquestTransaction.transaction_details.description,
        banquest_transaction_batch_id:
          banquestTransaction.transaction_details.batch_id,
        banquest_charge_status: customerChargeData.status,
        banquest_charge_reference_number: customerChargeData.reference_number,
        banquest_charge_auth_code: customerChargeData.auth_code,
      };

      if (data.ccData) {
        transactionMeta = {
          ...transactionMeta,
          banquest_transaction_card_details_name:
            banquestTransaction.card_details.name,
          banquest_transaction_card_last4:
            banquestTransaction.card_details.last4,
          banquest_transaction_card_details_expiry_month:
            banquestTransaction.card_details.expiry_month,
          banquest_transaction_card_details_expiry_year:
            banquestTransaction.card_details.expiry_year,
          banquest_transaction_card_details_card_type:
            banquestTransaction.card_details.card_type,
        };
      } else if (data.achData) {
        transactionMeta = {
          ...transactionMeta,
          banquest_transaction_check_details_name:
            banquestTransaction.check_details.name,
          banquest_transaction_check_details_routing_number:
            banquestTransaction.check_details.routing_number,
          banquest_transaction_check_details_account_number_last4:
            banquestTransaction.check_details.account_number_last4,
          banquest_transaction_check_details_account_type:
            banquestTransaction.check_details.account_type,
        };
      }

      await addTransactionMetas(transactionId, transactionMeta);
    }
    // EOF Add membership and transaction

    localStorage.setItem("userId", userID);
    localStorage.setItem("userRole", "user");
    localStorage.setItem(
      "userDisplayName",
      `${userSignUpData.firstName} ${userSignUpData.lastName}`
    );

    await sendEmailToUser({
      planName: data.planData.plan_name,
      planAmount:
        priceFormat(data.planData.plan_amount) +
        "/" +
        data.planData.plan_frequency,
      nextPaymentDate: formatDate(recurringScheduleData.next_run_date),
    });

    await sendEmailToAdmin({
      planName: data.planData.plan_name,
      planAmount:
        priceFormat(data.planData.plan_amount) +
        "/" +
        data.planData.plan_frequency,
      nextPaymentDate: formatDate(recurringScheduleData.next_run_date),
    });

    if (data.referralData) {
      const { affiliateData } = data.referralData;
      await referralCodeProcess(userID, data.planData, affiliateData);
    }
    utmEventProcess(userID);
    const listId = Number(process.env.NEXT_PUBLIC_BREVO_LIST_IDS);

    const brevoData: UserData = {
      email: userSignUpData.email,
      attributes: {
        FIRSTNAME: userSignUpData.firstName,
        LASTNAME: userSignUpData.lastName,
        SMS: "",
      },
      listIds: [listId],
      emailBlacklisted: false,
      smsBlacklisted: false,
      listUnsubscribed: null,
    };
    //await addUserToBrevo(brevoData);
    router.push(`/dashboard`);
    toast.success("Congratulations! Sign-up completed successfully.");
    setIsLoading(false);
    return;
  };

  const banquestPaymentProcess = async (data: any) => {
    if (!userID || !selectedPlan || !userSignUpData) return false;
    try {
      const customerAddress = {
        first_name: userSignUpData.firstName,
        last_name: userSignUpData.lastName,
        city: data.city || "",
        state: data.state || "",
        country: data.country,
        street: data.street || "",
        street2: data.street2,
        zip: data.zipCode || "",
      };

      const payload: SignupBanquestPaymentRequestBody = {
        customerData: {
          customer_number: userID,
          identifier: userID,
          email: userSignUpData.email,
          first_name: userSignUpData.firstName,
          last_name: userSignUpData.lastName,
          billing_address: customerAddress,
          shipping_address: customerAddress,
        },
        paymentData: {
          type: data.paymentMethodType,
        },
        chargeData: {
          amount: data.planData.plan_amount,
          description: `${data.planData.plan_name} plan`,
        },
        recurringPaymentData: {
          frequency: data.planData.plan_frequency,
        },
      };

      if (data.ccData) {
        const {
          creditCardNonceToken,
          expiryMonth,
          expiryYear,
          nameOnAccount,
        }: CreditCardMethodData = data.ccData;
        if (creditCardNonceToken)
          payload.paymentData = {
            ...payload.paymentData,
            nonce_token: creditCardNonceToken,
          };
        if (expiryMonth)
          payload.paymentData = {
            ...payload.paymentData,
            expiry_month: expiryMonth,
          };
        if (expiryYear)
          payload.paymentData = {
            ...payload.paymentData,
            expiry_year: expiryYear,
          };
        if (nameOnAccount)
          payload.paymentData = { ...payload.paymentData, name: nameOnAccount };
      } else if (data.achData) {
        const {
          accountNumber,
          accountType,
          nameOnAccount,
          routingNumber,
        }: AchPaymentMethodData = data.achData;
        if (accountNumber)
          payload.paymentData = {
            ...payload.paymentData,
            account_number: accountNumber,
          };
        if (accountType)
          payload.paymentData = {
            ...payload.paymentData,
            account_type: accountType,
          };
        if (nameOnAccount)
          payload.paymentData = { ...payload.paymentData, name: nameOnAccount };
        if (routingNumber)
          payload.paymentData = {
            ...payload.paymentData,
            routing_number: routingNumber,
          };
      }

      if (data.referralData) payload.discount = "free period";

      const responseData = await rbpApiCall.post(
        `/banquest/signup-payment`,
        payload
      );
      if (!responseData.status || !responseData.data.status) {
        return false;
      }
      return responseData.data.data;
    } catch (error) {
      console.error("Error while banquestPaymentProcess", error.message);
      return false;
    }
  };

  const referralCodeProcess = async (
    userID: string,
    planDetails: membershipPlansDbFieldsInterface,
    affiliateData: affiliatesDBInterface
  ) => {
    if (
      !affiliateData.affiliate_id ||
      !planDetails.plan_id ||
      !affiliateData.users
    )
      return false;
    removeReferralCodeParamsFromLS();

    const addReferralArgs: addReferralArgs = {
      affiliateID: affiliateData.affiliate_id,
      planID: planDetails.plan_id,
      userID: userID,
      referralMethod: referralMethod.Link,
    };

    const addReferralData = await addReferral(addReferralArgs);
    if (typeof addReferralData !== "boolean")
      await sendEmailToPropertyManager(planDetails, affiliateData.users);
  };

  const utmEventProcess = async (
    userID: string,
    eventType: UtmEventType = UtmEventType.Signup
  ) => {
    const utmEventID = localStorage.getItem("utm_event_id");
    if (!utmEventID || utmEventID == "") return;
    const updateUtmEventArgs: updateUtmEventArgs = {
      eventType,
      userID,
    };
    removeUTMParamsFromLS();
    return await updateUtmEvent(parseInt(utmEventID), updateUtmEventArgs);
  };

  useEffect(() => {
    fatchUserData();
    captureUTMParams();
    captureReferralCodeParams();
  }, []);

  useEffect(() => {
    verifyUser();
  }, [tokenHashFromURL, planFromURL]);

  useEffect(() => {
    if (!selectedPlan) return;
    if (
      activeStep == "payment" ||
      activeStep == "verification" ||
      activeStep == "verified"
    )
      return;
    setActiveStep("enrollment");
  }, [selectedPlan]);

  useEffect(() => {
    if (activeStep == "verification" || activeStep == "verified") return;
    signUpUser();
  }, [userSignUpData]);

  useEffect(() => {
    if (!inviteCode || inviteCode == "") return;
    if (decryptData(inviteCode) != "userwasinvitedthroughaspecificcode") return;
    setSelectedPlan(4);
  }, [inviteCode]);

  return (
    <>
      <div className="user-signup-page">
        <Card className="m-0">
          <CardBody>
            <div className="row gx-5">
              {/* Left bar */}
              <div className="col-xl-3 border-end">
                <h3 className="mb-2 f-w-500">Join the RBP Club</h3>
                <p className="mb-0">
                  Become part of an exclusive community designed to make renting
                  smarter, easier, and more rewarding. Enjoy premium benefits
                  like discounts, rewards, and simplified living!
                </p>
                <SignUpSteps
                  activeStep={activeStep}
                  selectedPlan={selectedPlan}
                />
              </div>
              {/* EOF Left bar */}

              {/* Right bar */}
              <div className="col-xl-9 position-relative">
                {isLoading && <LoadingIcon withOverlap={true} />}
                {activeStep == "plan" && (
                  <div className="signup-plan-selection">
                    <h3 className="mb-4 f-w-500">
                      Choose Your Membership Plan
                    </h3>
                    <SignUpPlans onSelectedPlan={setSelectedPlan} />
                  </div>
                )}

                {activeStep == "enrollment" && (
                  <SignUpEnrollment
                    backBtnAction={setActiveStep}
                    resetTurnstile={turnstileKey}
                    proceedBtnAction={setUserSignUpData}
                    userSignUpData={userSignUpData}
                    disableBackBtn={selectedPlan == 4 ? true : false}
                  />
                )}

                {activeStep == "verification" && (
                  <SignUpVerification
                    backBtnAction={setActiveStep}
                    resendBtnAction={verificationResendBtnHandler}
                  />
                )}

                {activeStep == "verified" && (
                  <SignUpVerified
                    proceedBtnAction={verifiedProceedBtnHandler}
                  />
                )}

                {activeStep == "payment" && selectedPlan && userID && (
                  <SignUpPayment
                    paymentBtnAction={proceedToPayment}
                    selectedPlan={selectedPlan}
                    onChangeSelectedPlan={setSelectedPlan}
                    userID={userID}
                    userData={userSignUpData}
                  />
                )}
              </div>
              {/* EOF Right bar */}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default userSignUpPage;
