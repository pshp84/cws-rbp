"use client";
import { useEffect, useState } from "react";
import { FormCallbackProp } from "@/Types/TabType";
import { Col, Row, Label, Button, FormGroup } from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { useFormik, FormikProvider, Field } from "formik";
import * as Yup from "yup";
import { dbClient, getUserById } from "@/../../src/DbClient/index";
import { toast } from "react-toastify";
import { sendMail } from "@/Helper/mailSender";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";

const ChangePassword = () => {
  const userId = localStorage.getItem("userId");
  const [show, setShow] = useState(false);
  const [resetShow, setResetShow] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState<any>("");
  const [isComplete, setIsComplete] = useState(false);

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

  const fetchUser = async () => {
    try {
      const result = await getUserById(userId as string);
      if (result) {
        setName(result);
      }
    } catch (err) {
      setName("");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (
      errors.length ||
      errors.lowercase ||
      errors.number ||
      errors.special ||
      errors.uppercase
    ) {
      setIsComplete(true);
    } else {
      setIsComplete(false);
    }
  });

  const validatePassword = (value: string) => {
    setErrors({
      length: value.length < 8,
      uppercase: !/[A-Z]/.test(value),
      lowercase: !/[a-z]/.test(value),
      number: !/\d/.test(value),
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword === "") {
      setShow(false);
    }
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
        .min(8, "Password must be at least 8 characters.")
        .required("New Password is required."),
      retypePassword: Yup.string()
        .required("Retype Password is required.")
        .oneOf(
          [Yup.ref("newPassword")],
          "New password and re-type password does not match."
        ),
    }),
    onSubmit: async (values) => {
      //setIsComplete(false);
      setDisableButton(true);
      setSubmitted(true);
      try {
        const { data, error } = await dbClient.auth.updateUser({
          password: values.newPassword,
        });
        if ((data.user ?? null) != null) {
          toast.success("Password updated successfully.");

          const dataTemplate = {
            mainHeading: `${name ? name.first_name.charAt(0).toUpperCase() + name.first_name.slice(1) : ""}`,
            userEmail: data.user?.email
          };

          // await sendMail(
          //   {
          //     sendTo: data.user?.email,
          //     subject: "Your Password Has Been Updated - RBP Club",
          //     template: "changePasswordTemplate",
          //     context: dataTemplate,
          //   },
          //   { extension: ".html", dirpath: "./EmailTemplates" }
          // );

          await sendApiEmailToUser({
            sendTo: data.user?.email,
            subject: "Your Password Has Been Updated - RBP Club",
            template: "changePasswordTemplate",
            context: dataTemplate,
            extension: ".html",
            dirpath: "public/email-templates",
          });

          setDisableButton(false);
          setSubmitted(false);
          resetForm();
        } else {
          toast.error(error?.message);
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
    <div className="user-signup-page ff-sora tab-view">
      {disableButton ? (
        <>
          <LoadingIcon withOverlap={true} />
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <div className="mb-3">
                <h4>Change Password</h4>
                <hr className="mt-2" />
              </div>
              <Row>
                <Col md="5">
                  <FormGroup>
                    <Label className="col-form-label">
                      Create New Password<span className="txt-danger">*</span>
                    </Label>
                    <div className="position-relative">
                      <Field
                        className="form-control ff-sora"
                        type={show ? "text" : "password"}
                        name="newPassword"
                        placeholder="set new password"
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
                </Col>
                <Col md="5">
                  <FormGroup>
                    <Label className="col-form-label">
                      Re-Type New Password<span className="txt-danger">*</span>
                    </Label>
                    <div className="position-relative">
                      <Field
                        type={resetShow ? "text" : "password"}
                        className="form-control ff-sora"
                        placeholder="confirm new Password"
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
                </Col>
              </Row>

              <Row>
                <Col md="6">
                  <div className="mb-2">
                    <h6 className="mb-1 f-w-700">Password must contain:</h6>
                    <ul className="space-y-1 text-sm">
                      <div className="d-flex gap-5">
                        <div className="left">
                          <li
                            className={`my-2 ${
                              errors.uppercase ? "" : "text-success"
                            }`}
                          >
                            <span
                              className={errors.uppercase ? "" : "text-success"}
                            >
                              {errors.uppercase ? "✓" : "✓"}
                            </span>{" "}
                            Uppercase letter
                          </li>
                          <li
                            className={`my-2 ${
                              errors.lowercase ? "" : "text-success"
                            }`}
                          >
                            <span
                              className={errors.lowercase ? "" : "text-success"}
                            >
                              {errors.lowercase ? "✓" : "✓"}
                            </span>{" "}
                            Lowercase letter
                          </li>
                          <li
                            className={`my-2 ${
                              errors.number ? "" : "text-success"
                            }`}
                          >
                            <span
                              className={errors.number ? "" : "text-success"}
                            >
                              {errors.number ? "✓" : "✓"}
                            </span>{" "}
                            Number
                          </li>
                        </div>
                        <div className="right">
                          <li
                            className={`my-2 ${
                              errors.special ? "" : "text-success"
                            }`}
                          >
                            <span
                              className={errors.special ? "" : "text-success"}
                            >
                              {errors.special ? "✓" : "✓"}
                            </span>{" "}
                            Special character
                          </li>
                          <li
                            className={`my-2 ${
                              errors.length ? "" : "text-success"
                            }`}
                          >
                            <span
                              className={errors.length ? "" : "text-success"}
                            >
                              {errors.length ? "✓" : "✓"}
                            </span>{" "}
                            At least 8 characters
                          </li>
                        </div>
                      </div>
                    </ul>
                  </div>
                </Col>
              </Row>
              <FormGroup className="mb-0">
                <Row>
                  <Col md="6"></Col>
                  <Col md="2">
                    {/* <div className="text-right">
                      <Button block className="btn btn-light" type="button">
                        Cancel
                      </Button>
                    </div> */}
                  </Col>
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
        </>
      ) : (
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <h4>Change Password</h4>
              <hr className="mt-2" />
            </div>
            <Row>
              <Col md="5">
                <FormGroup>
                  <Label className="col-form-label">
                    Create New Password<span className="txt-danger">*</span>
                  </Label>
                  <div className="position-relative">
                    <Field
                      className="form-control ff-sora"
                      type={show ? "text" : "password"}
                      name="newPassword"
                      placeholder="Create New Password"
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
                      {/* {show && !password && <span className="show"></span>} */}
                    </div>
                  </div>
                  {formik.errors.newPassword && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.newPassword}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md="5">
                <FormGroup>
                  <Label className="col-form-label">
                    Re-Type New Password<span className="txt-danger">*</span>
                  </Label>
                  <div className="position-relative">
                    <Field
                      type={resetShow ? "text" : "password"}
                      className="form-control ff-sora"
                      placeholder="Re-Type New Password"
                      autoComplete=""
                      name="retypePassword"
                      value={formik.values.retypePassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        formik.handleChange(e);
                        const retypePasswordValue = e.target.value;
                        if (retypePasswordValue === "") {
                          setResetShow(false);
                        }
                      }}
                    />
                    <div
                      className="show-hide"
                      style={{ top: "50%" }}
                      onClick={() => setResetShow(!resetShow)}
                    >
                      {!resetShow && <span className="show"> </span>}
                      {resetShow && <span className="hide"> </span>}
                      {/* {resetShow && !formik.values.retypePassword && (
                        <span className="show"></span>
                      )} */}
                    </div>
                  </div>
                  {formik.errors.retypePassword && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.retypePassword}
                    </div>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="6">
                <div className="mb-2">
                  <h6 className="mb-1 f-w-700">Password must contain:</h6>
                  <ul className="space-y-1 text-sm">
                    <div className="d-flex gap-5">
                      <div className="left">
                        <li
                          className={`my-2 ${
                            errors.uppercase ? "" : "text-success"
                          }`}
                        >
                          <span
                            className={errors.uppercase ? "" : "text-success"}
                          >
                            {errors.uppercase ? "✓" : "✓"}
                          </span>{" "}
                          Uppercase letter
                        </li>
                        <li
                          className={`my-2 ${
                            errors.lowercase ? "" : "text-success"
                          }`}
                        >
                          <span
                            className={errors.lowercase ? "" : "text-success"}
                          >
                            {errors.lowercase ? "✓" : "✓"}
                          </span>{" "}
                          Lowercase letter
                        </li>
                        <li
                          className={`my-2 ${
                            errors.number ? "" : "text-success"
                          }`}
                        >
                          <span className={errors.number ? "" : "text-success"}>
                            {errors.number ? "✓" : "✓"}
                          </span>{" "}
                          Number
                        </li>
                      </div>
                      <div className="right">
                        <li
                          className={`my-2 ${
                            errors.special ? "" : "text-success"
                          }`}
                        >
                          <span
                            className={errors.special ? "" : "text-success"}
                          >
                            {errors.special ? "✓" : "✓"}
                          </span>{" "}
                          Special character
                        </li>
                        <li
                          className={`my-2 ${
                            errors.length ? "" : "text-success"
                          }`}
                        >
                          <span className={errors.length ? "" : "text-success"}>
                            {errors.length ? "✓" : "✓"}
                          </span>{" "}
                          At least 8 characters
                        </li>
                      </div>
                    </div>
                  </ul>
                </div>
              </Col>
            </Row>
            <FormGroup className="mb-0">
              <Row>
                <Col md="6"></Col>
                <Col md="2">
                  {/* <div className="text-right">
                    <Button block className="btn btn-light" type="button">
                      Cancel
                    </Button>
                  </div> */}
                </Col>
                <Col md="2">
                  <Button
                    block
                    type="submit"
                    disabled={isComplete}
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
      )}
    </div>
  );
};

export default ChangePassword;
