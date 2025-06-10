"use client";
import {
  AlreadyHaveAnAccount,
  AuthSignIn,
  CreateYourAccount,
  EnterYourPersonalDetailsToCreateAccount,
  ImagePath,
} from "@/Constant";
import { SignupProp } from "@/Types/AuthType";
import { Field, useFormik, FormikProvider } from "formik";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Input,
  Button,
  Col,
  FormGroup,
  Label,
  Row,
  Container,
  Spinner,
} from "reactstrap";
import {
  dbClient,
  getMembershipPlans,
  getUserRole,
} from "@/../../src/DbClient/index";
import {
  signUpCustomer,
  CustomerData,
  SignUpResponse,
  AchPaymentMethodData,
  CreditCardMethodData,
} from "@/Helper/customers";
import { userUpdateDataInterface } from "@/DbClient/users";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { updateUser, updateUserMeta } from "@/DbClient";
import { State } from "country-state-city";
import {
  BanquestAccountTypes,
  BanquestPaymentMethodTypes,
  BanquestSecCode,
} from "@/app/api/banquest/banquestConfig";
import * as Yup from "yup";
import plaidImg from "../../../../../public/assets/images/plaid/plaidImg.jpeg";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { usePlaidLink } from "react-plaid-link";
import { createPlaidLinkToken } from "@/Helper/plaidHelper";
import "./subscribe.css";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";

declare global {
  interface Window {
    HostedTokenization: any;
  }
}

