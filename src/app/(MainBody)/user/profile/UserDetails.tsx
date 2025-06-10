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
import _ from "lodash";
import { sendMail } from '@/Helper/mailSender';

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

const metaObjectsData = {
  street: "",
  street2: "",
  city: "",
  state: "",
  country: "",
  zip_code: "",
};

const UserDetails: React.FC<FormCallbackProp> = ({ callbackActive }) => {
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") as string
  );
  const [submitted, setSubmitted] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const [address, setAddressDetails] = useState<{}>({});
  const [usStates, setUsStates] = useState<any>([]);
  const [selected, setSelected] = useState<string>("");
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
    },
    validationSchema: Yup.object().shape({
      firstName: Yup.string().required("First Name is required"),
      lastName: Yup.string().required("Last Name is required"),
      street: Yup.string().required("Street is required"),
      city: Yup.string().required("City is required"),
      //state: Yup.string().required("State is required"),
      country: Yup.string().required("Country is required"),
      zipcode: Yup.string().required("Zip Code is required"),
    }),
    onSubmit: async (values) => {
      const newAddressDetails = {
        street: values.street,
        street2: values.street2,
        city: values.city,
        state: values.state,
        country: values.country,
        zipcode: values.zipcode
      }

      setSubmitted(true);
      setDisableButton(true);
      const userData: userUpdateDataInterface = {
        firstName: values.firstName,
        lastName: values.lastName,
      };
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
        ]).finally(async () => {
          getUserDetails();
          setDisableButton(false);
          setSubmitted(false);
          toast.success("Details updated successfully......");
          if (!_.isEqual(address, newAddressDetails)) {
            // const response = sendMail({
            //   sendTo: values.email,
            //   subject: 'Address Update',
            //   text: 'Your Address Updated Sucessfully.',
            // })
            const data = {
              mainHeading: "Address Update",
              message: "Your Address Updated Sucessfully."
            }
            const response = await sendMail({
              sendTo: values.email,
              subject: 'Address Update',
              template: 'addressUpdateTemplate',
              context: data
            }, { extension: '.html', dirpath: './EmailTemplates' })
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
      getUserById(userId, ["first_name", "last_name", "user_email"]),
      getUserMeta(userId),
    ]).then(
      (results: [userDbFieldsInterface, UserMetaDataInterface[]] | any) => {
        setShowSpinner(false);
        if (Array.isArray(results) && results.length > 0) {
          const userDetails: userDbFieldsInterface = results[0];
          const userMetaDetails: UserMetaDataInterface[] = results[1];
          const newValues = {
            firstName: userDetails.first_name ?? "",
            lastName: userDetails.last_name ?? "",
            email: userDetails.user_email ?? "",
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
            street: userMetaDetails.find((x) => x.meta_key == "street")?.meta_value ?? "",
            street2: userMetaDetails.find((x) => x.meta_key == "street2")?.meta_value ?? "",
            city: userMetaDetails.find((x) => x.meta_key == "city")?.meta_value ?? "",
            state: userMetaDetails.find((x) => x.meta_key == "state")?.meta_value ?? "",
            country: userMetaDetails.find((x) => x.meta_key == "country")?.meta_value ?? "",
            zipcode: userMetaDetails.find((x) => x.meta_key == "zip_code")?.meta_value ?? ""
          })
          formik.setValues(newValues);
        } else {
          // console.log("result is of type:", results);
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
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
    </div>
  ) : (
    <div>
      {/* <Card md="12">
        <CommonCardHeader
          title={headerProps.title}
          span={headerProps.span}
        ></CommonCardHeader>
        <CardBody> */}
      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <h3>Basic Details:</h3>
          </div>
          <Row className="g-3">
            <Col sm="6">
              <Label check>
                First Name<span className="txt-danger">*</span>
              </Label>
              <Field
                name="firstName"
                type="text"
                className="form-control"
                placeholder="Enter First Name"
              />
              {formik.errors.firstName && submitted && (
                <div className="text-danger mt-2">
                  {formik.errors.firstName}
                </div>
              )}
            </Col>
            <Col sm="6">
              <Label check>
                Last Name<span className="txt-danger">*</span>
              </Label>
              <Field
                name="lastName"
                type="text"
                className="form-control"
                placeholder="Enter Last Name"
              />
              {formik.errors.lastName && submitted && (
                <div className="text-danger mt-2">
                  {formik.errors.lastName}
                </div>
              )}
            </Col>
            <Col sm="6">
              <Label check>Email</Label>
              <Field
                name="email"
                type="email"
                className="form-control"
                placeholder="Enter Email"
                disabled="true"
              />
            </Col>
          </Row>
          <div className="mb-3 mt-3">
            <h3>Address Details:</h3>
          </div>
          <Row className="g-3">
            <Col sm="6">
              <Label check>
                Street<span className="txt-danger">*</span>
              </Label>
              <Field
                name="street"
                type="text"
                className="form-control"
                placeholder="Enter Street"
              />
              {formik.errors.street && submitted && (
                <div className="text-danger mt-2">
                  {formik.errors.street}
                </div>
              )}
            </Col>
            <Col sm="6">
              <Label check>Street2</Label>
              <Field
                name="street2"
                type="text"
                className="form-control"
                placeholder="Enter Street2"
              />
            </Col>
            <Col sm="6">
              <Label check>
                City<span className="txt-danger">*</span>
              </Label>
              <Field
                name="city"
                type="text"
                className="form-control"
                placeholder="Enter City"
              />
              {formik.errors.city && submitted && (
                <div className="text-danger mt-2">{formik.errors.city}</div>
              )}
            </Col>
            <Col sm="6">
              <Label check>
                State<span className="txt-danger">*</span>
              </Label>
              <Input
                type="select"
                className="rounded"
                name="state"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                style={{
                  border: "1px dashed rgba(106, 113, 133, 0.3)",
                }}
                placeholder="Enter State"
              >
                <option>{"Select a state"}</option>
                {usStates.map((state: any) => (
                  <option key={state.isoCode} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </Input>
              {submitted && !selected && (
                <div className="text-danger mt-2">
                  {"State is required"}
                </div>
              )}
            </Col>
            <Col sm="6">
              <Label check>
                Country<span className="txt-danger">*</span>
              </Label>
              <Field
                name="country"
                type="text"
                className="form-control"
                placeholder="Enter Country"
              />
              {formik.errors.country && submitted && (
                <div className="text-danger mt-2">
                  {formik.errors.country}
                </div>
              )}
            </Col>
            <Col sm="6">
              <Label check>
                Zip Code<span className="txt-danger">*</span>
              </Label>
              <Field
                name="zipcode"
                type="text"
                className="form-control"
                placeholder="Enter Zip Code"
              />
              {formik.errors.zipcode && submitted && (
                <div className="text-danger mt-2">
                  {formik.errors.zipcode}
                </div>
              )}
            </Col>
          </Row>
          <Row>
            <Col md="10"></Col>
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
      {/* </CardBody>
      </Card> */}
    </div>
  );
};

export default UserDetails;
