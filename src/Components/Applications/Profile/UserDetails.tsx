"use client";
import { useEffect, useState, useRef } from "react";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import {
  Card,
  CardBody,
  Col,
  Row,
  Label,
  Input,
  Spinner,
  Button,
  FormGroup,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { FormCallbackProp } from "@/Types/TabType";
import { useFormik, FormikProvider, Field } from "formik";
import { userUpdateDataInterface } from "@/DbClient/users";
import { toast } from "react-toastify";
import * as Yup from "yup";
import {
  getUserById,
  getUserMeta,
  updateUser,
  updateUserMeta,
  userDbFieldsInterface,
  UserMetaDataInterface,
} from "@/DbClient";
import { State } from "country-state-city";
import _, { add } from "lodash";
import { sendMail } from "@/Helper/mailSender";
import axios from "axios";
import { updateUserToBrevo } from "@/CommonComponent/brevoContactLists";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { EmailBody, EmailResponse } from "@/Types/EmailType";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";
import { PhoneNumber } from "@/Constant";
import Link from "next/link";

interface formValueInterface {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
}

interface UserAttributes {
  FIRSTNAME: string;
  LASTNAME: string;
  SMS?: string; // Optional property for SMS
}

interface UserData {
  email: string;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  attributes: UserAttributes;
  listIds: number[];
  listUnsubscribed: null | string;
}

const UserDetails = () => {
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") as string
  );
  const [submitted, setSubmitted] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const [address, setAddressDetails] = useState<{}>({});
  const [usStates, setUsStates] = useState<any>([]);
  const [selected, setSelected] = useState<string>("");
  const [name, setName] = useState<any>("");
  const headerProps: CommonCardHeaderProp = {
    title: "User Details",
    span: [{ text: "Fill up required details and update your details." }],
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      street2: "",
      city: "",
      state: "",
      country: "",
      zipcode: "",
      phoneNumber: "",
      emailOptIn: false,
      phoneNumberOptIn: false
    },

    initialTouched: {
      firstName: false,
      lastName: false,
      email: false,
      street: false,
      city: false,
      //state: false,
      country: false,
      zipcode: false,
      phoneNumber: false,
      emailOptIn: false,
      phoneNumberOptIn: false
    },
    validationSchema: Yup.object().shape({
      firstName: Yup.string().required("First Name is required."),
      lastName: Yup.string().required("Last Name is required."),
      phoneNumber: Yup.string().required(`${PhoneNumber} is required.`),
      street: Yup.string().required("Street is required."),
      city: Yup.string().required("City is required."),
      //state: Yup.string().required("State is required"),
      country: Yup.string().required("Country is required."),
      zipcode: Yup.string().required("Zip Code is required."),
    }),
    onSubmit: async (values) => {
      const newAddressDetails = {
        street: values.street,
        street2: values.street2,
        city: values.city,
        state: selected,
        country: values.country,
        zipcode: values.zipcode,
      };

      setSubmitted(true);
      setDisableButton(true);
      const userData: userUpdateDataInterface = {
        firstName: values.firstName,
        lastName: values.lastName,
      };
      if (values.phoneNumber) userData.phoneNumber = Number(values.phoneNumber);
      console.log("values.emailOptIn", values.emailOptIn);

      const fName = values.firstName;
      const lName = values.lastName;
      const email = values.email;
      try {
        Promise.all([
          updateUser(userId, userData),
          updateUserMeta(userId, "city", values.city),
          updateUserMeta(userId, "street", values.street),
          updateUserMeta(userId, "street2", values.street2),
          updateUserMeta(userId, "state", selected),
          updateUserMeta(userId, "country", values.country),
          updateUserMeta(userId, "zip_code", values.zipcode),
          updateUserMeta(userId, "is_address_updated", "0"),
          updateUserMeta(userId, "email_opt_in", values.emailOptIn || false),
          updateUserMeta(userId, "phone_number_opt_in", values.phoneNumberOptIn || false),
        ]).finally(async () => {
          getUserDetails();
          setDisableButton(false);
          setSubmitted(false);
          const listId = Number(process.env.NEXT_PUBLIC_BREVO_LIST_IDS);
          const brevoData: any = {
            email: email,
            attributes: {
              FIRSTNAME: fName,
              LASTNAME: lName,
              SMS: "",
            },
            listIds: [listId],
            emailBlacklisted: false,
            smsBlacklisted: false,
            listUnsubscribed: null,
          };
          await updateUserToBrevo(brevoData);
          toast.success("Details updated successfully......");
          if (!_.isEqual(address, newAddressDetails)) {
            // const response = sendMail({
            //   sendTo: values.email,
            //   subject: 'Address Update',
            //   text: 'Your Address Updated Sucessfully.',
            // })
            const data = {
              mainHeading: `${name.charAt(0).toUpperCase() + name.slice(1)}`,
              userEmail: values.email,
              address1: `${newAddressDetails.street
                ? newAddressDetails.street
                : values.street
                }`,
              address2: `${newAddressDetails.street2
                ? newAddressDetails.street2
                : values.street2
                }`,
              city: `${newAddressDetails.city ? newAddressDetails.city : values.city
                }`,
              state: `${newAddressDetails.state ? newAddressDetails.state : values.state
                }`,
              code: `${newAddressDetails.zipcode
                ? newAddressDetails.zipcode
                : values.zipcode
                }`,
              //message: "Your Address Updated Sucessfully."
            };

            // const response = await sendMail(
            //   {
            //     sendTo: values.email,
            //     subject: "Your Address Has Been Updated - RBP Club",
            //     template: "addressUpdateTemplate",
            //     context: data,
            //   },
            //   { extension: ".html", dirpath: "./EmailTemplates" }
            // );

            await sendApiEmailToUser({
              sendTo: values.email,
              subject: "Your Address Has Been Updated - RBP Club",
              template: "addressUpdateTemplate",
              context: data,
              extension: ".html",
              dirpath: "public/email-templates",
            });
          }
        });
      } catch (error) {
        setDisableButton(false);
        setSubmitted(false);
        toast.error("Something went wrong.Please try again later!");
      }
    },
    validateOnBlur: true,
  });

  const getUserDetails = async () => {
    Promise.all([
      getUserById(userId, ["first_name", "last_name", "user_email", "phone_number"]),
      getUserMeta(userId),
    ]).then(
      (results: [userDbFieldsInterface, UserMetaDataInterface[]] | any) => {
        setShowSpinner(false);
        if (Array.isArray(results) && results.length > 0) {
          const userDetails: userDbFieldsInterface = results[0];
          setName(userDetails.first_name);
          const userMetaDetails: UserMetaDataInterface[] = results[1];
          const emailOptInDBValue = userMetaDetails.find((x) => x.meta_key == "email_opt_in")?.meta_value;
          const phoneNumberOptInDBValue = userMetaDetails.find((x) => x.meta_key == "phone_number_opt_in")?.meta_value;
          const newValues = {
            firstName: userDetails.first_name ?? "",
            lastName: userDetails.last_name ?? "",
            email: userDetails.user_email ?? "",
            phoneNumber: userDetails.phone_number?.toString() ?? "",
            emailOptIn: (emailOptInDBValue && emailOptInDBValue === "true") ? true : false,
            phoneNumberOptIn: (phoneNumberOptInDBValue && phoneNumberOptInDBValue === "true") ? true : false,
            street:
              userMetaDetails.find((x) => x.meta_key == "street")?.meta_value ??
              "",
            street2:
              userMetaDetails.find((x) => x.meta_key == "street2")
                ?.meta_value ?? "",
            city:
              userMetaDetails.find((x) => x.meta_key == "city")?.meta_value ??
              "",
            state:
              userMetaDetails.find((x) => x.meta_key == "state")?.meta_value ??
              "",
            country:
              userMetaDetails.find((x) => x.meta_key == "country")
                ?.meta_value ?? "",
            zipcode:
              userMetaDetails.find((x) => x.meta_key == "zip_code")
                ?.meta_value ?? "",
          };
          setAddressDetails({
            street:
              userMetaDetails.find((x) => x.meta_key == "street")?.meta_value ??
              "",
            street2:
              userMetaDetails.find((x) => x.meta_key == "street2")
                ?.meta_value ?? "",
            city:
              userMetaDetails.find((x) => x.meta_key == "city")?.meta_value ??
              "",
            state:
              userMetaDetails.find((x) => x.meta_key == "state")?.meta_value ??
              "",
            country:
              userMetaDetails.find((x) => x.meta_key == "country")
                ?.meta_value ?? "",
            zipcode:
              userMetaDetails.find((x) => x.meta_key == "zip_code")
                ?.meta_value ?? "",
          });
          formik.setValues(newValues);
          setSelected(newValues.state);
        } else {
        }
      }
    );
  };

  useEffect(() => {
    const allStates = State.getStatesOfCountry("US");
    setUsStates(allStates);
  }, []);

  useEffect(() => {
    getUserDetails();
  }, [userId]);

  return showSpinner ? (
    <div
      className="d-flex justify-content-center align-items-center ff-sora"
      style={{ height: "100vh" }}
    >
      <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
    </div>
  ) : (
    <div className="user-signup-page tab-view">
      {disableButton ? (
        <>
          <LoadingIcon withOverlap={true} />
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <div className="mb-3">
                <h4>User Details</h4>
                <hr className="mt-2 col-sm-10" />
              </div>
              <Row className="g-3 mb-3">
                <Col sm="5">
                  <Label check>
                    First Name<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="firstName"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="First Name"
                  />
                  {formik.errors.firstName && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.firstName}
                    </div>
                  )}
                </Col>
                <Col sm="5">
                  <Label check>
                    Last Name<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="lastName"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Last Name"
                  />
                  {formik.errors.lastName && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.lastName}
                    </div>
                  )}
                </Col>
                <Col sm="5">
                  <Label check>Email</Label>
                  <Field
                    name="email"
                    type="email"
                    className="form-control ff-sora"
                    placeholder="Email"
                    disabled="true"
                  />
                  <div className="form-check d-flex align-items-center gap-2 mt-2">
                    <Field
                      className="form-check-input"
                      type="checkbox"
                      id="agreeToReceiveEmail"
                      name="emailOptIn"
                    />
                    <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceiveEmail">I agree to receive email updates and promotions.</label>
                  </div>
                </Col>
                <Col sm="5">
                  <Label check>{PhoneNumber}</Label>
                  <Field
                    name="phoneNumber"
                    type="number"
                    className="form-control ff-sora"
                    placeholder={PhoneNumber}
                  />
                  {formik.errors.phoneNumber && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.phoneNumber}
                    </div>
                  )}
                  <div className="form-check d-flex align-items-center gap-2 mt-2">
                    <Field
                      className="form-check-input"
                      type="checkbox"
                      id="agreeToReceivePhone"
                      name="phoneNumberOptIn"
                    />
                    <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceivePhone">I agree to receive SMS updates and promotions.</label>
                  </div>
                  {formik.values.phoneNumberOptIn && <small className="mt-2 d-block" style={{ fontSize: "12px" }}><i>By opting in, you agree to receive SMS updates and promotions. Message and data rates may apply. See our <Link style={{ fontSize: "12px" }} href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL ?? `https://www.rentersbp.com/contact`} target="_blank">Privacy Policy</Link> for details.</i></small>}
                </Col>
              </Row>
              <Row>
                <Col sm="10">
                  <div className="mb-3 mt-3">
                    <h4>Address Details</h4>
                    <hr className="mt-2" />
                  </div>
                </Col>
              </Row>
              <Row className="g-3">
                <Col sm="5">
                  <Label check>
                    Street<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="street"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Street"
                  />
                  {formik.errors.street && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.street}
                    </div>
                  )}
                </Col>
                <Col sm="5">
                  <Label check>Street 2</Label>
                  <Field
                    name="street2"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Street 2"
                  />
                </Col>
                <Col sm="5">
                  <Label check>
                    City<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="city"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Enter City"
                  />
                  {formik.errors.city && submitted && (
                    <div className="text-danger mt-2">{formik.errors.city}</div>
                  )}
                </Col>
                <Col sm="5">
                  <Label check>
                    State<span className="txt-danger">*</span>
                  </Label>
                  <Input
                    type="select"
                    className="form-select rounded ff-sora"
                    name="state"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{
                      border: "1px dashed rgba(106, 113, 133, 0.3)",
                    }}
                    placeholder="Select State"
                  >
                    <option value={""}>{"select state"}</option>
                    {usStates.map((state: any) => (
                      <option key={state.isoCode} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </Input>
                  {submitted && !selected && (
                    <div className="text-danger mt-2">
                      {"State is required."}
                    </div>
                  )}

                </Col>
                <Col sm="5">
                  <Label check>
                    Country<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="country"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Enter Country"
                  />
                  {formik.errors.country && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.country}
                    </div>
                  )}
                </Col>
                <Col sm="5">
                  <Label check>
                    Zip Code<span className="txt-danger">*</span>
                  </Label>
                  <Field
                    name="zipcode"
                    type="text"
                    className="form-control ff-sora"
                    placeholder="Zip Code"
                  />
                  {formik.errors.zipcode && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.zipcode}
                    </div>
                  )}
                </Col>
              </Row>
              <Row>
                <Col md="6"></Col>
                <Col md="2">
                  {/* <div className="text-right mt-3">
                    <Button block className="btn btn-light" type="button">
                      Cancel
                    </Button>
                  </div> */}
                </Col>
                <Col md="2">
                  <div className="text-right mt-3">
                    <Button
                      block
                      type="submit"
                      onClick={() => setSubmitted(true)}
                      color="primary"
                    >
                      Update
                    </Button>
                  </div>
                </Col>
              </Row>
            </form>
          </FormikProvider>
        </>
      ) : (
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <h4>User Details</h4>
              <hr className="mt-2 col-sm-10" />
            </div>
            <Row className="g-3 mb-3">
              <Col sm="5">
                <Label check>
                  First Name<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="firstName"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="First Name"
                />
                {formik.errors.firstName && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.firstName}
                  </div>
                )}
                {formik.values.firstName &&
                  /[^A-Za-z0-9 ]/.test(formik.values.firstName) && (
                    <div className="text-danger mt-2">
                      {"Special characters are not allowed."}
                    </div>
                  )}
              </Col>
              <Col sm="5">
                <Label check>
                  Last Name<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="lastName"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Last Name"
                />
                {formik.errors.lastName && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.lastName}
                  </div>
                )}
                {formik.values.lastName &&
                  /[^A-Za-z0-9 ]/.test(formik.values.lastName) && (
                    <div className="text-danger mt-2">
                      {"Special characters are not allowed."}
                    </div>
                  )}
              </Col>
              <Col sm="5">
                <Label check>Email</Label>
                <Field
                  name="email"
                  type="email"
                  className="form-control ff-sora"
                  placeholder="Email"
                  disabled="true"
                />
                <div className="form-check d-flex align-items-center gap-2 mt-2">
                  <Field
                    className="form-check-input"
                    type="checkbox"
                    id="agreeToReceiveEmail"
                    name="emailOptIn"
                  />
                  <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceiveEmail">I agree to receive email updates and promotions.</label>
                </div>
              </Col>
              <Col sm="5">
                <Label check>{PhoneNumber}</Label>
                <Field
                  name="phoneNumber"
                  type="number"
                  className="form-control ff-sora"
                  placeholder={PhoneNumber}
                />
                {formik.errors.phoneNumber && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.phoneNumber}
                  </div>
                )}
                <div className="form-check d-flex align-items-center gap-2 mt-2">
                  <Field
                    className="form-check-input"
                    type="checkbox"
                    id="agreeToReceivePhone"
                    name="phoneNumberOptIn"
                  />
                  <label className="form-check-label mt-1 mb-0" htmlFor="agreeToReceivePhone">I agree to receive SMS updates and promotions.</label>
                </div>
                {formik.values.phoneNumberOptIn && <small className="mt-2 d-block" style={{ fontSize: "12px" }}><i>By opting in, you agree to receive SMS updates and promotions. Message and data rates may apply. See our <Link style={{ fontSize: "12px" }} href={process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL ?? `https://www.rentersbp.com/contact`} target="_blank">Privacy Policy</Link> for details.</i></small>}
              </Col>
            </Row>
            <Row>
              <Col sm="10">
                <div className="mb-3 mt-3">
                  <h4>Address Details</h4>
                  <hr className="mt-2" />
                </div>
              </Col>
            </Row>
            <Row className="g-3">
              <Col sm="5">
                <Label check>
                  Street<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="street"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Street"
                />
                {formik.errors.street && submitted && (
                  <div className="text-danger mt-2">{formik.errors.street}</div>
                )}
                {/* {formik.errors.street && (
                  <div className="text-danger mt-2">{formik.errors.street}</div>
                )} */}
              </Col>
              <Col sm="5">
                <Label check>Street 2</Label>
                <Field
                  name="street2"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Street 2"
                />
              </Col>
              <Col sm="5">
                <Label check>
                  City<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="city"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Enter City"
                />
                {formik.errors.city && submitted && (
                  <div className="text-danger mt-2">{formik.errors.city}</div>
                )}
                {/* {formik.errors.city && (
                  <div className="text-danger mt-2">{formik.errors.city}</div>
                )} */}
              </Col>
              <Col sm="5">
                <Label check>
                  State<span className="txt-danger">*</span>
                </Label>
                <Input
                  type="select"
                  className="form-select rounded ff-sora"
                  name="state"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  style={{
                    border: "1px dashed rgba(106, 113, 133, 0.3)",
                  }}
                  placeholder="Select State"
                >
                  <option>{"select state"}</option>
                  {usStates.map((state: any) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </Input>
                {submitted && !selected && (
                  <div className="text-danger mt-2">{"State is required."}</div>
                )}
                {selected === 'select state' && (
                  <div className="text-danger mt-2">{"State is required."}</div>
                )}
              </Col>
              <Col sm="5">
                <Label check>
                  Country<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="country"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Enter Country"
                />
                {formik.errors.country && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.country}
                  </div>
                )}
                {/* {formik.errors.country && (
                  <div className="text-danger mt-2">
                    {formik.errors.country}
                  </div>
                )} */}
              </Col>
              <Col sm="5">
                <Label check>
                  Zip Code<span className="txt-danger">*</span>
                </Label>
                <Field
                  name="zipcode"
                  type="text"
                  className="form-control ff-sora"
                  placeholder="Zip Code"
                />
                {formik.errors.zipcode && submitted && (
                  <div className="text-danger mt-2">
                    {formik.errors.zipcode}
                  </div>
                )}
                {/* {formik.errors.zipcode && (
                  <div className="text-danger mt-2">
                    {formik.errors.zipcode}
                  </div>
                )} */}
              </Col>
            </Row>
            <Row>
              <Col md="6"></Col>
              <Col md="2">
                {/* <div className="text-right mt-3">
                  <Button block className="btn btn-light" type="button">
                    Cancel
                  </Button>
                </div> */}
              </Col>
              <Col md="2">
                <div className="text-right mt-3">
                  <Button
                    block
                    type="submit"
                    disabled={disableButton}
                    onClick={() => setSubmitted(true)}
                    color="primary"
                  >
                    Update
                  </Button>
                </div>
              </Col>
            </Row>
          </form>
        </FormikProvider>
      )}
    </div>
  );
};

export default UserDetails;
