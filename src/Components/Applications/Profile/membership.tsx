"use client";
import { useEffect, useState, useRef } from "react";
import {
  Col,
  Row,
  Label,
  Spinner,
  Button,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { MemberShipPlans } from "@/Types/Membership";
import {
  getUserMembershipByPlan,
  getMembershipPlans,
  changeUserMembershipPlan,
  getUserMembership,
} from "@/DbClient/memberships";
import { useFormik, FormikProvider, Field } from "formik";
import {
  getUserById,
  getUserMeta,
  paymentMethodDataInterface,
  updateUserMeta,
  updateUserPaymentMethod,
  userDbFieldsInterface,
  UserMetaDataInterface,
} from "@/DbClient/users";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { sendMail } from "@/Helper/mailSender";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import BanquestCreditCardForm from "@/CommonComponent/BanquestCreditCardForm";
import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import {
  BanquestAccountTypes,
  BanquestPaymentMethodTypes,
} from "@/app/api/banquest/banquestConfig";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";

interface PlanDetails {
  plan_amount: number;
  plan_description: string;
  plan_frequency: string;
  plan_id: number;
  plan_name: string;
  plan_status: boolean;
}

const UserMembership = () => {
  const headerProps: CommonCardHeaderProp = {
    title: "Membership Details",
    span: [{ text: "Check Current membership details." }],
  };
  const updateHeaderProps: CommonCardHeaderProp = {
    title: "Update Membership Details",
    span: [{ text: "Update membership details." }],
  };
  const [membership, setMembership] = useState<any>([]);
  const [membershipPlan, setMembershipPlan] = useState<any>([]);
  const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const cardFormRef = useRef<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [plansId, setPlansId] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") as string
  );
  const [name, setName] = useState<any>("");
  const [details, setDetails] = useState<PlanDetails[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [openModel, setOpenModel] = useState(false);
  const [selectPaymentMethod, setSelectPaymentMethod] =
    useState<string>("plaid");
  const [triggerCharge, setTriggerCharge] = useState(false);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [achData, setAchData] = useState<AchPaymentMethodData | undefined>();
  const [paymentMethodType, setPaymentMethodType] = useState<
    BanquestPaymentMethodTypes | undefined
  >();
  const [ccData, setCcData] = useState<CreditCardMethodData | undefined>();
  const [nameOnAccountInput, setNameOnAccountInput] = useState<string>();
  const [accountNumberInput, setAccountNumberInput] = useState<string>();
  const [routingNumberInput, setRoutingNumberInput] = useState<string>();
  const [accountTypeInput, setAccountTypeInput] = useState<
    BanquestAccountTypes | undefined
  >();
  const [values, setValues] = useState<any>(null);
  const [methodType, setMethodType] = useState<string>("");
  const [validation, setValidation] = useState<any>({
    nameOnAccount: true,
    accountNumber: true,
    routingNumber: true,
    accountType: true,
  });
  const [isLoad, setIsLoad] = useState(false);
  const [userDetails, setUserDetails] = useState<any>();
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [saveId, setSaveId] = useState<number>(0);

  const handleTokenizationComplete = async (
    token: string,
    expiryMonth: number,
    expiryYear: number
  ) => {
    setPaymentMethodType(BanquestPaymentMethodTypes.cc);
    setCcData({
      creditCardNonceToken: token,
      expiryMonth: expiryMonth,
      expiryYear: expiryYear,
    });
  };

  const fetchSingleUserMembership = async () => {
    try {
      const result = await getUserMembership(userId, true);
      if (result) {
        setPlansId(result.plan_id);
      } else {
        setPlansId(0);
      }
    } catch (err) {}
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    formik.setFieldValue("planId", 1);
  };

  const fetchUser = async () => {
    try {
      const result = await getUserById(userId);
      if (result) {
        setName(result);
      }
    } catch (err) {}
  };

  const fetchMembershipPlans = async () => {
    try {
      const result = await getMembershipPlans(false);
      if (result) {
        setDetails(result);
      }
    } catch (err) {}
  };

  const formatDate = (dateString: string) => {
    if ((dateString ?? null) != null) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return formatter.format(date);
    } else {
      return "-";
    }
  };

  const getPlanName = (planId: number) => {
    if ((membershipPlan ?? null) !== null) {
      const planName = (membershipPlan as MemberShipPlans[])?.find(
        (x) => x.plan_id === planId
      )?.plan_name;

      return planName;
    } else {
      return "-";
    }
  };

  const getPlanStatus = (planStatus: string) => {
    if ((planStatus ?? null) !== null && planStatus != "") {
      const planNameString = planStatus;
      return (
        planNameString.charAt(0).toUpperCase() + String(planStatus).slice(1)
      );
    } else {
      return "-";
    }
  };

  const fetchMembershipData = async (planId?: number) => {
    try {
      const [membershipData, membershipPlans] = await Promise.all([
        getUserMembershipByPlan(userId as string, planId),
        getMembershipPlans(false),
      ]);
      setMembership(membershipData);
      setMembershipPlan(membershipPlans);
    } catch (error) {
    } finally {
      setShowSpinner(false);
    }
  };

  const getPlanName1 = (planId: number): string | undefined => {
    const plan = details.find((p) => p.plan_id === planId);
    return plan ? plan.plan_name : undefined;
  };

  const getPlanAmount = (planId: number): number | undefined => {
    const plan = details.find((p) => p.plan_id === planId);
    return plan ? plan.plan_amount : undefined;
  };

  const fetchMetaData = async () => {
    try {
      const result = await getUserMeta(userId, "banquest_payment_method_data");
      const result1 = await getUserMeta(userId, "banquest_payment_method_type");
      const result2 = await getUserById(userId);

      if ((result && result[0]) || (result1 && result1[0]) || result2) {
        //setShowSpinner(false)
        // const newValues = {
        //   firstName: userDetails.first_name ?? "",
        //   lastName: userDetails.last_name ?? "",
        //   email: userDetails.user_email ?? "",
        //   street:
        //     userMetaDetails.find((x) => x.meta_key == "street")?.meta_value ??
        //     "",
        //   street2:
        //     userMetaDetails.find((x) => x.meta_key == "street2")
        //       ?.meta_value ?? "",
        //   city:
        //     userMetaDetails.find((x) => x.meta_key == "city")?.meta_value ??
        //     "",
        //   state:
        //     userMetaDetails.find((x) => x.meta_key == "state")?.meta_value ??
        //     "",
        //   country:
        //     userMetaDetails.find((x) => x.meta_key == "country")
        //       ?.meta_value ?? "",
        //   zipcode:
        //     userMetaDetails.find((x) => x.meta_key == "zip_code")
        //       ?.meta_value ?? "",
        // };
        setValues(JSON.parse(result[0].meta_value));
        setMethodType(result1[0].meta_value);
        setName(result2);
      }
    } catch (error) {
      console.error("Error fetching meta data:", error);
    }
  };

  const getUserDetails = async () => {
    Promise.all([
      getUserById(userId, ["first_name", "last_name", "user_email"]),
      getUserMeta(userId),
    ]).then(
      (results: [userDbFieldsInterface, UserMetaDataInterface[]] | any) => {
        if (Array.isArray(results) && results.length > 0) {
          const userDetails: userDbFieldsInterface = results[0];

          const userMetaDetails: UserMetaDataInterface[] = results[1];
          const newValues = {
            firstName: userDetails.first_name ?? "",
            lastName: userDetails.last_name ?? "",
            email: userDetails.user_email ?? "",
            street:
              userMetaDetails.find((x) => x.meta_key == "street")?.meta_value ??
              "",
            street2:
              userMetaDetails.find((x) => x.meta_key == "street2")
                ?.meta_value ?? "",
            city:
              userMetaDetails.find((x) => x.meta_key == "city")?.meta_value ??
              "",
            state:
              userMetaDetails.find((x) => x.meta_key == "state")?.meta_value ??
              "",
            country:
              userMetaDetails.find((x) => x.meta_key == "country")
                ?.meta_value ?? "",
            zipcode:
              userMetaDetails.find((x) => x.meta_key == "zip_code")
                ?.meta_value ?? "",
          };
          setUserDetails(newValues);
        } else {
          setUserDetails(null);
        }
      }
    );
  };

  const fetchBanquestId = async () => {
    try {
      let banquestCustomerID: any = await getUserMeta(
        userId,
        "banquest_customer_id",
        true
      );
      if (!banquestCustomerID) {
        setIsAvailable(false);
      } else {
        setIsAvailable(true);
      }
    } catch (error) {}
  };

  const proceedWithPayment = async () => {
    let isValidationError = false;
    let validationData: any = {};

    // Validation logic for ACH payment method
    if (selectPaymentMethod == "ach") {
      validationData = {
        ...validationData,
        nameOnAccount: true,
        accountNumber: true,
        routingNumber: true,
        accountType: true,
      };

      if (!nameOnAccountInput) {
        isValidationError = true;
        validationData = { ...validationData, nameOnAccount: false };
      }

      if (!accountNumberInput) {
        isValidationError = true;
        validationData = { ...validationData, accountNumber: false };
      }

      if (!routingNumberInput) {
        isValidationError = true;
        validationData = { ...validationData, routingNumber: false };
      }

      if (!accountTypeInput) {
        isValidationError = true;
        validationData = { ...validationData, accountType: false };
      }
    }

    setValidation(validationData);

    // Switch logic for different payment methods
    switch (selectPaymentMethod) {
      case "credit-card":
        if (!ccData) {
          setTriggerCharge(true);
          return;
        }
        break;

      case "ach":
        if (!achData) {
          toast.error("Something wrong with bank details, please try again.");
          return;
        }
        break;

      default:
        if (!achData) {
          toast.error("Plaid is not authorized yet, please try again.");
          return;
        }
        break;
    }

    // Payment method type validation
    if (!paymentMethodType) {
      toast.error(
        "Something wrong with payment methods, please contact to admin"
      );
      return;
    }

    const customerPaymentData: paymentMethodDataInterface = {
      paymentMethodType:
        selectPaymentMethod === "credit-card"
          ? ("cc" as BanquestPaymentMethodTypes)
          : ("ach" as BanquestPaymentMethodTypes),
      achData: {} as AchPaymentMethodData,
      ccData: {} as CreditCardMethodData,
    };

    if (paymentMethodType == BanquestPaymentMethodTypes.ach) {
      customerPaymentData.achData = achData;
    } else if (paymentMethodType == BanquestPaymentMethodTypes.cc) {
      customerPaymentData.ccData = ccData;
    }

    // Fetch existing banquestCustomerID
    let banquestCustomerID: any = await getUserMeta(
      userId,
      "banquest_customer_id",
      true
    );
    setIsLoad(true);
    // If banquestCustomerID doesn't exist, create it via API call
    if (!banquestCustomerID) {
      try {
        const customerData = {
          customer_number: userId,
          email: userDetails ? userDetails.email : "",
          first_name: userDetails ? userDetails.firstName : "",
          last_name: userDetails ? userDetails.lastName : "",
          billing_address: {
            first_name: userDetails ? userDetails.firstName : "",
            last_name: userDetails ? userDetails.lastName : "",
            street: userDetails ? userDetails.street : "",
            street2: userDetails ? userDetails.street2 : "",
            state: userDetails ? userDetails.state : "",
            city: userDetails ? userDetails.city : "",
            zipCode: userDetails ? userDetails.zipcode : "",
            country: userDetails ? userDetails.country : "",
          },
          shipping_address: {
            first_name: userDetails ? userDetails.firstName : "",
            last_name: userDetails ? userDetails.lastName : "",
            street: userDetails ? userDetails.street : "",
            street2: userDetails ? userDetails.street2 : "",
            state: userDetails ? userDetails.state : "",
            city: userDetails ? userDetails.city : "",
            zipCode: userDetails ? userDetails.zipcode : "",
            country: userDetails ? userDetails.country : "",
          },
        };
        // API call to create a new banquest customer
        const { data: banquestCustomerData } = await rbpApiCall.post(
          "/banquest/customer",
          customerData
        );
        if (!banquestCustomerData.id) {
          toast.error("Failed to create customer ID");
          setIsLoad(false);
          return {
            status: false,
            message: "Failed to create customer ID",
          };
        }

        // Set the banquestCustomerID and update the user's meta data
        banquestCustomerID = banquestCustomerData.id;
        await updateUserMeta(
          userId,
          "banquest_customer_id",
          banquestCustomerID
        );
      } catch (error) {
        console.error("Error creating banquest customer:", error);
        toast.error("An unexpected error occurred. Please try again.");
        setIsLoad(false);
        return {
          status: false,
          message: "Error creating customer ID",
        };
      }
    }

    // Once the customer ID is available (either existing or newly created), proceed with updating the payment method
    try {
      const result: boolean = await updateUserPaymentMethod(
        userId,
        customerPaymentData
      );
      if (result) {
        setIsLoad(false);
        // toast.success(
        //   "Payment Method Changed Successfully... Now you can update your membership"
        // );
        setOpenModel(false);
        setIsUpdating(true);
        setNameOnAccountInput("");
        setAccountNumberInput("");
        setRoutingNumberInput("");
        setAccountTypeInput(undefined);
        fetchMetaData();
        fetchBanquestId();

        const requestData = await getUserMeta(
          userId,
          "banquest_payment_method_data"
        );
        const newData = JSON.parse(requestData[0].meta_value);
        const requestNewMethod = await getUserMeta(
          userId,
          "banquest_payment_method_type"
        );
        const newMethod = requestNewMethod[0].meta_value;

        const user: userDbFieldsInterface = (await getUserById(userId, [
          "user_email",
        ])) as userDbFieldsInterface;
        const data = {
          mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
          last4: `${newData && newData.last4}`,
          expiryDate: `${newData?.expiry_month}/${newData?.expiry_year}`,
          //message: "Your Payment Method Updated Sucessfully.",
        };

        const ach_data = {
          mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
          accountName: `${newData && newData?.name}`,
          last4: `${newData && newData?.last4}`,
        };

        // Send email notification after payment method update
        // const response = await sendMail(
        //   {
        //     sendTo: user.user_email,
        //     subject: "Your Payment Method Has Been Updated - RBP Club",
        //     template:
        //       newMethod === "cc"
        //         ? "updatePaymentMethodTemplate"
        //         : "updatePaymentMethodAchTemplate",
        //     context: newMethod === "cc" ? data : ach_data,
        //   },
        //   { extension: ".html", dirpath: "./EmailTemplates" }
        // );

        await sendApiEmailToUser({
          sendTo: user.user_email,
          subject: "Your Payment Method Has Been Updated - RBP Club",
          template:
            newMethod === "cc"
              ? "updatePaymentMethodTemplate"
              : "updatePaymentMethodAchTemplate",
          context: newMethod === "cc" ? data : ach_data,
          extension: ".html",
          dirpath: "public/email-templates",
        });

        try {
          setIsUpdating(true);
          const planChanged: boolean = await changeUserMembershipPlan(
            userId,
            saveId
          );
          if (planChanged) {
            fetchMembershipData(Number(saveId));
            fetchSingleUserMembership();
            const planName = getPlanName1(Number(saveId));
            const planAmount = getPlanAmount(Number(saveId));
            // values.planId = getPlanName1(plansId);

            toast.success("Plan Changed Sucessfully......");
            formik.setFieldValue("planId", saveId);
            const user: userDbFieldsInterface = (await getUserById(userId, [
              "user_email",
            ])) as userDbFieldsInterface;
            const dataTemplate = {
              mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
              planName: planName,
              newDate: `${formatDate(membership[0]?.next_payment_date)}`,
              feeAmount: planAmount,
            };
            // const response = await sendMail(
            //   {
            //     sendTo: user.user_email,
            //     subject: "Your Membership Has Been Updated - RBP Club",
            //     template: "membershipPlanUpdateTemplate",
            //     context: dataTemplate,
            //   },
            //   { extension: ".html", dirpath: "./EmailTemplates" }
            // );

            await sendApiEmailToUser({
              sendTo: user.user_email,
              subject: "Your Membership Has Been Updated - RBP Club",
              template: "membershipPlanUpdateTemplate",
              context: dataTemplate,
              extension: ".html",
              dirpath: "public/email-templates",
            });
            setIsUpdating(false);
          } else {
            toast.error("Something went wrong.Please try again later!");
            setSubmitted(false);
            setIsUpdating(false);
          }
        } catch (error) {}
      } else {
        toast.error("Something went wrong. Please try again later!");
        setIsLoad(false);
        setOpenModel(false);
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsLoad(false);
      setOpenModel(false);
    }
  };

  useEffect(() => {
    fetchMembershipData(plansId);
    fetchSingleUserMembership();
    fetchUser();
    fetchMembershipPlans();
  }, [userId, plansId]);

  useEffect(() => {
    getUserDetails();
    fetchBanquestId();
  }, []);

  useEffect(() => {
    fetchMetaData();
  }, [userId]);

  useEffect(() => {
    if (
      accountNumberInput &&
      accountTypeInput &&
      routingNumberInput &&
      accountTypeInput &&
      nameOnAccountInput
    ) {
      setAchData({
        accountNumber: accountNumberInput,
        accountType: accountTypeInput,
        routingNumber: routingNumberInput,
        nameOnAccount: nameOnAccountInput,
      });
    }
  }, [
    nameOnAccountInput,
    accountNumberInput,
    accountTypeInput,
    routingNumberInput,
  ]);

  useEffect(() => {
    if (selectPaymentMethod == "ach") {
      setPaymentMethodType(BanquestPaymentMethodTypes.ach);
    }
  }, [selectPaymentMethod]);

  useEffect(() => {
    if (!plaidAccessToken) return;
    const processPlaidToken = async () => {
      setIsLoading(true);
      await updateUserMeta(userId, "plaid_access_token", plaidAccessToken);
      if (plaidAccessToken != "") {
        const plaidAuthResponse = await rbpApiCall.post("/plaid/auth", {
          access_token: plaidAccessToken,
        });
        if (plaidAuthResponse.data) {
          const { ach_data } = plaidAuthResponse.data;
          if (ach_data.length > 0) {
            setAchData({
              accountNumber: ach_data[0].account_number,
              accountType: ach_data[0].account_type,
              nameOnAccount: ach_data[0].name,
              routingNumber: ach_data[0].routing_number,
            });
            setPaymentMethodType(BanquestPaymentMethodTypes.ach);
          }
        }
      }
      setIsLoading(false);
    };
    processPlaidToken();
  }, [plaidAccessToken]);

  useEffect(() => {
    if (triggerCharge) {
      setTriggerCharge(false);
    }
  }, [triggerCharge]);

  useEffect(() => {}, [ccData]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      planId: plansId,
    },

    validationSchema: Yup.object().shape({
      planId: Yup.string().required("Please Select Plan"),
    }),

    onSubmit: async (values) => {
      if (isAvailable === false) {
        setOpenModel(true);
        setSaveId(values.planId);
      } else {
        setOpenModel(false);

        setSubmitted(true);
        try {
          setIsUpdating(true);
          const planId = values.planId;
          const planChanged: boolean = await changeUserMembershipPlan(
            userId,
            Number(planId)
          );
          if (planChanged) {
            fetchMembershipData(Number(planId));
            fetchSingleUserMembership();
            const planName = getPlanName1(Number(planId));
            const planAmount = getPlanAmount(Number(planId));
            // values.planId = getPlanName1(plansId);

            toast.success("Plan Changed Sucessfully......");
            formik.setFieldValue("planId", planId);
            const user: userDbFieldsInterface = (await getUserById(userId, [
              "user_email",
            ])) as userDbFieldsInterface;

            const dataTemplate = {
              mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
              planName: planName,
              newDate: `${formatDate(membership[0]?.next_payment_date)}`,
              feeAmount: planAmount,
              userEmail: user.user_email
            };
            // const response = await sendMail(
            //   {
            //     sendTo: user.user_email,
            //     subject: "Your Membership Has Been Updated - RBP Club",
            //     template: "membershipPlanUpdateTemplate",
            //     context: dataTemplate,
            //   },
            //   { extension: ".html", dirpath: "./EmailTemplates" }
            // );
            await sendApiEmailToUser({
              sendTo: user.user_email,
              subject: "Your Membership Has Been Updated - RBP Club",
              template: "membershipPlanUpdateTemplate",
              context: dataTemplate,
              extension: ".html",
              dirpath: "public/email-templates",
            });
            setIsUpdating(false);
          } else {
            toast.error("Something went wrong.Please try again later!");
            setSubmitted(false);
            setIsUpdating(false);
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
  });

  return (
    <div className="user-signup-page ff-sora">
      {showSpinner && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
        </div>
      )}
      {!showSpinner && (
        <>
          {isUpdating ? (
            <>
              <LoadingIcon withOverlap={true} />
              <Col md="12" className="tab-view">
                <div className="mb-3">
                  <div className="ff-sora-semibold text-dark">
                    Membership Details
                  </div>
                  <hr className="mt-2" />
                </div>
                <Row className="mb-3">
                  <Col md="5">
                    <span className="form-label">Membership: </span>
                    <div className="f-w-600 text-dark">
                      {(membership[0]?.plan_id ?? null) == null
                        ? "-"
                        : getPlanName(membership[0]?.plan_id)}
                    </div>
                  </Col>
                  <Col md="5">
                    <span className="form-label">Status: </span>
                    <div className="f-w-600 text-dark">
                      <span>
                        {(membership[0]?.status ?? null) == null
                          ? "-"
                          : getPlanStatus(membership[0]?.status)}
                      </span>
                    </div>
                  </Col>
                </Row>
                {/* <Row>
            <Col md="8">
              
            </Col>
            <Col md="4">
             
            </Col>
          </Row> */}
                {membership[0]?.plan_id !== 4 && (
                  <Row className="mb-4">
                    <Col md="5">
                      <span className="form-label">Next Payment: </span>
                      <div className="f-w-600 text-dark">
                        {(membership[0]?.next_payment_date ?? null) == null
                          ? "-"
                          : formatDate(membership[0]?.next_payment_date)}
                      </div>
                    </Col>
                  </Row>
                )}
                {/* </CardBody> */}
                {/* </Card> */}
                {/* <Card> */}
                {/* <CommonCardHeader
              title={updateHeaderProps.title}
              span={updateHeaderProps.span}
            ></CommonCardHeader>
            <CardBody> */}
                {/* <hr /> */}
                <div className="mb-3 mt-4">
                  <div className="ff-sora-semibold text-dark">
                    Update Membership Details
                  </div>
                  <hr className="mt-2" />
                </div>
                <FormikProvider value={formik}>
                  <form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col md="5">
                        <FormGroup>
                          <Label check>Change Plan</Label>
                          <Field
                            as="select"
                            name="planId"
                            placeholder="select plan"
                            className="form-control form-select"
                          >
                            <option>{"Select Plan"}</option>
                            {(membershipPlan as MemberShipPlans[]).map(
                              (item: MemberShipPlans, index: number) => (
                                <option value={item.plan_id} key={index}>
                                  {item.plan_name +
                                    "( " +
                                    item.plan_amount +
                                    " / " +
                                    item.plan_frequency +
                                    " )"}
                                </option>
                              )
                            )}
                          </Field>
                          {formik.errors.planId &&
                            (submitted || formik.touched) && (
                              <div className="text-danger mt-2">
                                {formik.errors.planId}
                              </div>
                            )}
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="6"></Col>
                      <Col md="2">
                        <div className="text-right">
                          {/* <Button block className="btn btn-light" type="button">
                            Cancel
                          </Button> */}
                        </div>
                      </Col>
                      <Col md="2">
                        <div className="text-right">
                          <Button block color="primary" type="submit">
                            Update
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </form>
                </FormikProvider>
                {/* </CardBody>
          </Card> */}
              </Col>
            </>
          ) : (
            <>
              <Col md="12" className="tab-view">
                <div className="mb-3">
                  <div className="ff-sora-semibold text-dark">
                    Membership Details
                  </div>
                  <hr className="mt-2" />
                </div>
                <Row className="mb-3">
                  <Col md="5">
                    <span className="form-label">Membership: </span>
                    <div className="f-w-600 text-dark">
                      {(membership[0]?.plan_id ?? null) == null
                        ? "-"
                        : getPlanName(membership[0]?.plan_id)}
                    </div>
                  </Col>
                  <Col md="5">
                    <span className="form-label">Status: </span>
                    <div className="f-w-600 text-dark">
                      <span>
                        {(membership[0]?.status ?? null) == null
                          ? "-"
                          : getPlanStatus(membership[0]?.status)}
                      </span>
                    </div>
                  </Col>
                </Row>
                {/* <Row>
            <Col md="8">
              
            </Col>
            <Col md="4">
             
            </Col>
          </Row> */}
                {membership[0]?.plan_id !== 4 && (
                  <Row className="mb-4">
                    <Col md="5">
                      <span className="form-label">Next Payment: </span>
                      <div className="f-w-600 text-dark">
                        {(membership[0]?.next_payment_date ?? null) == null
                          ? "-"
                          : formatDate(membership[0]?.next_payment_date)}
                      </div>
                    </Col>
                  </Row>
                )}
                {/* </CardBody> */}
                {/* </Card> */}
                {/* <Card> */}
                {/* <CommonCardHeader
              title={updateHeaderProps.title}
              span={updateHeaderProps.span}
            ></CommonCardHeader>
            <CardBody> */}
                {/* <hr /> */}
                <div className="mb-3 mt-4">
                  <div className="ff-sora-semibold text-dark">
                    Update Membership Details
                  </div>
                  <hr className="mt-2" />
                </div>
                <FormikProvider value={formik}>
                  <form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col md="5">
                        <FormGroup>
                          <Label check>Change Plan</Label>
                          <Field
                            as="select"
                            name="planId"
                            placeholder="select plan"
                            className="form-control form-select"
                          >
                            <option>{"Select Plan"}</option>
                            {(membershipPlan as MemberShipPlans[]).map(
                              (item: MemberShipPlans, index: number) => (
                                <option value={item.plan_id} key={index}>
                                  {item.plan_name +
                                    "( " +
                                    item.plan_amount +
                                    " / " +
                                    item.plan_frequency +
                                    " )"}
                                </option>
                              )
                            )}
                          </Field>
                          {formik.errors.planId &&
                            (submitted || formik.touched) && (
                              <div className="text-danger mt-2">
                                {formik.errors.planId}
                              </div>
                            )}
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="6"></Col>
                      <Col md="2">
                        <div className="text-right">
                          {/* <Button block className="btn btn-light" type="button">
                            Cancel
                          </Button> */}
                        </div>
                      </Col>
                      <Col md="2">
                        <div className="text-right">
                          <Button block color="primary" type="submit">
                            Update
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </form>
                </FormikProvider>
                {/* </CardBody>
          </Card> */}
              </Col>
            </>
          )}
        </>
      )}

      {/* Add payment method Model */}
      <Modal
        centered
        size="lg"
        className="rbp-user-portal user-signup-page"
        isOpen={openModel}
      >
        <ModalHeader>Add your Payment Method</ModalHeader>
        <ModalBody>
          <Row className="mb-3">
            {isLoad ? (
              <>
                <LoadingIcon withOverlap={true} />
                <Col md="12">
                  <div className="payment-methods bg-light text-dark p-3 rounded-3">
                    <div className="d-flex gap-2 align-items-center mb-4">
                      <h6 className="ff-sora-medium">Payment Method</h6>
                      <hr className="m-0 flex-fill border border-1" />
                    </div>

                    <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "plaid" ? `outline-` : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => setSelectPaymentMethod("plaid")}
                      >
                        <img
                          src={`assets/images/plaid/plaid-logo-${
                            selectPaymentMethod !== "plaid" ? `blue` : "light"
                          }.svg`}
                          alt="Plaid Logo"
                        />
                        Plaid
                      </button>
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "credit-card"
                            ? `outline-`
                            : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => {
                          setSelectPaymentMethod("credit-card");
                          setTriggerCharge(true);
                        }}
                      >
                        <i className="fa fa-credit-card"></i> Credit Card
                      </button>
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "ach" ? `outline-` : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => setSelectPaymentMethod("ach")}
                      >
                        <i className="fa fa-bank"></i> Enter Bank Details
                        Manually
                      </button>
                    </div>

                    {/* Plaid Option */}
                    {selectPaymentMethod == "plaid" && (
                      <div className="payment-method-plaid">
                        <p className="mb-3">
                          <small>
                            Securely link your bank account using Plaid. Plaid
                            ensures your information is encrypted and never
                            shared without your consent.
                          </small>
                        </p>
                        {!plaidAccessToken && (
                          <>
                            <div className="d-flex gap-2 align-items-center mb-3">
                              <PlaidLinkButton
                                buttonText="Authenticate via plaid"
                                onSuccess={setPlaidAccessToken}
                                onError={(error, metadata) => {
                                  if (!error) return;
                                  toast.error(error.error_message);
                                }}
                                userID={userId}
                                cssClasses="btn btn-dark"
                                isLoading={setIsLoading}
                              />
                              {isLoading && <LoadingIcon />}
                            </div>

                            <ul className="m-0">
                              <li>
                                <small>
                                  Click 'Authenticate' to securely connect your
                                  bank account.
                                </small>
                              </li>
                              <li>
                                <small>
                                  You'll be redirected to a secure window to log
                                  in to your bank.
                                </small>
                              </li>
                            </ul>
                          </>
                        )}

                        {plaidAccessToken && !achData && isLoading && (
                          <LoadingIcon />
                        )}

                        {plaidAccessToken && achData && (
                          <>
                            <p className="ff-sora-medium">
                              <small>
                                Authorized {achData.accountType}{" "}
                                {achData.accountNumber
                                  .slice(-4)
                                  .padStart(
                                    achData.accountNumber.length,
                                    "*"
                                  )}{" "}
                                Account.
                              </small>
                            </p>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                if (confirm("Are you sure?")) {
                                  setPlaidAccessToken(undefined);
                                  setAchData(undefined);
                                }
                              }}
                            >
                              Change
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {/* EOF Plaid Option */}

                    {/* Credit Card Option */}
                    {selectPaymentMethod == "credit-card" && (
                      <div className="payment-method-credit-card">
                        <BanquestCreditCardForm
                          onTokenizationComplete={handleTokenizationComplete}
                          triggerCharge={triggerCharge}
                        />
                      </div>
                    )}
                    {/* EOF Credit Card Option */}

                    {/* Bank Details (ACH) Option */}
                    {selectPaymentMethod == "ach" && (
                      <div className="payment-method-ach">
                        <div className="row">
                          <div className="col-12 mb-3">
                            <label
                              htmlFor="accountNameInput"
                              className="form-label"
                            >
                              Name On Account
                            </label>
                            <input
                              type="text"
                              id="accountNameInput"
                              className={`form-control ${
                                validation.nameOnAccount === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="name on account"
                              value={nameOnAccountInput}
                              onChange={(e) =>
                                setNameOnAccountInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label
                              htmlFor="accountNumberInput"
                              className="form-label"
                            >
                              Account Number
                            </label>
                            <input
                              type="text"
                              id="accountNumberInput"
                              className={`form-control ${
                                validation.accountNumber === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="account number"
                              value={accountNumberInput}
                              onChange={(e) =>
                                setAccountNumberInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label
                              htmlFor="routingNumberInput"
                              className="form-label"
                            >
                              Routing Number
                            </label>
                            <input
                              type="text"
                              id="routingNumberInput"
                              className={`form-control ${
                                validation.routingNumber === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="routing number"
                              value={routingNumberInput}
                              onChange={(e) =>
                                setRoutingNumberInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label
                              htmlFor="accountTypeInput"
                              className="form-label"
                            >
                              Account Type
                            </label>
                            <select
                              id="accountTypeInput"
                              className={`form-select ${
                                validation.accountType === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              value={accountTypeInput}
                              onChange={(e) => {
                                if (
                                  e.target.value == BanquestAccountTypes.Savings
                                ) {
                                  setAccountTypeInput(
                                    BanquestAccountTypes.Savings
                                  );
                                } else if (
                                  e.target.value ==
                                  BanquestAccountTypes.Checking
                                ) {
                                  setAccountTypeInput(
                                    BanquestAccountTypes.Checking
                                  );
                                } else {
                                  setAccountTypeInput(undefined);
                                }
                              }}
                            >
                              <option value={``}>Select Account Type</option>
                              <option value={BanquestAccountTypes.Savings}>
                                Savings
                              </option>
                              <option value={BanquestAccountTypes.Checking}>
                                Checking
                              </option>
                            </select>
                          </div>
                        </div>
                        <p>
                          <small>
                            Your personal data will be used to process your
                            order, support your experience throughout this
                            website, and for other purposes described in our
                            privacy policy.
                          </small>
                        </p>
                      </div>
                    )}
                    {/* EOF Bank Details (ACH) Option */}
                  </div>
                </Col>
              </>
            ) : (
              <>
                <Col md="12">
                  <div className="payment-methods bg-light text-dark p-3 rounded-3">
                    <div className="d-flex gap-2 align-items-center mb-4">
                      <h6 className="ff-sora-medium">Payment Method</h6>
                      <hr className="m-0 flex-fill border border-1" />
                    </div>

                    <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "plaid" ? `outline-` : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => setSelectPaymentMethod("plaid")}
                      >
                        <img
                          src={`assets/images/plaid/plaid-logo-${
                            selectPaymentMethod !== "plaid" ? `blue` : "light"
                          }.svg`}
                          alt="Plaid Logo"
                        />
                        Plaid
                      </button>
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "credit-card"
                            ? `outline-`
                            : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => {
                          setSelectPaymentMethod("credit-card");
                          setTriggerCharge(true);
                        }}
                      >
                        <i className="fa fa-credit-card"></i> Credit Card
                      </button>
                      <button
                        type="button"
                        className={`btn btn-${
                          selectPaymentMethod !== "ach" ? `outline-` : ""
                        }primary flex-fill d-flex align-items-center justify-content-center gap-1`}
                        onClick={(e) => setSelectPaymentMethod("ach")}
                      >
                        <i className="fa fa-bank"></i> Enter Bank Details
                        Manually
                      </button>
                    </div>

                    {/* Plaid Option */}
                    {selectPaymentMethod == "plaid" && (
                      <div className="payment-method-plaid">
                        <p className="mb-3">
                          <small>
                            Securely link your bank account using Plaid. Plaid
                            ensures your information is encrypted and never
                            shared without your consent.
                          </small>
                        </p>
                        {!plaidAccessToken && (
                          <>
                            <div className="d-flex gap-2 align-items-center mb-3">
                              <PlaidLinkButton
                                buttonText="Authenticate via plaid"
                                onSuccess={setPlaidAccessToken}
                                onError={(error, metadata) => {
                                  if (!error) return;
                                  toast.error(error.error_message);
                                }}
                                userID={userId}
                                cssClasses="btn btn-dark"
                                isLoading={setIsLoading}
                              />
                              {isLoading && <LoadingIcon />}
                            </div>

                            <ul className="m-0">
                              <li>
                                <small>
                                  Click 'Authenticate' to securely connect your
                                  bank account.
                                </small>
                              </li>
                              <li>
                                <small>
                                  You'll be redirected to a secure window to log
                                  in to your bank.
                                </small>
                              </li>
                            </ul>
                          </>
                        )}

                        {plaidAccessToken && !achData && isLoading && (
                          <LoadingIcon />
                        )}

                        {plaidAccessToken && achData && (
                          <>
                            <p className="ff-sora-medium">
                              <small>
                                Authorized {achData.accountType}{" "}
                                {achData.accountNumber
                                  .slice(-4)
                                  .padStart(
                                    achData.accountNumber.length,
                                    "*"
                                  )}{" "}
                                Account.
                              </small>
                            </p>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => {
                                if (confirm("Are you sure?")) {
                                  setPlaidAccessToken(undefined);
                                  setAchData(undefined);
                                }
                              }}
                            >
                              Change
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {/* EOF Plaid Option */}

                    {/* Credit Card Option */}
                    {selectPaymentMethod == "credit-card" && (
                      <div className="payment-method-credit-card">
                        <BanquestCreditCardForm
                          onTokenizationComplete={handleTokenizationComplete}
                          triggerCharge={triggerCharge}
                        />
                      </div>
                    )}
                    {/* EOF Credit Card Option */}

                    {/* Bank Details (ACH) Option */}
                    {selectPaymentMethod == "ach" && (
                      <div className="payment-method-ach">
                        <div className="row">
                          <div className="col-12 mb-3">
                            <label
                              htmlFor="accountNameInput"
                              className="form-label"
                            >
                              Name On Account
                            </label>
                            <input
                              type="text"
                              id="accountNameInput"
                              className={`form-control ${
                                validation.nameOnAccount === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="name on account"
                              value={nameOnAccountInput}
                              onChange={(e) =>
                                setNameOnAccountInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label
                              htmlFor="accountNumberInput"
                              className="form-label"
                            >
                              Account Number
                            </label>
                            <input
                              type="text"
                              id="accountNumberInput"
                              className={`form-control ${
                                validation.accountNumber === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="account number"
                              value={accountNumberInput}
                              onChange={(e) =>
                                setAccountNumberInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label
                              htmlFor="routingNumberInput"
                              className="form-label"
                            >
                              Routing Number
                            </label>
                            <input
                              type="text"
                              id="routingNumberInput"
                              className={`form-control ${
                                validation.routingNumber === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              placeholder="routing number"
                              value={routingNumberInput}
                              onChange={(e) =>
                                setRoutingNumberInput(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label
                              htmlFor="accountTypeInput"
                              className="form-label"
                            >
                              Account Type
                            </label>
                            <select
                              id="accountTypeInput"
                              className={`form-select ${
                                validation.accountType === false
                                  ? `is-invalid`
                                  : ``
                              }`}
                              value={accountTypeInput}
                              onChange={(e) => {
                                if (
                                  e.target.value == BanquestAccountTypes.Savings
                                ) {
                                  setAccountTypeInput(
                                    BanquestAccountTypes.Savings
                                  );
                                } else if (
                                  e.target.value ==
                                  BanquestAccountTypes.Checking
                                ) {
                                  setAccountTypeInput(
                                    BanquestAccountTypes.Checking
                                  );
                                } else {
                                  setAccountTypeInput(undefined);
                                }
                              }}
                            >
                              <option value={``}>Select Account Type</option>
                              <option value={BanquestAccountTypes.Savings}>
                                Savings
                              </option>
                              <option value={BanquestAccountTypes.Checking}>
                                Checking
                              </option>
                            </select>
                          </div>
                        </div>
                        <p>
                          <small>
                            Your personal data will be used to process your
                            order, support your experience throughout this
                            website, and for other purposes described in our
                            privacy policy.
                          </small>
                        </p>
                      </div>
                    )}
                    {/* EOF Bank Details (ACH) Option */}
                  </div>
                </Col>
              </>
            )}
          </Row>
        </ModalBody>
        <ModalFooter>
          <div className="text-right">
            <button
              type="button"
              className="btn btn-primary"
              onClick={proceedWithPayment}
            >
              Add Payment
            </button>
          </div>
          <div className="text-right">
            <button
              onClick={() => setOpenModel(false)}
              className="btn btn-outline-secondary"
            >
              Close
            </button>
          </div>
        </ModalFooter>
      </Modal>
      {/* EOF Add payment method Model */}
    </div>
  );
};

export default UserMembership;
