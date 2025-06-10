import React, { useEffect, useState } from "react";
import { useFormik, FormikProvider, Field } from "formik";
import {
  Col,
  Row,
  Label,
  Button,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import * as Yup from "yup";
import {
  addLeaseInfo,
  getLeaseInfo,
  leaseInfoDBInterface,
  updateLeaseInfo,
  updateLeaseInfoArgs,
} from "@/DbClient";
import { toast } from "react-toastify";

const UserRent = ({ onComplete }: { onComplete: () => void }) => {
  const userId = localStorage.getItem("userId");
  const [submitted, setSubmitted] = useState(false);
  const [days, setDays] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [isData, setIsData] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchRentDetails = async () => {
    try {
      const result = await getLeaseInfo(userId as string);
      if (result) {
        setData(result);
        formik.setFieldValue(
          "rent_amount",
          (result as leaseInfoDBInterface).rent_amount
        );
        const val = (result as leaseInfoDBInterface).rent_date;
        setSelectedDay(val as string);
      } else {
        setIsData(true);
        setData(null);
      }
    } catch (err) {}
  };

  const getDaysOfMonth = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const daysArray = [];
    for (let day = 1; day <= lastDayOfMonth; day++) {
      daysArray.push(day);
    }
    setDays(daysArray);
  };

  const formik = useFormik({
    initialValues: {
      rent_amount: "",
    },
    validationSchema: Yup.object().shape({
      rent_amount: Yup.string().required("Rent amount is required."),
    }),
    onSubmit: async (values) => {
      setSubmitted(true);
      try {
        const updatedValues: updateLeaseInfoArgs = {
          rentAmount: Number(values.rent_amount),
          rentDate: selectedDay,
        };
        if (!isData) {
          const result = await updateLeaseInfo(userId as string, updatedValues);
          if (result) {
            fetchRentDetails();
            toast.success("Details updated successfully......");
            // router.push("/dashboard")
            onComplete();
          } else {
            toast.error("Something went wrong.");
          }
        } else {
          const result1 = await addLeaseInfo({
            userID: userId as string,
            rentAmount: updatedValues.rentAmount,
            rentDate: updatedValues.rentDate,
          });

          if (result1) {
            fetchRentDetails();
            toast.success("Details added successfully......");
            // router.push("/dashboard")
            onComplete();
          } else {
            toast.error("Something went wrong.");
          }
        }
      } catch (err) {}
    },
  });

  useEffect(() => {
    getDaysOfMonth();
    fetchRentDetails();
  }, []);

  return (
    <>
      <div className="user-signup-page ff-sora user-rent-screen tab-view">
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <h4>Rent</h4>
              <span>Complete these actions to fully setup your account</span>
              <hr className="mt-2" />
            </div>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label className="col-form-label">
                    Rent Amount<span className="txt-danger">*</span>
                  </Label>

                  <div className="position-relative">
                    <InputGroup>
                      <InputGroupText>$</InputGroupText>
                      <Field
                        className="form-control ff-sora"
                        type={"number"}
                        name="rent_amount"
                        placeholder="Rent Amount"
                      />
                    </InputGroup>
                    <span className="mt-2">
                      Please enter the total monthly rent amount in USD.
                    </span>
                  </div>

                  {formik.errors.rent_amount && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.rent_amount}
                    </div>
                  )}
                  {formik.values.rent_amount.length <=0 && (
                     <div className="text-danger mt-2">
                     {"Please enter the rent amount."}
                   </div>
                  )}
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label className="col-form-label">
                    Rent Day<span className="txt-danger">*</span>
                  </Label>
                  <span></span>
                  <div className="position-relative">
                    {/* <Field
                      className="date_dropdown ff-sora"
                      as="select"
                      id="rent_date"
                      name="rent_date"
                      value={formik.values.rent_amount}
                      onChange={formik.handleChange}
                    >
                      <option value="">Select Day</option>
                      {days.map((day, i) => {
                        const formattedDay = `0${day}`.slice(-2);
                        console.log(formattedDay);
                        return (
                          <option key={i} value={formattedDay as string}>
                            {formattedDay}
                          </option>
                        );
                      })}
                    </Field> */}

                    <select
                      className="form-select rounded ff-sora"
                      id="rent_date"
                      name="rent_date"
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                    >
                      <option value="">Select Day</option>
                      {days.map((day, i) => {
                        const formattedDay = `0${day}`.slice(-2);
                        return (
                          <option key={i} value={formattedDay as string}>
                            {formattedDay}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {submitted && !selectedDay && (
                    <div className="text-danger mt-2">
                      {"Rent day is required."}
                    </div>
                  )}
                  {/* {formik.errors.rent_date && submitted && (
                    <div className="text-danger mt-2">
                      {formik.errors.rent_date}
                    </div>
                  )} */}
                </FormGroup>
              </Col>
            </Row>

            <FormGroup className="mb-0">
              <Row>
                <Col md="6"></Col>
                <Col md="2" className="ms-auto">
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
                    // disabled={disableButton}
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
      </div>
    </>
  );
};

export default UserRent;
