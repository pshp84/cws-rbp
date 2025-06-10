"use client";

import BanquestCreditCardForm from "@/CommonComponent/BanquestCreditCardForm";
import PlaidLinkButton from "@/CommonComponent/PlaidLinkButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import SignUpPlans from "@/Components/Applications/SignUp/SignUpPlans";
import { affiliatesDBInterface, getAffiliateByReferralCode, getMembershipPlan, updateUserMeta } from "@/DbClient";
import { toast } from "react-toastify";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { priceFormat } from "@/Helper/commonHelpers";
import { State } from "country-state-city";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { AchPaymentMethodData, CreditCardMethodData } from "@/Helper/customers";
import { BanquestAccountTypes, BanquestPaymentMethodTypes } from "@/app/api/banquest/banquestConfig";
import { getReferralCode } from "@/utils/Referral";

interface SignUpPayment {
    paymentBtnAction: (customerData: {
        city: string,
        state: string,
        country: string,
        street: string,
        street2?: string,
        zipCode: string,
        ccData?: CreditCardMethodData,
        achData?: AchPaymentMethodData,
        paymentMethodType: BanquestPaymentMethodTypes,
        planData?: any | undefined
    } | undefined) => void;
    selectedPlan: number;
    onChangeSelectedPlan: (newPlanID: number) => void;
    userID: string;
    userData: {
        firstName: string,
        lastName: string,
        email: string,
        password: string
    } | undefined;
}