const SubscribeForm: React.FC<SignupProp> = ({ logoClass }) => {
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState("");
  const [disableSubscribeButton, setDisableSubscribeButton] = useState(false);
  const cardFormRef = useRef<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const [membershipPlan, setMembershipPlan] = useState<any>([]);
  const [usStates, setUsStates] = useState<any>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [type, SetType] = useState<string>("");
  //const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string | null>(null);
  const [selectAch, setSelectAch] = useState<boolean>(false);
  const [isActive, setIsActive] = useState(false);
  const [plaidData, setPlaidData] = useState<any>();
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  // const getPlaidLinkToken = async () => {
  //   if (userId != "") {
  //     const linkToken = await createPlaidLinkToken(userId);
  //     if (linkToken) setPlaidLinkToken(linkToken);
  //   }
  // };

  const fetchUserRole = async (userId: string) => {
    try {
      const role: any = await getUserRole(userId);
      return role;
    } catch (error) {
      console.log("Error fetching user role:", error);
      return null;
    }
  };

  // const plaidOnSuccess = async (public_token: string) => {
  //   try {
  //     const response = await rbpApiCall.post("/plaid/exchange-token", {
  //       public_token,
  //     });
  //     const accessToken = response.data.access_token;
  //     setPlaidAccessToken(accessToken);

  //     const authResponse = await rbpApiCall.post("/plaid/auth", {
  //       access_token: accessToken,
  //     });

  //     if (authResponse.data.ach_data) {
  //       console.log("ACH Bank Details", authResponse.data.ach_data);
  //       const firstAchData = authResponse.data.ach_data[0];
  //       setPlaidData(firstAchData);
  //     }
  //   } catch (error) {
  //     console.error("Error exchanging public token:", error);
  //   }
  // };

  // const { open: plaidLinkOpen, ready: plaidLinkReady } = usePlaidLink({
  //   token: plaidLinkToken!,
  //   onSuccess: plaidOnSuccess,
  // });

  const plaidSuccess = async (accessToken: string) => {
    //console.log("Access Token:", accessToken);
    if (accessToken) {
      setPlaidAccessToken(accessToken);
      const authResponse = await rbpApiCall.post("/plaid/auth", {
        access_token: accessToken,
      });

      if (authResponse.data.ach_data) {
        console.log("ACH Bank Details", authResponse.data.ach_data);
        const firstAchData = authResponse.data.ach_data[0];
        setPlaidData(firstAchData);
      }
    }
  };

  const plaidError = (error: any, metadata: any) => {
    console.log("Plaid Error", error);
    console.log("Plaid Metadata", metadata);
    if (error) {
      toast.error(
        error.display_message ? error.display_message : "Something went wrong"
      );
    }
  };

  const updatePlaidAccessTokenToUser = async () => {
    if (plaidAccessToken !== null) {
      await updateUserMeta(userId, "plaid_access_token", plaidAccessToken);
    }
  };

  useEffect(() => {
    updatePlaidAccessTokenToUser();
  }, [plaidAccessToken]);

  useEffect(() => {
    const allStates = State.getStatesOfCountry("US");
    setUsStates(allStates);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://tokenization.sandbox.banquestgateway.com/tokenization/v0.2";
    script.async = true;
    script.onload = () => {
      const hostedTokenization = new window.HostedTokenization(
        process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY
      );
      cardFormRef.current = hostedTokenization
        .create("card-form")
        .mount("#formContainer")
        .on("change", handleChangeEvent);
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      if (cardFormRef.current) {
        document.getElementById("formContainer")?.remove();
        cardFormRef.current = undefined;
      }
    };
  }, [selectedValue]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // Remove the '#' and parse

      const access_token = params.get("access_token");
      // const refresh_token = params.get("refresh_token");
      // const expires_in = params.get("expires_in");
      if (access_token) {
        dbClient.auth.getUser(access_token).then(({ data, error }) => {
          if (error) {
            console.error("Error fetching user:", error);
          } else {
            const user = data.user;
            localStorage.setItem("userId", user.id);
            if (user?.id) {
              setUserId(user?.id);
            }
          }
        });
      }
    }
  }, []);

  const formikStepTwo = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      street: "",
      street2: "",
      state: "",
      city: "",
      zip: "",
      country: "USA",
      cardNumber: "",
      cardExpiration: "",
      membershipPlanId: 1,
      nameOnAccount: "",
      routingNumber: "",
      accountNumber: "",
      paymentMethod: "",
      accountType: "",
    },
    validationSchema: Yup.object().shape({
      first_name: Yup.string().required("First Name is required"),
      last_name: Yup.string().required("Last Name is required"),
      street: Yup.string().required("Street is required"),
      state: Yup.string().required("State is required"),
      city: Yup.string().required("City is required"),
      zip: Yup.string().required("Zip is required"),
      paymentMethod: Yup.string().required("Payment Method is required"),
      nameOnAccount: Yup.string().when("paymentMethod", {
        is: (paymentMethod: string) => paymentMethod && paymentMethod === "ach",
        then: (schema) => schema.required("Name on Account is required"),
        otherwise: (schema) => schema,
      }),
      routingNumber: Yup.string().when("paymentMethod", {
        is: (paymentMethod: string) => paymentMethod && paymentMethod === "ach",
        then: (schema) => schema.required("Routing Number is required"),
        otherwise: (schema) => schema,
      }),
      accountNumber: Yup.string().when("paymentMethod", {
        is: (paymentMethod: string) => paymentMethod && paymentMethod === "ach",
        then: (schema) => schema.required("Account Number is required"),
        otherwise: (schema) => schema,
      }),
      accountType: Yup.string().when("paymentMethod", {
        is: (paymentMethod: string) => paymentMethod && paymentMethod === "ach",
        then: (schema) => schema.required("Account Type is required"),
        otherwise: (schema) => schema,
      }),
    }),
    onSubmit: async (values) => {
      setDisableSubscribeButton(true);
      try {
        const getId = localStorage.getItem("userId");

        const customerData: CustomerData = {
          userId: getId ? getId : "",
          membershipPlanId: Number(values.membershipPlanId),
          address: {
            city: values.city,
            country: values.country,
            state: values.state,
            street: values.street,
            street2: values.street2,
            zipCode: values.zip,
            firstName: values.first_name,
            lastName: values.last_name,
          },
          paymentMethodType:
            selectedValue === "cc"
              ? ("cc" as BanquestPaymentMethodTypes)
              : ("ach" as BanquestPaymentMethodTypes),
          achData: {} as AchPaymentMethodData,
          ccData: {} as CreditCardMethodData,
          // creditCardNonceToken: nonce,
          // expiryMonth: expiryMonth,
          // expiryYear: expiryYear,
        };

        if (selectedValue === "cc") {
          if (cardFormRef.current) {
            const cardFormData = await cardFormRef.current.getNonceToken();
            const { nonce, expiryMonth, expiryYear } = cardFormData;
            if (!nonce || !expiryMonth || !expiryYear) {
              toast.error("Please check card details are filled properly.");
              setErrorMessage("Something is wrong, please try again");
              return;
            }
            customerData.ccData = {
              creditCardNonceToken: nonce,
              expiryMonth: expiryMonth,
              expiryYear: expiryYear,
            };
          }
        } else if (selectedValue === "ach") {
          if (isActive === true) {
            customerData.achData = {
              nameOnAccount: plaidData && plaidData.name,
              routingNumber: plaidData && plaidData.routing_number,
              accountNumber: plaidData && plaidData.account_number,
              accountType:
                plaidData && (plaidData.account_type as BanquestAccountTypes),
              secCode: plaidData && (plaidData.sec_code as BanquestSecCode),
            };
          } else if (isActive === false) {
            customerData.achData = {
              nameOnAccount: values.nameOnAccount,
              routingNumber: values.routingNumber,
              accountNumber: values.accountNumber,
              accountType: type as BanquestAccountTypes,
              secCode: "PPD" as BanquestSecCode,
            };
          }
        }
        const userData: userUpdateDataInterface = {
          firstName: values.first_name,
          lastName: values.last_name,
        };
        Promise.all([
          updateUser(userId, userData),
          updateUserMeta(userId, "city", values.city),
          updateUserMeta(userId, "street", values.street),
          updateUserMeta(userId, "street2", values.street2),
          updateUserMeta(userId, "state", values.state),
          //updateUserMeta(userId, "country", values.country),
          updateUserMeta(userId, "zip_code", values.zip),
          signUpCustomer(customerData),
        ]).finally(() => {
          dbClient.auth.getSession().then(async (value) => {
            if (
              (value.data.session ?? null) != null &&
              value.data.session?.user != null
            ) {
              localStorage.setItem(
                "authToken",
                value.data.session?.access_token || ""
              );
              localStorage.setItem(
                "refreshToken",
                value.data.session?.refresh_token || ""
              );
              localStorage.setItem(
                "expires_at",
                (value.data.session?.expires_at ?? 0).toString()
              );
              localStorage.setItem("userId", value.data.session.user.id);

              // const role = await getUserRole(value.data.session.user.id);
              const role = await fetchUserRole(value.data.session.user.id);
              localStorage.setItem("userRole", role);
              setSubmitted(false);
              if (role === "admin") {
                toast.success(
                  "Register Sucessfully. Redirecting to your dashboard.."
                );
                router.push("/admin/admin_dashboard");
              } else {
                toast.success(
                  "Register Sucessfully. Redirecting to your dashboard.."
                );
                router.push("/pages/dashboard");
              }
            } else {
              toast.error("Something went wrong.Please login", {
                toastId: "error1",
              });
              router.push("/auth/login");
              setSubmitted(false);
            }
          });
        });
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        setDisableSubscribeButton(false);
      }
    },
  });

  const handlePaymentMethodChanges = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const methodType = e.target.value;
    setSelectedValue(methodType);
    formikStepTwo.setFieldValue("paymentMethod", methodType);
  };

  const handleAccountTypeChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    const accountType = e.target.value;
    SetType(accountType);
    formikStepTwo.setFieldValue("accountType", accountType);
  };

  const fetchMemberShipPlans = async () => {
    try {
      const result = await getMembershipPlans();
      setMembershipPlan(result);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMemberShipPlans();
  }, []);

  function handleChangeEvent(event: any) {
    setErrorMessage(event.error || "");
  }

  return (
    <Container fluid className="p-0">
      <Row>
        <Col sm="12">
          <div className="login-card login-card-main login-dark">
            <div>
              <div>
                <Link
                  className={`logo logoSetup ${logoClass}`}
                  href={`/others/authentication/registersimple`}
                >
                  <img
                    className="img-fluid for-light"
                    src={`${ImagePath}/logo/logoBlue.png`}
                    alt="looginpage"
                  />
                  <img
                    className="img-fluid for-dark"
                    src={`${ImagePath}/logo/logo_dark.png`}
                    alt="looginpage"
                  />
                  <h2 className="textSetup">RBP Club</h2>
                </Link>
              </div>
              <div className="login-main">
                <FormikProvider value={formikStepTwo}>
                  <form
                    className="theme-form"
                    onSubmit={formikStepTwo.handleSubmit}
                  >
                    <h4>{CreateYourAccount}</h4>
                    <p>{EnterYourPersonalDetailsToCreateAccount}</p>
                    <FormGroup>
                      <Input
                        type="select"
                        className={`digits btn-square`}
                        value={formikStepTwo.values.membershipPlanId}
                        name="membershipPlanId"
                        onChange={formikStepTwo.handleChange}
                        style={{ fontSize: "medium", color: "black" }}
                      >
                        <option value="">Select Plan</option>
                        {membershipPlan && membershipPlan.length > 0 ? (
                          membershipPlan.map((item: any, index: number) => (
                            <option key={index} value={item.plan_id}>
                              {(item.plan_name as string).replace(
                                "RBP Club Membership",
                                ""
                              )}{" "}
                              ({item.plan_amount} / {item.plan_frequency})
                            </option>
                          ))
                        ) : (
                          <option disabled>
                            No membership plans available
                          </option>
                        )}
                      </Input>
                    </FormGroup>
                    <FormGroup>
                      <Row className="g-2">
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"First Name"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            className="form-control"
                            type="text"
                            name="first_name"
                            placeholder="First Name"
                            style={{ fontSize: "medium", color: "black" }}
                          />
                          {formikStepTwo.errors.first_name && submitted && (
                            <div className="text-danger mt-2">
                              {formikStepTwo.errors.first_name}
                            </div>
                          )}
                        </Col>
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"Last Name"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            className="form-control"
                            type="text"
                            name="last_name"
                            placeholder="Last Name"
                            style={{ fontSize: "medium", color: "black" }}
                          />
                          {formikStepTwo.errors.last_name && submitted && (
                            <div className="text-danger mt-2">
                              {formikStepTwo.errors.last_name}
                            </div>
                          )}
                        </Col>
                      </Row>
                    </FormGroup>
                    <FormGroup>
                      <Label className="col-form-label">
                        {"Street"}
                        <span className="txt-danger">*</span>
                      </Label>
                      <Field
                        name="street"
                        type="text"
                        className="form-control"
                        placeholder="Street"
                        style={{ fontSize: "medium", color: "black" }}
                      />
                      {formikStepTwo.errors.street && submitted && (
                        <div className="text-danger mt-2">
                          {formikStepTwo.errors.street}
                        </div>
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label className="col-form-label">{"Street 2"}</Label>
                      <Field
                        name="street2"
                        type="text"
                        className="form-control"
                        placeholder="Street 2"
                        style={{ fontSize: "medium", color: "black" }}
                      />
                      {/* {errors.street2 && touched.street2 && (
                        <div className="text-danger mt-2">{errors.street2}</div>
                      )} */}
                    </FormGroup>
                    <FormGroup>
                      <Row className="g-2">
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"State"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            as="select"
                            name="state"
                            className="form-select"
                            style={{
                              backgroundColor: "#f3f3ff",
                              borderColor: "#2a6198",
                              borderStyle: "dashed",
                              fontSize: "medium",
                              color: "black",
                            }}
                          >
                            <option>{"Select State"}</option>
                            {usStates.map((state: any) => (
                              <option key={state.isoCode} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </Field>
                          {/* <Input
                            type="select"
                            className="form-control"
                            name="state"
                            style={{
                              fontSize: "medium",
                              color: "black",
                              backgroundColor: "#f3f3ff",
                              borderColor: "#2a6198",
                              borderStyle: "dashed",
                            }}
                          >
                            <option>{"Select State"}</option>
                            {usStates.map((state: any) => (
                              <option key={state.isoCode} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </Input> */}
                          {formikStepTwo.errors.state && submitted && (
                            <div className="text-danger mt-2">
                              {formikStepTwo.errors.state}
                            </div>
                          )}
                          {/* <Field
                            className="form-control"
                            type="text"
                            name="state"
                            required
                            placeholder="State"
                            style={{ fontSize: "medium", color: "black" }}
                          /> */}
                          {/* {errors.state && touched.state && (
                            <div className="text-danger mt-2">{errors.state}</div>
                          )} */}
                        </Col>
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"City"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            className="form-control"
                            type="text"
                            name="city"
                            placeholder="City"
                            style={{ fontSize: "medium", color: "black" }}
                          />
                          {formikStepTwo.errors.city && submitted && (
                            <div className="text-danger mt-2">
                              {formikStepTwo.errors.city}
                            </div>
                          )}
                        </Col>
                      </Row>
                    </FormGroup>
                    <FormGroup>
                      <Row className="g-2">
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"Zip"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            className="form-control"
                            type="text"
                            name="zip"
                            placeholder="Zip"
                            style={{ fontSize: "medium", color: "black" }}
                          />
                          {formikStepTwo.errors.zip && submitted && (
                            <div className="text-danger mt-2">
                              {formikStepTwo.errors.zip}
                            </div>
                          )}
                        </Col>
                        <Col sm="6">
                          <Label className="pt-0 col-form-label">
                            {"Country"}
                            <span className="txt-danger">*</span>
                          </Label>
                          <Field
                            className="form-control"
                            type="text"
                            name="country"
                            readOnly
                            placeholder="Country"
                            style={{ fontSize: "medium", color: "black" }}
                          />
                        </Col>
                      </Row>
                    </FormGroup>
                    <FormGroup>
                      <Label>Select payment method</Label>
                      <Field
                        as="select"
                        name="paymentMethod"
                        value={formikStepTwo.values.paymentMethod}
                        className="form-select"
                        onChange={handlePaymentMethodChanges}
                        style={{
                          backgroundColor: "#f3f3ff",
                          borderColor: "#2a6198",
                          borderStyle: "dashed",
                          fontSize: "medium",
                          color: "black",
                        }}
                      >
                        <option value="">{"Select Action"}</option>
                        <option value="cc">{"Card"}</option>
                        <option value="ach">{"ACH"}</option>
                      </Field>
                      {/* <Input
                        className="form-control"
                        style={{
                          fontSize: "medium",
                          color: "black",
                          backgroundColor: "#f3f3ff",
                          borderColor: "#2a6198",
                          borderStyle: "dashed",
                        }}
                        type="select"
                        value={selectedValue}
                        onChange={(e) => setSelectedValue(e.target.value)}
                        name="paymentMethod"
                      >
                        <option value="">{"Select Action"}</option>
                        <option value="cc">{"Card"}</option>
                        <option value="ach">{"ACH"}</option>
                      </Input> */}
                      {formikStepTwo.errors.paymentMethod && submitted && (
                        <div className="text-danger mt-2">
                          {formikStepTwo.errors.paymentMethod}
                        </div>
                      )}
                    </FormGroup>
                    {selectedValue === "cc" && (
                      <>
                        <div id="formContainer"></div>
                      </>
                    )}

                    {selectedValue === "ach" && (
                      <>
                        <Row className="mt-2">
                          <Col sm="6">
                            <FormGroup>
                              {/* <button
                                onClick={() => {
                                  setIsActive(true);
                                  setSelectAch(false);
                                  plaidLinkOpen();
                                }}
                                type="button"
                                disabled={!plaidLinkReady}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "5px 5px",
                                  backgroundColor: "black",
                                  border: "2px solid",
                                  borderRadius: "5px",
                                  width: "100%",
                                }}
                              >
                                <span style={{ color: "white" }}>
                                  Connect to{" "}
                                </span>

                                <img
                                  src={plaidImg.src}
                                  alt="Plaid logo"
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    marginRight: "8px",
                                  }}
                                />
                                <span style={{ color: "white" }}>Plaid</span>
                              </button> */}
                              <PlaidLinkButton
                                userID={userId as string}
                                buttonText={"Connect to"}
                                onSuccess={plaidSuccess}
                                onError={plaidError}
                                isLoading={setLoadingStatus}
                              />
                            </FormGroup>
                          </Col>
                          <Col sm="6">
                            <FormGroup>
                              <Button
                                color={`${selectAch ? "primary" : "light"}`}
                                onClick={() => {
                                  setSelectAch(true);
                                  setLoadingStatus(false);
                                }}
                                className={`${
                                  selectAch ? "selected" : "hoverSelected"
                                }`}
                                style={{ height: "48px" }}
                                type="button"
                              >
                                <span>Add ACH Details</span>
                              </Button>
                            </FormGroup>
                          </Col>
                        </Row>
                      </>
                    )}
                    {selectAch === true &&
                      selectedValue !== "cc" &&
                      loadingStatus === false && (
                        <>
                          <FormGroup>
                            <Label className="col-form-label">
                              {"Name on account"}
                            </Label>
                            <Field
                              name="nameOnAccount"
                              type="text"
                              className="form-control"
                              placeholder="Name on account"
                              style={{ fontSize: "medium", color: "black" }}
                            />
                            {formikStepTwo.errors.nameOnAccount &&
                              submitted && (
                                <div className="text-danger mt-2">
                                  {formikStepTwo.errors.nameOnAccount}
                                </div>
                              )}
                          </FormGroup>
                          <FormGroup>
                            <Label className="col-form-label">
                              {"Account number"}
                            </Label>
                            <Field
                              name="accountNumber"
                              type="text"
                              className="form-control"
                              placeholder="Account Number"
                              style={{ fontSize: "medium", color: "black" }}
                            />
                            {formikStepTwo.errors.accountNumber &&
                              submitted && (
                                <div className="text-danger mt-2">
                                  {formikStepTwo.errors.accountNumber}
                                </div>
                              )}
                            {/* {formikStepTwo.touched.accountNumber &&
                            formikStepTwo.errors.accountNumber && (
                              <div className="invalid-feedback">
                                {formikStepTwo.errors.accountNumber}
                              </div>
                            )} */}
                          </FormGroup>
                          <FormGroup>
                            <Label className="col-form-label">
                              {"Routing number"}
                            </Label>
                            <Field
                              name="routingNumber"
                              type="text"
                              className="form-control"
                              placeholder="Routing Number"
                              style={{ fontSize: "medium", color: "black" }}
                            />
                            {formikStepTwo.errors.routingNumber &&
                              submitted && (
                                <div className="text-danger mt-2">
                                  {formikStepTwo.errors.routingNumber}
                                </div>
                              )}
                            {/* {formikStepTwo.touched.routingNumber &&
                            formikStepTwo.errors.routingNumber && (
                              <div className="invalid-feedback">
                                {formikStepTwo.errors.routingNumber}
                              </div>
                            )} */}
                          </FormGroup>

                          <FormGroup>
                            <Row className="g-2">
                              <Col sm="12">
                                <Label className="pt-0 col-form-label">
                                  {"Account type"}
                                </Label>
                                <Field
                                  as="select"
                                  name="accountType"
                                  value={type}
                                  className="form-select"
                                  onChange={handleAccountTypeChanges}
                                  style={{
                                    backgroundColor: "#f3f3ff",
                                    borderColor: "#2a6198",
                                    borderStyle: "dashed",
                                    fontSize: "medium",
                                    color: "black",
                                  }}
                                >
                                  <option value={""}>
                                    {"Select account type"}
                                  </option>
                                  <option value={"checking"}>
                                    {"Checking"}
                                  </option>
                                  <option value={"savings"}>{"Savings"}</option>
                                </Field>
                                {formikStepTwo.errors.accountType &&
                                  submitted && (
                                    <div className="text-danger mt-2">
                                      {formikStepTwo.errors.accountType}
                                    </div>
                                  )}
                                {/* <Input
                                  type="select"
                                  className="form-control"
                                  name="accountType"
                                  value={type}
                                  onChange={(e) => SetType(e.target.value)}
                                  required
                                  style={{
                                    fontSize: "medium",
                                    color: "black",
                                    backgroundColor: "#f3f3ff",
                                    borderColor: "#2a6198",
                                    borderStyle: "dashed",
                                  }}
                                >
                                  <option value={""}>
                                    {"Select account type"}
                                  </option>
                                  <option value={"checking"}>
                                    {"Checking"}
                                  </option>
                                  <option value={"savings"}>{"Savings"}</option>
                                </Input> */}
                              </Col>
                            </Row>
                          </FormGroup>
                        </>
                      )}
                    {/* <div id="formContainer"></div> */}
                    <FormGroup className="mt-4">
                      <Button
                        disabled={disableSubscribeButton}
                        block
                        color="primary"
                        type="submit"
                        onClick={() => setSubmitted(true)}
                        className="w-100"
                      >
                        {disableSubscribeButton ? (
                          <Spinner style={{ height: "30px" }} />
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </FormGroup>

                    <p className="mt-4 mb-0 text-center">
                      {AlreadyHaveAnAccount}
                      <Link className="ms-2" href={`/auth/login`}>
                        {AuthSignIn}
                      </Link>
                    </p>
                  </form>
                </FormikProvider>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default SubscribeForm;
