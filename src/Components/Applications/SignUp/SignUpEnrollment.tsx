"use client";

import TurnstileWrapper from "@/CommonComponent/TurnstileWrapper";
import { validateEmail, validatePassword } from "@/Helper/commonHelpers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface SignUpEnrollment {
  proceedBtnAction: (userData: any) => void;
  backBtnAction: (previousStep: string) => void;
  //resetTurnstile?: number;
  disableBackBtn?: boolean;
  userSignUpData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phoneNumber?: number;
  };
}

const SignUpEnrollment: React.FC<SignUpEnrollment> = (props) => {
  const {
    proceedBtnAction,
    backBtnAction,
    userSignUpData,
    disableBackBtn = false,
    //resetTurnstile = 0,
  } = props;
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [firstName, setFirstName] = useState<string>();
  const [lastName, setLastName] = useState<string>();
  const [email, setEmail] = useState<string>();
  const [emailOptIn, setEmailOptIn] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<number>();
  const [phoneNumberOptIn, setPhoneNumberOptIn] = useState<boolean>(false);
  const [password, setPassword] = useState<string>();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordValidation, setPasswordValidation] = useState<Array<string>>(
    []
  );
  const [confirmPassword, setConfirmPassword] = useState<string>();
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [validation, setValidation] = useState<any>({
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phoneNumber
  });

  const formHandler = (e: any) => {
    e.preventDefault();

    // if (!turnstileToken) {
    //   toast.error("Please complete the CAPTCHA.");
    //   return;
    // }

    let isError: boolean = false;
    let validationError = validation;

    if (!firstName || firstName == "") {
      isError = true;
      validationError = { ...validationError, firstName: false };
    }

    if (!lastName || lastName == "") {
      isError = true;
      validationError = { ...validationError, lastName: false };
    }

    if (!email || email == "") {
      isError = true;
      validationError = { ...validationError, email: false };
    } else if (!validateEmail(email)) {
      isError = true;
      validationError = { ...validationError, email: false };
    }

    if (!phoneNumber) {
      isError = true;
      validationError = { ...validationError, phoneNumber: false };
    }

    if (!password || password == "") {
      isError = true;
      validationError = { ...validationError, password: false };
    } else {
      const valPass = validatePassword(password);
      if (valPass.length > 0) {
        isError = true;
        validationError = { ...validationError, password: false };
        setPasswordValidation(valPass);
      }
    }

    if (!confirmPassword || confirmPassword == "") {
      isError = true;
      validationError = { ...validationError, confirmPassword: false };
    } else if (password !== confirmPassword) {
      isError = true;
      validationError = { ...validationError, confirmPassword: false };
    }

    if (isError) {
      setValidation(validationError);
      return;
    }

    proceedBtnAction({
      turnstileToken,
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      emailOptIn,
      phoneNumberOptIn
    });
    return;
  };

  useEffect(() => {
    if (userSignUpData?.firstName) setFirstName(userSignUpData?.firstName);
    if (userSignUpData?.lastName) setLastName(userSignUpData?.lastName);
    if (userSignUpData?.email) setEmail(userSignUpData?.email);
    if (userSignUpData?.password) setPassword(userSignUpData?.password);
    if (userSignUpData?.password) setConfirmPassword(userSignUpData?.password);
    if (userSignUpData?.phoneNumber) setPhoneNumber(userSignUpData?.phoneNumber);
  }, [userSignUpData]);

  useEffect(() => {
    if (!password) return;
    setPasswordValidation(validatePassword(password));
  }, [password]);

  useEffect(() => {
    if (!confirmPassword) return;
    setValidation({
      ...validation,
      confirmPassword: password === confirmPassword,
    });
  }, [confirmPassword]);

  return (
    <form
      onSubmit={formHandler}
      className="signup-enrollment-step h-100 position-relative"
    >
      <h3 className="mb-5 f-w-500">
        Fill out the form below to join us and unlock
        <br />
        your journey with us!
      </h3>

      <div className="signup-enrollment-fields row gx-4">
        <div className="col-md-6 mb-4">
          <label htmlFor="firstNameInput" className="form-label">
            First Name
          </label>
          <input
            type="text"
            id="firstNameInput"
            className={`form-control ${validation.firstName === false ? `is-invalid` : ``
              }`}
            placeholder="First Name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
          {validation.firstName === false && !firstName && (
            <div className="text-danger mt-2 validation-size">
              {"First name is required."}
            </div>
          )}

          {firstName && /[^A-Za-z0-9 ]/.test(firstName) && (
            <div className="text-danger mt-2 validation-size">
              {"Special characters are not allowed."}
            </div>
          )}
        </div>
        <div className="col-md-6 mb-2">
          <label htmlFor="lastNameInput" className="form-label">
            Last Name
          </label>
          <input
            type="text"
            id="lastNameInput"
            className={`form-control ${validation.lastName === false ? `is-invalid` : ``
              }`}
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
            }}
          />
          {validation.lastName === false && !lastName && (
            <div className="text-danger mt-2 validation-size">
              {"Last name is required."}
            </div>
          )}
          {lastName && /[^A-Za-z0-9 ]/.test(lastName) && (
            <div className="text-danger mt-2 validation-size">
              {"Special characters are not allowed."}
            </div>
          )}
        </div>
        <div className="col-md-6 mb-2">
          <label htmlFor="emailInput" className="form-label">
            Email Address
          </label>
          <input
            type="email"
            id="emailInput"
            className={`form-control ${validation.email === false ? `is-invalid` : ``
              }`}
            placeholder="user@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          {validation.email === false && !email && (
            <div className="text-danger mt-2 validation-size">
              {"Email is required."}
            </div>
          )}
          {email && !validateEmail(email) && (
            <div className="text-danger mt-2 validation-size">
              {"Please enter a valid email address."}
            </div>
          )}
        </div>
        <div className="col-md-6 mb-2">
          <label htmlFor="phoneNumberInput" className="form-label">Phone Number</label>
          <input
            type="number"
            id="phoneNumberInput"
            className={`form-control ${validation.phoneNumber === false ? `is-invalid` : ``
              }`}
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(Number(e.target.value));
            }}
          />
          {validation.phoneNumber === false && !lastName && (
            <div className="text-danger mt-2 validation-size">
              {"Phone number is required."}
            </div>
          )}
        </div>
        <div className="col-md-6 mb-4">
          <label htmlFor="passwordInput" className="form-label">
            Create Password
          </label>
          <div className="position-relative">
            <input
              type={showPassword ? "text" : "password"}
              id="passwordInput"
              className={`form-control ${validation.password === false ? `is-invalid` : ``
                }`}
              placeholder="Create Password"
              value={password}
              onChange={(e) => {
                const passwordValue = e.target.value;
                if (passwordValue == "") {
                  setValidation({ ...validation, password: true });
                  setPasswordValidation([]);
                  setShowPassword(false);
                }
                setPassword(e.target.value);
              }}
            />
            <button
              type="button"
              className="password-visibility-btn position-absolute top-50 translate-middle-y bg-white border-0 text-primary p-0 m-0"
              onClick={(e) => setShowPassword(!showPassword)}
            >
              {showPassword ? "hide" : "show"}
              {/* {showPassword && !password ? "show" : ''} */}
            </button>
          </div>
          {passwordValidation.length > 0 &&
            passwordValidation.map((data, key) => (
              <div
                key={`passwordValidation-${key}`}
                className="text-danger mt-2 d-block validation-size"
              >
                {data}
              </div>
            ))}
          {validation.password === false && !password && (
            <div className="text-danger mt-2 validation-size">
              {"Password is required."}
            </div>
          )}
        </div>
        <div className="col-md-6 mb-2">
          <label htmlFor="confirmPasswordInput" className="form-label">
            Re-Type Password
          </label>
          <div className="position-relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPasswordInput"
              className={`form-control ${validation.confirmPassword === false ? `is-invalid` : ``
                }`}
              placeholder="Re-Type Password"
              value={confirmPassword}
              onChange={(e) => {
                if (e.target.value == "") {
                  setValidation({ ...validation, confirmPassword: true });
                  setShowConfirmPassword(false);
                }
                setConfirmPassword(e.target.value);
              }}
            />
            <button
              type="button"
              className="password-visibility-btn position-absolute top-50 translate-middle-y bg-white border-0 text-primary p-0 m-0"
              onClick={(e) => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "hide" : "show"}
              {/* {showConfirmPassword && confirmPassword === '' ? "show" : ''} */}
              {/* {showConfirmPassword && confirmPassword === undefined ? 'hide' : ''} */}
            </button>
          </div>
          {passwordValidation.length === 0 &&
            confirmPassword &&
            confirmPassword !== password && (
              <div className="text-danger mt-2 d-block validation-size">
                Password and re-type password does not match.
              </div>
            )}

          {validation.confirmPassword === false && !confirmPassword && (
            <div className="text-danger mt-2 validation-size">
              {"Retype Password is required."}
            </div>
          )}
        </div>
        <div className="col-12 mb-4">
          <div className="form-check d-flex align-items-center gap-2 mb-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="agreeToReceiveEmail"
              onChange={e => setEmailOptIn(!emailOptIn)}
              checked={emailOptIn}
            />
            <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceiveEmail">I agree to receive email updates and promotions.</label>
          </div>

          <div className="form-check d-flex align-items-center gap-2">
            <input
              className="form-check-input"
              type="checkbox"
              id="agreeToReceivePhone"
              onChange={e => setPhoneNumberOptIn(!phoneNumberOptIn)}
              checked={phoneNumberOptIn}
            />
            <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceivePhone">I agree to receive SMS updates and promotions.</label>
          </div>
          {phoneNumberOptIn && <small className="mt-2 d-block" style={{ fontSize: "12px" }}><i>By opting in, you agree to receive SMS updates and promotions. Message and data rates may apply. See our <Link style={{ fontSize: "12px" }} href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL ?? `https://www.rentersbp.com/contact`} target="_blank">Privacy Policy</Link> for details.</i></small>}
        </div>
      </div>
      {/* <TurnstileWrapper
        key={resetTurnstile}
        onVerify={setTurnstileToken}
        className="mb-5 mb-md-0"
      /> */}

      <div
        className={`signup-action-bar position-absolute mt-4 w-100 d-flex justify-content-${!disableBackBtn ? `between` : `end`
          } align-items-center`}
      >
        {!disableBackBtn && (
          <button
            className="btn btn-light"
            onClick={(e) => backBtnAction("plan")}
          >
            Back
          </button>
        )}
        <button type="submit" className="btn btn-primary">
          Proceed
        </button>
      </div>
    </form>
  );
};

export default SignUpEnrollment;