const SignUpPayment: React.FC<SignUpPayment> = (props) => {
    const { paymentBtnAction, selectedPlan, onChangeSelectedPlan, userID, userData } = props;
    const [selectPaymentMethod, setSelectPaymentMethod] = useState<string>("plaid");
    const [triggerCharge, setTriggerCharge] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [planData, setPlanData] = useState<any>({});
    const [statesList, setStatesList] = useState<Array<any>>([]);
    const [street, setStreet] = useState<string>();
    const [street2, setStreet2] = useState<string>();
    const [state, setState] = useState<string>();
    const [city, setCity] = useState<string>();
    const [zipCode, setZipCode] = useState<string>();
    const [country, setCountry] = useState<string>("United States");
    const [plaidAccessToken, setPlaidAccessToken] = useState<string>();
    const [achData, setAchData] = useState<AchPaymentMethodData | undefined>();
    const [paymentMethodType, setPaymentMethodType] = useState<BanquestPaymentMethodTypes | undefined>();
    const [ccData, setCcData] = useState<CreditCardMethodData | undefined>();
    const [plansModal, setPlansModal] = useState(false);
    const [nameOnAccountInput, setNameOnAccountInput] = useState<string>();
    const [accountNumberInput, setAccountNumberInput] = useState<string>();
    const [routingNumberInput, setRoutingNumberInput] = useState<string>();
    const [accountTypeInput, setAccountTypeInput] = useState<BanquestAccountTypes | undefined>();
    const [referralCodeInput, setReferralCodeInput] = useState<string>("");
    const [referralCodeApplied, setReferralCodeApplied] = useState<string>("");
    const [referralCodeMessage, setReferralCodeMessage] = useState<string>("");
    const [referralCodeMessageType, setReferralCodeMessageType] = useState<boolean>(true);
    const [affiliateData, setAffiliateData] = useState<affiliatesDBInterface | boolean>(true);
    const referralCodeLs = getReferralCode();

    const [validation, setValidation] = useState<any>({
        street: true,
        state: true,
        city: true,
        zipCode: true,
        nameOnAccount: true,
        accountNumber: true,
        routingNumber: true,
        accountType: true,
        referralCode: true
    });

    const plansModalToggle = () => setPlansModal(!plansModal);

    const handleTokenizationComplete = async (token: string, expiryMonth: number, expiryYear: number) => {
        setPaymentMethodType(BanquestPaymentMethodTypes.cc)
        setCcData({
            creditCardNonceToken: token,
            expiryMonth: expiryMonth,
            expiryYear: expiryYear
        });
    };

    const fetchPlanData = async () => {
        setIsLoading(true)
        const data = await getMembershipPlan(selectedPlan);
        if (!data) {
            setIsLoading(false);
            toast.error("Something is wrong! please try again.");
            return;
        }
        setPlanData(data);
        setIsLoading(false);
    }

    const payNowBtnHandler = async () => {
        // Validation process
        if (!paymentTerms) return;

        let isValidationError = false;
        let validationData: any = {
            street: true,
            state: true,
            city: true,
            zipCode: true
        };

        if (!street) {
            isValidationError = true;
            validationData = { ...validationData, street: false };
        }

        if (!state) {
            isValidationError = true;
            validationData = { ...validationData, state: false };
        }

        if (!city) {
            isValidationError = true;
            validationData = { ...validationData, city: false };
        }

        if (!zipCode) {
            isValidationError = true;
            validationData = { ...validationData, zipCode: false };
        }

        if (selectPaymentMethod == "ach") {
            validationData = {
                ...validationData,
                nameOnAccount: true,
                accountNumber: true,
                routingNumber: true,
                accountType: true
            }

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

        if (isValidationError || !selectPaymentMethod) {
            toast.warning("Some fields are missing or incorrect. Check and try again.");
            return;
        }
        // EOF Validation process

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
            toast.error("Something wrong with payment methods, please contact to admin.");
            return;
        }

        const actionData: any = {
            street,
            street2,
            state,
            city,
            country,
            zipCode,
            paymentMethodType,
            planData
        }

        if (referralCodeApplied && affiliateData) actionData.referralData = {
            referralCode: referralCodeApplied,
            affiliateData: affiliateData
        };

        if (paymentMethodType == BanquestPaymentMethodTypes.ach) {
            actionData.achData = achData
        } else if (paymentMethodType == BanquestPaymentMethodTypes.cc) {
            actionData.ccData = ccData
        }

        paymentBtnAction(actionData);
    }

    const removeReferralCode = () => {
        setValidation({ ...validation, referralCode: true });
        setReferralCodeMessageType(true);
        setReferralCodeMessage("");
        setReferralCodeInput("");
        setReferralCodeApplied("");
    }

    const applyReferralCode = async (referralCode = "") => {
        if (referralCode == "") {
            let isValidationError = false;
            let validationData: any = {
                referralCode: true
            };

            if (!referralCodeInput) {
                isValidationError = true;
                validationData = { ...validation, referralCode: false };
            }

            setValidation(validationData);

            if (isValidationError) {
                return;
            }
            // EOF Validation process

            referralCode = referralCodeInput;
        } else {
            setReferralCodeInput(referralCode);
        }

        setIsLoading(true);
        const affilateData = await getAffiliateByReferralCode(referralCode);
        if (typeof affilateData === "boolean") {
            setValidation({ ...validation, referralCode: false });
            setReferralCodeMessageType(false);
            setReferralCodeMessage("Invalid referral code");
            setReferralCodeApplied("");
            setIsLoading(false);
            return;
        }
        setReferralCodeMessageType(true);
        setReferralCodeMessage("Success! Your referral code has been applied. You've unlocked an extra free period on your selected plan. Enjoy your benefits!");
        setReferralCodeApplied(referralCode);
        setAffiliateData(affilateData);
        setIsLoading(false);
    }

    useEffect(() => {
        if (accountNumberInput && accountTypeInput && routingNumberInput && accountTypeInput && nameOnAccountInput) {
            setAchData({
                accountNumber: accountNumberInput,
                accountType: accountTypeInput,
                routingNumber: routingNumberInput,
                nameOnAccount: nameOnAccountInput
            });
        }
    }, [nameOnAccountInput, accountNumberInput, accountTypeInput, routingNumberInput])

    useEffect(() => {
        if (selectPaymentMethod == "ach") {
            setPaymentMethodType(BanquestPaymentMethodTypes.ach)
        }
    }, [selectPaymentMethod])

    useEffect(() => {
        payNowBtnHandler();
    }, [ccData]);

    useEffect(() => {
        if (referralCodeLs && typeof referralCodeLs != "boolean") {
            applyReferralCode(referralCodeLs);
        }
    }, [referralCodeLs]);

    useEffect(() => {
        if (!plaidAccessToken) return;
        const processPlaidToken = async () => {
            setIsLoading(true);
            await updateUserMeta(userID, 'plaid_access_token', plaidAccessToken);
            if (plaidAccessToken != "") {
                const plaidAuthResponse = await rbpApiCall.post("/plaid/auth", {
                    access_token: plaidAccessToken
                });
                if (plaidAuthResponse.data) {
                    const { ach_data } = plaidAuthResponse.data;
                    if (ach_data.length > 0) {
                        setAchData({
                            accountNumber: ach_data[0].account_number,
                            accountType: ach_data[0].account_type,
                            nameOnAccount: ach_data[0].name,
                            routingNumber: ach_data[0].routing_number
                        });
                        setPaymentMethodType(BanquestPaymentMethodTypes.ach)
                    }
                }
            }
            setIsLoading(false);
        }
        processPlaidToken();
    }, [plaidAccessToken])

    useEffect(() => {
        const stateData = State.getStatesOfCountry("US");
        setStatesList(stateData);
    }, [])

    useEffect(() => {
        fetchPlanData();
    }, [selectedPlan]);

    useEffect(() => {
        if (triggerCharge) {
            setTriggerCharge(false);
        }
    }, [triggerCharge])

    return <form className="signup-payment-step row">
        <div className="col-md-8">
            <h3 className="mb-5 f-w-500">Secure your spot with a seamless <br />payment experience.</h3>

            {/* Billing Address */}
            <div className="billing-address">
                <div className="d-flex gap-2 align-items-center mb-4">
                    <h6 className="ff-sora-medium">Billing Address</h6>
                    <hr className="m-0 flex-fill border border-1" />
                </div>
                <div className="row mb-2">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="streetInput" className="form-label">Street</label>
                        <input
                            type="text"
                            id="streetInput"
                            className={`form-control ${(validation.street === false) ? `is-invalid` : ``}`}
                            placeholder="street"
                            value={street}
                            onChange={e => setStreet(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="street2Input" className="form-label">Street2 (optional)</label>
                        <input
                            type="text"
                            id="street2Input"
                            className="form-control"
                            placeholder="street2"
                            value={street2}
                            onChange={e => setStreet2(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="stateInput" className="form-label">State</label>
                        <select
                            id="stateInput"
                            className={`form-select ${(validation.state === false) ? `is-invalid` : ``}`}
                            value={state}
                            onChange={e => setState(e.target.value)}
                        >
                            <option value="">Select State</option>
                            {statesList.length > 0 &&
                                statesList.map((data, index) => {
                                    return <option key={`option-states-${index}`} value={data.name}>{data.name}</option>
                                })
                            }
                        </select>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="cityInput" className="form-label">City</label>
                        <input
                            type="text"
                            id="cityInput"
                            className={`form-control ${(validation.city === false) ? `is-invalid` : ``}`}
                            placeholder="city"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="zipCodeInput" className="form-label">Zip Code</label>
                        <input
                            type="text"
                            id="zipCodeInput"
                            className={`form-control ${(validation.zipCode === false) ? `is-invalid` : ``}`}
                            placeholder="zip Code"
                            value={zipCode}
                            onChange={e => setZipCode(e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="countryInput" className="form-label">Country</label>
                        <input type="text" id="countryInput" className="form-control" placeholder="country" value={`United States`} readOnly />
                    </div>
                </div>
            </div>
            {/* EOF Billing Address */}

            {/* Payment Methods */}
            <div className="payment-methods bg-light text-dark p-3 rounded-3">
                <div className="d-flex gap-2 align-items-center mb-4">
                    <h6 className="ff-sora-medium">Payment Method</h6>
                    <hr className="m-0 flex-fill border border-1" />
                </div>

                <div className="d-flex flex-column flex-lg-row justify-content-lg-center justify-content-start align-items-lg-center gap-2 mb-3">
                    <button
                        type="button"
                        className={`btn btn-${(selectPaymentMethod !== "plaid") ? `outline-` : ''}primary flex-fill d-flex justify-content-start align-items-center justify-content-lg-center gap-1 w-100`}
                        onClick={e => {
                            e.preventDefault();
                            setSelectPaymentMethod("plaid");
                        }}
                    >
                        <img src={`assets/images/plaid/plaid-logo-${(selectPaymentMethod !== "plaid") ? `blue` : 'light'}.svg`} alt="Plaid Logo" />Plaid
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${(selectPaymentMethod !== "credit-card") ? `outline-` : ''}primary flex-fill d-flex justify-content-start align-items-center justify-content-lg-center gap-1 w-100`}
                        onClick={e => {
                            e.preventDefault();
                            setSelectPaymentMethod("credit-card");
                            setTriggerCharge(true);
                        }}
                    >
                        <i className="fa fa-credit-card"></i> Credit Card
                    </button>
                    <button
                        type="button"
                        className={`btn btn-${(selectPaymentMethod !== "ach") ? `outline-` : ''}primary flex-fill d-flex justify-content-start align-items-center justify-content-lg-center gap-1 w-100`}
                        onClick={e => {
                            e.preventDefault();
                            setSelectPaymentMethod("ach");
                        }}
                    >
                        <i className="fa fa-bank"></i> Bank Details
                    </button>
                </div>

                {/* Plaid Option */}
                {selectPaymentMethod == "plaid" &&
                    <div className="payment-method-plaid">
                        <p className="mb-3"><small>Securely link your bank account using Plaid. Plaid ensures your information is encrypted and never shared without your consent.</small></p>
                        {!plaidAccessToken &&
                            <>
                                <div className="d-flex gap-2 align-items-center mb-3">
                                    <PlaidLinkButton
                                        buttonText="Authenticate via plaid"
                                        onSuccess={setPlaidAccessToken}
                                        onError={(error, metadata) => {
                                            if (!error) return;
                                            toast.error(error.error_message)
                                        }}
                                        userID={userID}
                                        cssClasses="btn btn-dark"
                                        isLoading={setIsLoading}
                                    />
                                    {isLoading && <LoadingIcon />}
                                </div>

                                <ul className="m-0">
                                    <li><small>Click 'Authenticate' to securely connect your bank account.</small></li>
                                    <li><small>You'll be redirected to a secure window to log in to your bank.</small></li>
                                </ul>
                            </>
                        }

                        {(plaidAccessToken && !achData && isLoading) && <LoadingIcon />}

                        {(plaidAccessToken && achData) &&
                            <>
                                <p className="ff-sora-medium"><small>Authorized {achData.accountType} {achData.accountNumber.slice(-4).padStart(achData.accountNumber.length, '*')} Account.</small></p>
                                <button type="button" className="btn btn-primary" onClick={() => {
                                    if (confirm("Are you sure?")) {
                                        setPlaidAccessToken(undefined);
                                        setAchData(undefined);
                                    }
                                }}>Change</button>
                            </>
                        }
                    </div>
                }
                {/* EOF Plaid Option */}

                {/* Credit Card Option */}
                {selectPaymentMethod == "credit-card" &&
                    <div className="payment-method-credit-card">
                        <BanquestCreditCardForm
                            onTokenizationComplete={handleTokenizationComplete}
                            triggerCharge={triggerCharge}
                        />
                    </div>
                }
                {/* EOF Credit Card Option */}

                {/* Bank Details (ACH) Option */}
                {selectPaymentMethod == "ach" &&
                    <div className="payment-method-ach">
                        <div className="row">
                            <div className="col-12 mb-3">
                                <label htmlFor="accountNameInput" className="form-label">Name On Account</label>
                                <input
                                    type="text"
                                    id="accountNameInput"
                                    className={`form-control ${(validation.nameOnAccount === false) ? `is-invalid` : ``}`}
                                    placeholder="name on account"
                                    value={nameOnAccountInput}
                                    onChange={e => setNameOnAccountInput(e.target.value)}
                                />
                            </div>
                            <div className="col-12 mb-3">
                                <label htmlFor="accountNumberInput" className="form-label">Account Number</label>
                                <input
                                    type="text"
                                    id="accountNumberInput"
                                    className={`form-control ${(validation.accountNumber === false) ? `is-invalid` : ``}`}
                                    placeholder="account number"
                                    value={accountNumberInput}
                                    onChange={e => setAccountNumberInput(e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="routingNumberInput" className="form-label">Routing Number</label>
                                <input
                                    type="text"
                                    id="routingNumberInput"
                                    className={`form-control ${(validation.routingNumber === false) ? `is-invalid` : ``}`}
                                    placeholder="routing number"
                                    value={routingNumberInput}
                                    onChange={e => setRoutingNumberInput(e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="accountTypeInput" className="form-label">Account Type</label>
                                <select
                                    id="accountTypeInput"
                                    className={`form-select ${(validation.accountType === false) ? `is-invalid` : ``}`}
                                    value={accountTypeInput}
                                    onChange={e => {
                                        if (e.target.value == BanquestAccountTypes.Savings) {
                                            setAccountTypeInput(BanquestAccountTypes.Savings)
                                        } else if (e.target.value == BanquestAccountTypes.Checking) {
                                            setAccountTypeInput(BanquestAccountTypes.Checking)
                                        } else {
                                            setAccountTypeInput(undefined);
                                        }
                                    }}
                                >
                                    <option value={``}>Select Account Type</option>
                                    <option value={BanquestAccountTypes.Savings}>Savings</option>
                                    <option value={BanquestAccountTypes.Checking}>Checking</option>
                                </select>
                            </div>
                        </div>
                        <p><small>Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.</small></p>
                    </div>
                }
                {/* EOF Bank Details (ACH) Option */}

            </div>
            {/* EOF Payment Methods */}

        </div>
        {/* Payment Summary Section */}
        <div className="col-md-4 position-relative">
            <div className="payment-summary-section bg-light p-3 rounded-3 sticky-top">
                {isLoading && <LoadingIcon withOverlap={true} />}

                {planData &&
                    <>
                        <div className="payment-summary-title d-flex justify-content-between align-items-center mb-4">
                            <h4 className="m-0 ff-sora-bold">Summary</h4>
                            <button type="button" className="text-primary bg-transparent border-0" onClick={plansModalToggle}><i className="fa fa-pencil"></i> Edit</button>
                        </div>
                        <div className="payment-summary mb-4">
                            <div className="d-flex justify-content-between align-items-center border-bottom border-primary border-dashed pb-3 mb-3 ff-sora-medium">
                                <div className="name">{planData.plan_name}</div>
                                <div className="value">{`${priceFormat(planData.plan_amount)}/${planData.plan_frequency}`}</div>
                            </div>
                            <div className="border-bottom border-primary border-dashed pb-3 mb-3">
                                <div className="d-flex justify-content-between gap-2 align-items-center">
                                    <input
                                        type="text"
                                        className={`form-control form-control-sm py-1 border ${(validation.referralCode === false) && `is-invalid`}`}
                                        placeholder="Referral Code"
                                        onChange={e => setReferralCodeInput(e.target.value)}
                                        value={referralCodeInput}
                                        readOnly={referralCodeApplied ? true : false}
                                    />
                                    {!referralCodeApplied &&
                                        <button
                                            className="btn btn-primary py-1"
                                            type="button"
                                            onClick={e => applyReferralCode()}
                                        >Apply</button>
                                    }

                                    {referralCodeApplied !== "" &&
                                        <button
                                            className="btn btn-danger py-1"
                                            type="button"
                                            onClick={e => removeReferralCode()}
                                        ><i className="fa fa-trash"></i></button>
                                    }
                                </div>
                                {referralCodeMessage &&
                                    <p className={`mb-0 mt-2 ${referralCodeMessageType ? `text-success` : `text-danger`}`} style={{ fontSize: "12px" }}>{referralCodeMessage}</p>
                                }

                            </div>
                            {/* <div className="d-flex justify-content-between align-items-center mb-3 ff-sora-medium">
                                <div className="name">Taxes</div>
                                <div className="value">$6</div>
                            </div> */}
                            <div className="d-flex justify-content-between align-items-center border-bottom border-primary border-dashed pb-3 ff-sora-bold h5 mb-0">
                                <div className="name">Total</div>
                                <div className="value">{priceFormat(planData.plan_amount)}</div>
                            </div>
                        </div>
                        <button type="button" className="btn btn-primary btn-lg w-100 mb-4" onClick={payNowBtnHandler} disabled={!paymentTerms}>Pay Now</button>

                        <div className="d-flex gap-2">
                            <div><input type="checkbox" onChange={e => setPaymentTerms(!paymentTerms)} checked={paymentTerms} /></div>
                            <p><b>Payment Terms:</b> Your contract and monthly billing will commence 30 days after placing your order and will remain active for 12 months. You can cancel anytime in accordance with our <Link href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL ?? `https://www.rentersbp.com/contact`} target="_blank">Cancellation Terms</Link>. If not canceled, your plan will automatically renew for additional 12-month periods at the prevailing rates.</p>
                        </div>
                    </>
                }
            </div>
        </div>
        {/* EOF Payment Summary Section */}
        {/* Select Plan Model */}
        <Modal isOpen={plansModal} toggle={plansModalToggle} size="lg">
            <ModalHeader toggle={plansModalToggle}>Select Plan</ModalHeader>
            <ModalBody>
                <div className="rbp-user-portal">
                    <SignUpPlans planId={selectedPlan} onSelectedPlan={data => {
                        setPlansModal(false);
                        onChangeSelectedPlan(data);
                    }} />
                </div>
            </ModalBody>
        </Modal>
        {/* EOF Select Plan Model */}
    </form>;
}

export default SignUpPayment;