import {
  BasicSubmitButton,
  ImagePath,
  NewPassword,
  ResetYourPassword,
  RetypePassword,
} from "@/Constant";
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
import { useFormik, FormikProvider, Field } from "formik";
import * as Yup from "yup";
import { dbClient } from "@/../../src/DbClient/index";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ResetPasswordContainer = () => {
  const [show, setShow] = useState(false);
  const [resetShow, setResetShow] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: "",
      newPassword: "",
      retypePassword: "",
    },
    validationSchema: Yup.object().shape({
      email: Yup.string().email("Invalid email").required("Email is required"),
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("New Password is required"),
      retypePassword: Yup.string()
        .required("Retype Password is required")
        .oneOf([Yup.ref("newPassword")], "Password must match"),
    }),
    onSubmit: async (values) => {
      setDisableButton(true);
      try {
        const { data, error } = await dbClient.auth.updateUser({
          password: values.newPassword,
        });
        if ((data.user ?? null) != null) {
          toast.success("Password updated successfully......");
          setDisableButton(false);
          router.push("/auth/login");
        } else {
          toast.error("Something went wrong.Please try again later!");
          setDisableButton(false);
        }
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        setDisableButton(false);
      }
    },
  });

  return (
    <Container fluid className="p-0">
      <Row>
        <Col sm="12">
          <div className="login-card login-card-main login-dark">
            <div>
              <div>
                <a className="logo logoSetup">
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
                  <form className="theme-form" onSubmit={formik.handleSubmit}>
                    <h4>{ResetYourPassword}</h4>
                    <FormGroup>
                      <Label className="col-form-label f-w-700">
                        {"Your Email"}
                        <span className="txt-danger">*</span>
                      </Label>
                      <Field
                        name="email"
                        type="email"
                        className="form-control"
                        placeholder="Enter Email"
                        style={{ fontSize: "medium", color: "black" }}
                      />
                      {formik.errors.email && submitted && (
                        <div className="text-danger mt-2">
                          {formik.errors.email}
                        </div>
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label className="col-form-label f-w-700">
                        {NewPassword}
                        <span className="txt-danger">*</span>
                      </Label>
                      <div className="position-relative">
                        <Field
                          className="form-control"
                          type={show ? "text" : "password"}
                          name="newPassword"
                          placeholder="Enter New Password"
                          style={{ fontSize: "medium", color: "black" }}
                        />
                        <div
                          className="show-hide"
                          onClick={() => setShow(!show)}
                        >
                          {!show && <span className="show"> </span>}
                          {show && <span className="hide"> </span>}
                        </div>
                      </div>
                      {formik.errors.newPassword && submitted && (
                        <div className="text-danger mt-2">
                          {formik.errors.newPassword}
                        </div>
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label className="col-form-label f-w-700">
                        {RetypePassword}
                        <span className="txt-danger">*</span>
                      </Label>
                      <div className="position-relative">
                        <Field
                          type={resetShow ? "text" : "password"}
                          className="form-control"
                          placeholder="Retype Password"
                          autoComplete=""
                          name="retypePassword"
                          style={{ fontSize: "medium", color: "black" }}
                        />
                        <div
                          className="show-hide"
                          style={{ top: "50%" }}
                          onClick={() => setResetShow(!resetShow)}
                        >
                          {!resetShow && <span className="show"> </span>}
                          {resetShow && <span className="hide"> </span>}
                        </div>
                      </div>
                      {formik.errors.retypePassword && submitted && (
                        <div className="text-danger mt-2">
                          {formik.errors.retypePassword}
                        </div>
                      )}
                    </FormGroup>
                    <FormGroup className="mb-0">
                      <Button
                        block
                        type="submit"
                        disabled={disableButton}
                        onClick={() => setSubmitted(true)}
                        color="primary"
                        className="w-100"
                      >
                        {BasicSubmitButton}
                      </Button>
                    </FormGroup>
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

export default ResetPasswordContainer;
