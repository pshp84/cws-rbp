import {
  AlreadyHaveAnAccount,
  AuthSignIn,
  CreateYourAccount,
  EmailAddressSignUp,
  EnterYourPersonalDetailsToCreateAccount,
  ImagePath,
  PasswordSignUp,
} from "@/Constant";
import { SignupProp } from "@/Types/AuthType";
import { Field, useFormik, FormikProvider } from "formik";
import Link from "next/link";
import { useState } from "react";
import { Button, Col, FormGroup, Label, Card, CardBody } from "reactstrap";
import * as Yup from "yup";
import { dbClient } from "@/../../src/DbClient/index";
import { toast } from "react-toastify";

declare global {
  interface Window {
    HostedTokenization: any;
  }
}

export const RegisterForm: React.FC<SignupProp> = ({ logoClass }) => {
  const url: string =
    (process.env.NEXTAUTH_URL as string) + "/others/authentication/subscribe";
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showRegistartionForm, setShowRegistartionForm] = useState(true);
  const [showVerificationMessage, setshowVerificationMessage] = useState(false);
  const [disableRegisterButton, setDisableRegisterButton] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
  const validatePassword = (value: string) => {
    setErrors({
      length: value.length < 6,
      uppercase: !/[A-Z]/.test(value),
      lowercase: !/[a-z]/.test(value),
      number: !/\d/.test(value),
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    formik.setFieldValue("password", newPassword);
    validatePassword(newPassword);
  };
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
      firstname: "",
      lastname: "",
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().email("Invalid email").required("Email Address is required"),
      password: Yup.string()
        .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
        .matches(/[a-z]/, "Password must contain at least one lowercase letter")
        .matches(/[0-9]/, "Password must contain at least one number")
        .matches(
          /[^A-Za-z0-9 ]/,
          "Password must contain at least one special character"
        )
        .min(6, "Password must be at least 6 characters")
        .required("Password is required")
        .nullable(),
    }),
    onSubmit: async (values) => {
      setDisableRegisterButton(true);
      try {
        const { data, error } = await dbClient.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo:
              "https://staging.rentersbp.com/others/authentication/subscribe?redirect=true",
            data: {
              first_name: "",
              last_name: "",
            },
          },
        });
        setShowRegistartionForm(false);
        setshowVerificationMessage(true);
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        setDisableRegisterButton(false);
      }
    },
  });

  return (
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
      {showRegistartionForm && (
        <div className="login-main">
          <FormikProvider value={formik}>
            <form className="theme-form" onSubmit={formik.handleSubmit}>
              <h4>{CreateYourAccount}</h4>
              <p>{EnterYourPersonalDetailsToCreateAccount}</p>
              <FormGroup>
                <Label className="col-form-label f-w-700">
                  {EmailAddressSignUp}<span className="txt-danger">*</span>
                </Label>
                <Field
                  style={{ fontSize: "medium", color: "black" }}
                  name="email"
                  type="email"
                  className={`form-control ${(formik.errors.email && submitted) ? "is-invalid" : ""}`}
                  placeholder="Enter Email Address"
                />
                {formik.errors.email && submitted && (
                  <div className="text-danger mt-2">{formik.errors.email}</div>
                )}
              </FormGroup>
              <FormGroup>
                <Label className="col-form-label f-w-700">
                  {PasswordSignUp}<span className="txt-danger">*</span>
                </Label>
                <div className="position-relative">
                  <Field
                    className="form-control"
                    name="password"
                    type={show ? "text" : "password"}
                    placeholder="Enter Password"
                    onChange={handlePasswordChange}
                    value={password}
                    style={{ fontSize: "medium", color: "black" }}
                  />
                  <div className="show-hide" onClick={() => setShow(!show)}>
                    {!show && <span className="show"> </span>}
                    {show && <span className="hide"> </span>}
                  </div>
                </div>
                {formik.errors.password && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.password}
                  </div>
                )}
              </FormGroup>
              <div className="mb-2">
                <h6 className="mb-1 f-w-700">Password must contain:</h6>
                <ul className="space-y-1 text-sm m-l-10 f-16">
                  <li className={errors.uppercase ? "" : "text-success"}>
                    <span
                      className={
                        errors.uppercase ? "text-danger" : "text-success"
                      }
                    >
                      {errors.uppercase ? "✗" : "✓"}
                    </span>{" "}
                    Uppercase letter
                  </li>
                  <li className={errors.lowercase ? "" : "text-success"}>
                    <span
                      className={
                        errors.lowercase ? "text-danger" : "text-success"
                      }
                    >
                      {errors.lowercase ? "✗" : "✓"}
                    </span>{" "}
                    Lowercase letter
                  </li>
                  <li className={errors.number ? "" : "text-success"}>
                    <span
                      className={errors.number ? "text-danger" : "text-success"}
                    >
                      {errors.number ? "✗" : "✓"}
                    </span>{" "}
                    Number
                  </li>
                  <li className={errors.special ? "" : "text-success"}>
                    <span
                      className={
                        errors.special ? "text-danger" : "text-success"
                      }
                    >
                      {errors.special ? "✗" : "✓"}
                    </span>{" "}
                    Special character
                  </li>
                  <li className={errors.length ? "" : "text-success"}>
                    <span
                      className={errors.length ? "text-danger" : "text-success"}
                    >
                      {errors.length ? "✗" : "✓"}
                    </span>{" "}
                    At least 6 characters
                  </li>
                </ul>
              </div>
              <FormGroup className="mb-0">
                <Button
                  disabled={disableRegisterButton}
                  block
                  color="primary"
                  type="submit"
                  onClick={() => setSubmitted(true)}
                  className="w-100"
                >
                  {"Register"}
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
      )}
      {showVerificationMessage && (
        <div className="login-main">
            <h5>
              A verification link has been sent to your email address. Please check your email and verify your email to proceed.
            </h5>
            <div className="text-center pt-3">
              <Link className="ms-2" href={`/auth/login`}>
                Back to Login
              </Link>
            </div>
        </div>
        // <Col md="12">
        //   <Card>
        //     <CardBody>
        //       <h2>
        //         Verification Link has been sent to your Email Address.Please
        //         verify your Email!
        //       </h2>
        //       <div className="text-center pt-3">
        //         <Link className="ms-2" href={`/auth/login`}>
        //           Back to Login
        //         </Link>
        //       </div>
        //     </CardBody>
        //   </Card>
        // </Col>
      )}
    </div>
  );
};
