"use client";
import { useState } from "react";
import { FormCallbackProp } from "@/Types/TabType";
import {
  Col,
  Row,
  Label,
  Button,
  FormGroup,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { useFormik, FormikProvider, Field } from "formik";
import * as Yup from "yup";
import { dbClient } from "@/../../src/DbClient/index";
import { toast } from "react-toastify";
import { sendMail } from '@/Helper/mailSender';

const ChangePassword: React.FC<FormCallbackProp> = ({ callbackActive }) => {
  const [show, setShow] = useState(false);
  const [resetShow, setResetShow] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const headerProps: CommonCardHeaderProp = {
    title: "Change Password",
    span: [{ text: "Fill up proper password and update your password." }],
  };
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
    formik.setFieldValue("newPassword", newPassword);
    validatePassword(newPassword);
  };

  const resetForm = () => {
    formik.resetForm();
    setPassword("");
    setErrors({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
  };

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      retypePassword: "",
    },
    validationSchema: Yup.object().shape({
      newPassword: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("New Password is required"),
      retypePassword: Yup.string()
        .required("Retype Password is required")
        .oneOf([Yup.ref("newPassword")], "Password must match"),
    }),
    onSubmit: async (values) => {
      setDisableButton(true);
      setSubmitted(true);
      try {
        const { data, error } = await dbClient.auth.updateUser({
          password: values.newPassword,
        });
        if ((data.user ?? null) != null) {
          toast.success("Password updated successfully.");
          const dataTemplate = {
            mainHeading: "Password Update",
            message: "Your Password Updated Sucessfully."
          }
          const response = await sendMail({
            sendTo: data.user?.email,
            subject: 'Password Update',
            template: 'changePasswordTemplate',
            context: dataTemplate
          },{ extension: '.html' , dirpath: './EmailTemplates' })
          setDisableButton(false);
          setSubmitted(false);
          resetForm();
        } else {
          toast.error("Something went wrong. Please try again later!");
          setDisableButton(false);
          setSubmitted(false);
          resetForm();
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again later!");
        setDisableButton(false);
        setSubmitted(false);
        resetForm();
      }
    },
  });

  return (
    <div>
      {/* <Card md="12">
        <CommonCardHeader title={headerProps.title} span={headerProps.span}></CommonCardHeader>
        <CardBody> */}
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <FormGroup>
            <Label className="col-form-label">
              New Password<span className="txt-danger">*</span>
            </Label>
            <div className="position-relative">
              <Field
                className="form-control"
                type={show ? "text" : "password"}
                name="newPassword"
                placeholder="Enter New Password"
                value={password}
                onChange={handlePasswordChange}
              />
              {/* <div className="show-hide" style={{ top: '50%' }} onClick={() => setShow(!show)}>
                    <span className="show"></span>
                  </div> */}
              <div
                className="show-hide"
                style={{ top: "50%" }}
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
          <Row>
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
                    className={errors.special ? "text-danger" : "text-success"}
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
          </Row>
          <FormGroup>
            <Label className="col-form-label">
              Retype Password<span className="txt-danger">*</span>
            </Label>
            <div className="position-relative">
              <Field
                type={resetShow ? "text" : "password"}
                className="form-control"
                placeholder="Retype Password"
                autoComplete=""
                name="retypePassword"
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
            <Row>
              <Col md="10"></Col>
              <Col md="2">
                <Button
                  block
                  type="submit"
                  disabled={disableButton}
                  onClick={() => setSubmitted(true)}
                  color="primary"
                  className="w-100"
                >
                  Update
                </Button>
              </Col>
            </Row>
          </FormGroup>
        </form>
      </FormikProvider>
      {/* </CardBody>
      </Card> */}
    </div>
  );
};

export default ChangePassword;
