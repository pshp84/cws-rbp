import { BasicSubmitButton, ImagePath } from "@/Constant";
import React from "react";
import { useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
} from "reactstrap";
import { dbClient , getUserByEmail } from "@/DbClient/index";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { Field, useFormik, FormikProvider } from "formik";

const ForgetPasswordContainer = () => {
  const [email, setEmail] = useState("");
  const [disableButton , setDisableButton] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: ""
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().required("Email is required"),
    }),
    onSubmit: async (values) => {
      sendResetPasswordLink(values.email)
    },
  });

  const sendResetPasswordLink = async (email: string) => {
    setDisableButton(true);
    const result = await getUserByEmail(email);
    if (typeof result == "boolean" && !result) {
      toast.error("Email is not registered.Please Register.", { toastId: "error3" });
      formik.resetForm();
      setDisableButton(false);
      return;
    }
    // event.preventDefault(); 
    try {
      const { data, error } = await dbClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: process.env.NEXT_PUBLIC_NEXTAUTH_URL + "/others/authentication/resetpassword"
        });
        if (Object.keys(data ?? {}).length == 0 && (error ?? null) == null) {
          toast.success("Password reset Link sent successfully......",{ toastId: "success1" });
          formik.resetForm();
          setDisableButton(false);
        } else {
          toast.error("Something went wrong.Please try again later!", { toastId: "error1" });
          formik.resetForm();
          setDisableButton(false);
        }
    } catch (error) {
      toast.error("Something went wrong.Please try again later!" , { toastId: "error2" });
      formik.resetForm();
      setDisableButton(false);
    }
  };

  return (
    <Container fluid className="p-0">
      <Row>
        <Col sm="12">
          <div className="login-card login-card-main login-dark">
            <div>
              <div>
                <a className="logo logoSetup" href={`/pages/dashboard`}>
                  <img
                    className="img-fluid for-light"
                    src={`${ImagePath}/logo/logoBlue.png`}
                    alt="loginpage"
                  />
                  <img
                    className="img-fluid for-dark"
                    src={`${ImagePath}/logo/logo_dark.png`}
                    alt="loginpage"
                  />
                  <h2 className="textSetup">RBP Club</h2>
                </a>
              </div>
              <div className="login-main">
                <FormikProvider value={formik}>
                <Form
                  className="theme-form"
                  onSubmit={formik.handleSubmit}
                >
                  <h4>{"Forgot Password"}</h4>
                  <FormGroup>
                    <Label className="col-form-label f-w-700">{"Your Email"}<span className="txt-danger">*</span></Label>
                    {/* <Input
                      name="email"
                      type="email"
                      onChange={(event) => setEmail(event.target.value)}
                      value={email}
                      className="form-control"
                      placeholder="Enter Email"
                      style={{ fontSize: "medium", color: "black" }}
                    /> */}
                     <Field
                      style={{ fontSize: "medium", color: "black" }}
                      name="email"
                      type="email"
                      className={`form-control ${(formik.errors.email && submitted) ? "is-invalid" : ""}`}
                      placeholder="Enter Email"
                    />
                    {formik.errors.email && submitted && (
                      <div className="text-danger mt-2">{formik.errors.email}</div>
                    )}
                  </FormGroup>
                  <FormGroup className="mb-0">
                    <Button disable={disableButton} type="submit" onClick={() => setSubmitted(true)} block color="primary" className="w-100">
                      {BasicSubmitButton}
                    </Button>
                  </FormGroup>
                </Form>
                </FormikProvider>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgetPasswordContainer;
