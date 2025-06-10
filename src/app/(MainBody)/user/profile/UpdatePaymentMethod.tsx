"use client";

import React, { useEffect, useRef, useState } from "react";
import { FormCallbackProp } from "@/Types/TabType";
import { getUserMeta, getUserById, userDbFieldsInterface } from "@/DbClient";
import {
  Card,
  CardBody,
  Col,
  Row,
  Button,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import {
  paymentMethodDataInterface,
  updateUserMeta,
  updateUserPaymentMethod,
} from "@/DbClient/users";
import { toast } from "react-toastify";
import { Field } from "formik";
import {
  BanquestAccountTypes,
  BanquestPaymentMethodTypes,
  BanquestSecCode,
} from "@/app/api/banquest/banquestConfig";
import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import plaidImg from "../../../../../public/assets/images/plaid/plaidImg.jpeg";
import { createPlaidLinkToken } from "@/Helper/plaidHelper";
import { usePlaidLink } from "react-plaid-link";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import { sendMail } from '@/Helper/mailSender';

declare global {
  interface Window {
    HostedTokenization: any;
  }
}

const UpdatePaymentMethod: React.FC<FormCallbackProp> = ({
  callbackActive,
}) => {
  const userId = localStorage.getItem("userId") as string;
  const [values, setValues] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const cardFormRef = useRef<any>(null);
  //const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [routingNumber, setRoutingNumber] = useState<string>("");
  const [account, setAccount] = useState<string>("");
  const [methodType, setMethodType] = useState<string>("");
  const [selectAch, setSelectAch] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [plaidAccessToken, setPlaidAccessToken] = useState<string | null>(null);
  const [plaidData, setPlaidData] = useState<any>();
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const headerProps: CommonCardHeaderProp = {
    title: "Payment Details",
    // span: [
    //     { text: "Check Current membership details." }
    // ]
  };

  // const getPlaidLinkToken = async () => {
  //   if (userId != "") {
  //     const linkToken = await createPlaidLinkToken(userId);
  //     if (linkToken) setPlaidLinkToken(linkToken);
  //   }
  // };

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

  const plaidSuccess = async (accessToken: string) => {
    console.log("Access Token:", accessToken);
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

  // const { open: plaidLinkOpen, ready: plaidLinkReady } = usePlaidLink({
  //   token: plaidLinkToken!,
  //   onSuccess: plaidOnSuccess,
  // });

  const updatePlaidAccessTokenToUser = async () => {
    if (plaidAccessToken !== null) {
      await updateUserMeta(userId, "plaid_access_token", plaidAccessToken);
      fetchMetaData()
    }
  };

  const updateHeaderProps: CommonCardHeaderProp = {
    title: "Update Card Details",
    span: [{ text: "Update card details." }],
  };

  const fetchMetaData = async () => {
    try {
      const result = await getUserMeta(userId, "banquest_payment_method_data");
      const result1 = await getUserMeta(userId, "banquest_payment_method_type");

      if ((result && result[0]) || (result1 && result1[0])) {
        //setShowSpinner(false)
        setValues(JSON.parse(result[0].meta_value));
        setMethodType(result1[0].meta_value);
      }
    } catch (error) {
      console.error("Error fetching meta data:", error);
    }
  };

  useEffect(() => {
    updatePlaidAccessTokenToUser();
  }, [plaidAccessToken]);

  useEffect(() => {
    fetchMetaData();
    //getPlaidLinkToken();
  }, [userId]);

  function handleChangeEvent(event: any) {
    setErrorMessage(event.error || "");
  }

  function clearCardDiv() {
    if (cardFormRef.current) {
      document.getElementById("formContainer")?.remove();
      const newDiv = document.createElement("div");
      newDiv.id = "formContainer";
      document.getElementById("cardDetails")?.appendChild(newDiv);
      cardFormRef.current = undefined;
    }
  }

  function createCardDiv() {
    const formContainer = document.getElementById("formContainer");
    if (formContainer) {
      const hostedTokenization: any = new window.HostedTokenization(
        process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY
      );
      cardFormRef.current = hostedTokenization
        .create("card-form")
        .mount("#formContainer")
        .on("change", handleChangeEvent);
      return () => {
        clearCardDiv();
      };
    }
  }
  useEffect(() => {
    if (values || selectedValue) {
      createCardDiv();
    }
  }, [values, selectedValue]);

  const handleUpdatePayment = async () => {
    try {
      const customerData: paymentMethodDataInterface = {
        paymentMethodType:
          selectedValue === "cc"
            ? ("cc" as BanquestPaymentMethodTypes)
            : ("ach" as BanquestPaymentMethodTypes),
        achData: {} as AchPaymentMethodData,
        ccData: {} as CreditCardMethodData,
        // nonceToken: nonce,
        // expiryMonth: expiryMonth,
        // expiryYear: expiryYear,
        // nameOnCreditCard: "",
      };
      if (selectedValue === "cc") {
        if (cardFormRef.current) {
          const cardFormData = await cardFormRef.current.getNonceToken();

          const { nonce, expiryMonth, expiryYear } = cardFormData;
          customerData.ccData = {
            creditCardNonceToken: nonce,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear,
            nameOnAccount: "",
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
            nameOnAccount: name,
            routingNumber: routingNumber,
            accountNumber: account,
            accountType: type as BanquestAccountTypes,
            secCode: "PPD" as BanquestSecCode,
          };
        }
      }
      const result: boolean = await updateUserPaymentMethod(
        userId,
        customerData
      );

      if (result) {
        toast.success("Payment Method Changed Sucessfully......");
        clearCardDiv();
        setName("");
        setRoutingNumber("");
        setAccount("");
        setType("");
        fetchMetaData();
        const user: userDbFieldsInterface = await getUserById(userId, ["user_email"]) as userDbFieldsInterface;
        const data = {
          mainHeading: "Payment Method Update",
          message: "Your Payment Method Updated Sucessfully."
        }
        const response = await sendMail({
          sendTo: user.user_email,
          subject: 'Payment Method Update',
          template: 'updatePaymentMethodTemplate',
          context: data
        },{ extension: '.html',dirpath: './EmailTemplates' })
      } else {
        toast.error("Something went wrong.Please try again later!");
        clearCardDiv();
        createCardDiv();
      }
    } catch (error) {
      toast.error("Something went wrong.Please try again later!");
      clearCardDiv();
      createCardDiv();
    }
  };

  if (values === null) {
    return (
      <div>
        <h5>No payment details available.</h5>
      </div>
    );
  }

  return (
    <>
      <Col md="12">
        <div className="mb-3">
          <h3>Payment Details:</h3>
        </div>
        {/* <Card className="light-card">
          <CommonCardHeader
            title={headerProps.title}
            span={headerProps.span}
          ></CommonCardHeader>
          <CardBody> */}
        {methodType === "ach" ? (
          <>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Name: </span>
              </Col>
              <Col md="4">
                <div className="text-right">{values && values.name}</div>
              </Col>
            </Row>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Account type: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.account_type}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">
                  Payment method type:{" "}
                </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.payment_method_type}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Routing number: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.routing_number}
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Card last4: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {`*****${values && values.last4}`}
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Card type: </span>
              </Col>
              <Col md="4">
                <div className="text-right">{values && values.card_type}</div>
              </Col>
            </Row>
            <Row>
              <Col md="8">
                <span className="text-truncate f-w-600">Expiry Date: </span>
              </Col>
              <Col md="4">
                <div className="text-right">
                  {values && values.expiry_month}/{values && values.expiry_year}
                </div>
              </Col>
            </Row>
          </>
        )}
        {/* </CardBody>
        </Card> */}
        {/* <Card>
          <CommonCardHeader
            title={updateHeaderProps.title}
            span={updateHeaderProps.span}
          ></CommonCardHeader>
          <CardBody> */}
        <hr />
        <div className="mb-3 mt-3">
          <h3>Update Card Details:</h3>
        </div>
        <Row>
          <FormGroup>
            <Label>Select payment method</Label>
            <Input
              className="form-control"
              style={{
                fontSize: "medium",
                color: "black",
              }}
              type="select"
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              name="paymentMethod"
            >
              <option value="">{"Select action"}</option>
              <option value="cc">{"Card"}</option>
              <option value="ach">{"ACH"}</option>
            </Input>
          </FormGroup>
          {selectedValue === "cc" && (
            <>
              <div className="mt-3">
                <div id="cardDetails">
                  <div id="formContainer"></div>
                </div>
              </div>
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
                      <span style={{ color: "white" }}>Connect to </span>

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
                        setIsActive(false);
                      }}
                      className={`${selectAch ? "selected" : "hoverSelected"}`}
                      style={{ height: "48px", width: "100%" }}
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
                  <Label className="col-form-label">{"Name on account"}</Label>
                  <Input
                    name="nameOnAccount"
                    type="text"
                    className="form-control"
                    required
                    placeholder="Name on account"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ fontSize: "medium", color: "black" }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label className="col-form-label">{"Account number"}</Label>
                  <Input
                    name="accountNumber"
                    type="text"
                    className="form-control"
                    required
                    placeholder="Account Number"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    style={{ fontSize: "medium", color: "black" }}
                  />
                </FormGroup>
                <FormGroup>
                  <Label className="col-form-label">{"Routing number"}</Label>
                  <Input
                    name="routingNumber"
                    type="text"
                    className="form-control"
                    required
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Routing Number"
                    style={{ fontSize: "medium", color: "black" }}
                  />
                </FormGroup>

                <FormGroup>
                  <Row className="g-2">
                    <Col sm="12">
                      <Label className="pt-0 col-form-label">
                        {"Account type"}
                      </Label>
                      <Input
                        type="select"
                        className="form-control"
                        name="accountType"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        required
                        style={{
                          fontSize: "medium",
                          color: "black",
                        }}
                      >
                        <option value={""}>{"Select account type"}</option>
                        <option value={"checking"}>{"Checking"}</option>
                        <option value={"savings"}>{"Savings"}</option>
                      </Input>
                    </Col>
                  </Row>
                </FormGroup>
              </>
            )}
          {/* <div className="mt-3">
                <div id="cardDetails">
                  <div id="formContainer"></div>
                </div>
              </div> */}
        </Row>
        <Row>
          <Col md="10"></Col>
          <Col md="2">
            <div className="text-right">
              <Button
                block
                color="primary"
                type="button"
                onClick={handleUpdatePayment}
              >
                Update
              </Button>
            </div>
          </Col>
        </Row>
        {/* </CardBody>
        </Card> */}
      </Col>
    </>
  );
};

export default UpdatePaymentMethod;
