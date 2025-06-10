"use client";

import React, { useEffect, useState } from "react";
import { getUserMeta, getUserById, userDbFieldsInterface } from "@/DbClient";
import { Col, Row, Button } from "reactstrap";
import {
  paymentMethodDataInterface,
  updateUserMeta,
  updateUserPaymentMethod,
} from "@/DbClient/users";
import { toast } from "react-toastify";
import {
  BanquestAccountTypes,
  BanquestPaymentMethodTypes,
} from "@/app/api/banquest/banquestConfig";
import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import { sendMail } from "@/Helper/mailSender";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import BanquestCreditCardForm from "@/CommonComponent/BanquestCreditCardForm";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";

declare global {
  interface Window {
    HostedTokenization: any;
  }
}

const UpdatePaymentMethod = () => {
  const userId = localStorage.getItem("userId") as string;
  const [values, setValues] = useState<any>(null);
  const [methodType, setMethodType] = useState<string>("");
  //new states for payment
  const [selectPaymentMethod, setSelectPaymentMethod] =
    useState<string>("plaid");
  const [triggerCharge, setTriggerCharge] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [achData, setAchData] = useState<AchPaymentMethodData | undefined>();
  const [plaidAccessToken, setPlaidAccessToken] = useState<string>();
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
  const [name, setName] = useState<any>("");

  const [validation, setValidation] = useState<any>({
    nameOnAccount: true,
    accountNumber: true,
    routingNumber: true,
    accountType: true,
  });

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
  const fetchMetaData = async () => {
    try {
      const result = await getUserMeta(userId, "banquest_payment_method_data");
      const result1 = await getUserMeta(userId, "banquest_payment_method_type");
      const result2 = await getUserById(userId);

      if ((result && result[0]) || (result1 && result1[0]) || result2) {
        //setShowSpinner(false)
        setValues(JSON.parse(result[0].meta_value));
        setMethodType(result1[0].meta_value);
        setName(result2);
      }
    } catch (error) {
      console.error("Error fetching meta data:", error);
    }
  };
  const proceedWithPayment = async () => {
    let isValidationError = false;
    let validationData: any = {};

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

    if (!paymentMethodType) {
      toast.error(
        "Something wrong with payment methods, please contact to admin"
      );
      return;
    }

    const customerData: paymentMethodDataInterface = {
      paymentMethodType:
        selectPaymentMethod === "credit-card"
          ? ("cc" as BanquestPaymentMethodTypes)
          : ("ach" as BanquestPaymentMethodTypes),
      achData: {} as AchPaymentMethodData,
      ccData: {} as CreditCardMethodData,
    };

    if (paymentMethodType == BanquestPaymentMethodTypes.ach) {
      customerData.achData = achData;
    } else if (paymentMethodType == BanquestPaymentMethodTypes.cc) {
      customerData.ccData = ccData;
    }
    const result: boolean = await updateUserPaymentMethod(userId, customerData);
    if (result) {
      toast.success("Payment Method Changed Sucessfully......");
      await fetchMetaData();
      setNameOnAccountInput("");
      setAccountNumberInput("");
      setRoutingNumberInput("");
      setAccountTypeInput(undefined);

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
        userEmail: user.user_email
        //message: "Your Payment Method Updated Sucessfully.",
      };
      const ach_data = {
        mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
        accountName: `${newData && newData?.name}`,
        last4: `${newData && newData?.last4}`,
        userEmail: user.user_email
      };
      // const response = await sendMail(
      //   {
      //     sendTo: user.user_email,
      //     subject: "Your Payment Method Has Been Updated - RBP Club",
      //     template: newMethod === "cc" ?  "updatePaymentMethodTemplate" : 'updatePaymentMethodAchTemplate',
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
    } else {
      toast.error("Something went wrong.Please try again later!");
    }
  };

  useEffect(() => {
    fetchMetaData();
  }, []);

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

  return (
    <div className="user-signup-page ff-sora signup-payment-step tab-view">
      <Col md="12">
        {values !== null && (
          <div className="mb-3">
            <div className="ff-sora-semibold text-dark">Payment Details</div>
            <hr className="mt-2" />
          </div>
        )}
        {/* <Card className="light-card">
          <CommonCardHeader
            title={headerProps.title}
            span={headerProps.span}
          ></CommonCardHeader>
          <CardBody> */}
        {methodType === "ach" ? (
          <>
            <Row className="mb-3">
              {/* <Col md="8">
                <span className="text-truncate f-w-600">Name: </span>
              </Col>
              <Col md="4">
                <div className="text-right">{values && values.name}</div>
              </Col> */}
              <Col md="5">
                <span className="form-label">Name: </span>
                <div className="text-right text-dark">
                  {values && values.name}
                </div>
              </Col>
              <Col md="5">
                <span className="form-label">Account type: </span>
                <div className="text-right text-dark">
                  {values && values.account_type}
                </div>
              </Col>
            </Row>
            {/* <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Account type: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.account_type}
                </div>
              </Col>
            </Row> */}
            <Row className="mb-3">
              <Col md="5">
                <span className="form-label">Payment method type: </span>
                <div className="text-right text-dark">
                  {values && values.payment_method_type}
                </div>
              </Col>
              <Col md="5">
                <span className="form-label">Routing number: </span>
                <div className="text-right text-dark">
                  {values && values.routing_number}
                </div>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md="5">
                <span className="form-label">Acoount Number: </span>
                <div className="text-right text-dark">
                  {`*****${values && values.last4}`}
                </div>
              </Col>
            </Row>
          </>
        ) : methodType === "cc" ? (
          <>
            <Row className="mb-3">
              <Col md="5">
                <span className="form-label">Card type: </span>
                <div className="text-right text-dark">
                  {values && values.card_type}
                </div>
              </Col>
              <Col md="5">
                <span className="form-label">Expiry Date: </span>
                <div className="text-right text-dark">
                  {values && values.expiry_month}/{values && values.expiry_year}
                </div>
              </Col>
            </Row>
            {/* <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Expiry Date: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.expiry_month}/{values && values.expiry_year}
                </div>
              </Col>
            </Row> */}
          </>
        ) : (
          ""
        )}
        {/* </CardBody>
        </Card> */}
        {/* <Card>
          <CommonCardHeader
            title={updateHeaderProps.title}
            span={updateHeaderProps.span}
          ></CommonCardHeader>
          <CardBody> */}

        <div className="mb-3 mt-3">
          <div className="ff-sora-semibold text-dark">
            Update Payment Method:
          </div>
          <hr className="mt-2" />
        </div>

        {/* Payment Methods */}
        <Row className="mb-3">
          <Col md="8">
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
                    selectPaymentMethod !== "credit-card" ? `outline-` : ""
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
                  <i className="fa fa-bank"></i> Enter Bank Details Manually
                </button>
              </div>

              {/* Plaid Option */}
              {selectPaymentMethod == "plaid" && (
                <div className="payment-method-plaid">
                  <p className="mb-3">
                    <small>
                      Securely link your bank account using Plaid. Plaid ensures
                      your information is encrypted and never shared without
                      your consent.
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
                            Click 'Authenticate' to securely connect your bank
                            account.
                          </small>
                        </li>
                        <li>
                          <small>
                            You'll be redirected to a secure window to log in to
                            your bank.
                          </small>
                        </li>
                      </ul>
                    </>
                  )}

                  {plaidAccessToken && !achData && isLoading && <LoadingIcon />}

                  {plaidAccessToken && achData && (
                    <>
                      <p className="ff-sora-medium">
                        <small>
                          Authorized {achData.accountType}{" "}
                          {achData.accountNumber
                            .slice(-4)
                            .padStart(achData.accountNumber.length, "*")}{" "}
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
                      <label htmlFor="accountNameInput" className="form-label">
                        Name On Account
                      </label>
                      <input
                        type="text"
                        id="accountNameInput"
                        className={`form-control ${
                          validation.nameOnAccount === false ? `is-invalid` : ``
                        }`}
                        placeholder="name on account"
                        value={nameOnAccountInput}
                        onChange={(e) => setNameOnAccountInput(e.target.value)}
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
                          validation.accountNumber === false ? `is-invalid` : ``
                        }`}
                        placeholder="account number"
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value)}
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
                          validation.routingNumber === false ? `is-invalid` : ``
                        }`}
                        placeholder="routing number"
                        value={routingNumberInput}
                        onChange={(e) => setRoutingNumberInput(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="accountTypeInput" className="form-label">
                        Account Type
                      </label>
                      <select
                        id="accountTypeInput"
                        className={`form-select ${
                          validation.accountType === false ? `is-invalid` : ``
                        }`}
                        value={accountTypeInput}
                        onChange={(e) => {
                          if (e.target.value == BanquestAccountTypes.Savings) {
                            setAccountTypeInput(BanquestAccountTypes.Savings);
                          } else if (
                            e.target.value == BanquestAccountTypes.Checking
                          ) {
                            setAccountTypeInput(BanquestAccountTypes.Checking);
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
                      Your personal data will be used to process your order,
                      support your experience throughout this website, and for
                      other purposes described in our privacy policy.
                    </small>
                  </p>
                </div>
              )}
              {/* EOF Bank Details (ACH) Option */}
            </div>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md="7"></Col>

          <Col md="2">
            {/* <div className="text-right">
              <Button block className="btn btn-light" type="button">
                Cancel
              </Button>
            </div> */}
          </Col>
          <Col md="2">
            <div className="text-right">
              <Button onClick={proceedWithPayment} block color="primary">
                Update
              </Button>
            </div>
          </Col>
        </Row>
      </Col>
    </div>
  );
};

export default UpdatePaymentMethod;
