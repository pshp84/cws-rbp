import {
  CreateAccount,
  DontHaveAccount,
  EmailAddressLogIn,
  ForgotPassword,
  Password,
  SignIn,
  SignInToAccount,
  ImagePath,
} from "@/Constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Form, FormGroup, Input, Label } from "reactstrap";
import imageTwo from "../../../../public/assets/images/logo/logo_dark.png";
import { dbClient, getUserRole } from "@/DbClient/index";
import * as Yup from "yup";
import { Field, useFormik, FormikProvider } from "formik";
import { getUserMembership, membershipStatus } from '@/DbClient/memberships';

const UserForm = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [disableLoginButton, setDisableLoginButton] = useState(false);
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().required("Email Address is required"),
      password: Yup.string().required("Password is required").nullable(),
    }),
    onSubmit: async (values) => {
      formSubmitHandle(values.email, values.password)
    },
  });

  const fetchUserRole = async (userId: string) => {
    try {
      const role = await getUserRole(userId);
      return role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const formSubmitHandle = async (email: string, password: string) => {
    // event.preventDefault();
    setDisableLoginButton(true);
    setSubmitted(true);

    try {
      const { data, error } = await dbClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if ((data.session ?? null) != null && data.user != null) {
        const membershipData = await getUserMembership(data.user.id);
        const role = await fetchUserRole(data.user.id);
        if (typeof (membershipData) == 'boolean' && !membershipData && role === "user") {
          toast.error("Something went wrong.Please try again later!", { toastId: 'error2' });
          setDisableLoginButton(false);
          setSubmitted(false);
          return
        }
        if (membershipData.status !== membershipStatus.Active && role === "user") {
          toast.error(`Your Membership is not Active so you are not allowed to login.`, { toastId: 'error3' });
          setDisableLoginButton(false);
          setSubmitted(false);
          return
        }
        localStorage.setItem("authToken", data.session?.access_token || "");
        localStorage.setItem("refreshToken", data.session?.access_token || "");
        localStorage.setItem(
          "expires_at",
          (data.session?.expires_at ?? 0).toString()
        );
        localStorage.setItem("userId", data.user.id);

        localStorage.setItem("userRole", role);
        setSubmitted(false);
        if (role === "admin") {
          toast.success("Login successful. Please wait while we redirect you to your dashboard..");
          router.push("/admin/admin_dashboard");
        } else {
          toast.success("Login successful. Please wait while we redirect you to your dashboard..");
          router.push("/dashboard");
        }
      } else {
        toast.error("Invalid Credentials...", { toastId: 'error1' });
        setDisableLoginButton(false);
        setSubmitted(false);
      }
    } catch (error) {
      setDisableLoginButton(false);
      setSubmitted(false);
      toast.error("Something went wrong.Please try again later!", { toastId: 'error2' });
    }
  };

  return (
    <div>
      <div>
        <Link className="logo logoSetup" href={`/auth/login`}>
          <img
            className="img-fluid for-light"
            src={`${ImagePath}/logo/logoBlue.png`}
            alt="login page"
          />
          <img
            className="img-fluid for-dark"
            src={imageTwo.src}
            alt="login page"
          />
          <h2 className="textSetup">RBP Club</h2>
        </Link>
      </div>
      <div className="login-main">
        <FormikProvider value={formik}>
          <Form
            className="theme-form"
            onSubmit={formik.handleSubmit}
          >
            <h4>{SignInToAccount}</h4>
            <p>Enter your email & password to login</p>
            <FormGroup>
              <Label className="col-form-label f-w-700">{EmailAddressLogIn}<span className="txt-danger">*</span></Label>
              {/* <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter Email"
                style={{ fontSize: "medium", color: "black" }}
              /> */}
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
              <Label className="col-form-label f-w-700">{Password}<span className="txt-danger">*</span></Label>
              <div className="position-relative">
                <Field
                  className="form-control"
                  name="password"
                  type={show ? "text" : "password"}
                  placeholder="Enter Password"
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
              {/* <div className="position-relative"> */}
              {/* <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter Password"
                  style={{ fontSize: "medium", color: "black" }}
                /> */}
              {/* <div className="show-hide" onClick={() => setShow(!show)}>
                  {!show && <span className="show"> </span>}
                  {show && <span className="hide"> </span>}
                </div> */}
              {/* </div> */}
            </FormGroup>
            <FormGroup className="mb-0">
              <div className="d-flex justify-content-between align-items-center">
                <div></div>
                <Link
                  className="ms-2"
                  href={`/others/authentication/forgetpassword`}
                >
                  {ForgotPassword}
                </Link>
              </div>
              <div className="text-end mt-3">
                <Button
                  color="primary"
                  type="submit"
                  disabled={disableLoginButton}
                  block
                  onClick={() => setSubmitted(true)}
                  className="w-100"
                >
                  {SignIn}
                </Button>
              </div>
            </FormGroup>
            <p className="mt-4 mb-0 text-center">
              {DontHaveAccount}
              <Link
                className="ms-2"
                href={`/others/authentication/registersimple`}
              >
                {CreateAccount}
              </Link>
            </p>
          </Form>
        </FormikProvider>
      </div>
    </div>
  );
};
export default UserForm;
