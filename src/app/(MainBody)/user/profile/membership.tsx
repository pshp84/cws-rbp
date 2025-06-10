"use client";
import { useEffect, useState, useRef, useId } from "react";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import {
  Card,
  CardBody,
  Col,
  Row,
  Label,
  Spinner,
  Button,
  FormGroup,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { FormCallbackProp } from "@/Types/TabType";
import { MemberShipPlans } from "@/Types/Membership";
import {
  getUserMembershipByPlan,
  getMembershipPlans,
  changeUserMembershipPlan,
} from "@/DbClient/memberships";
import { useFormik, FormikProvider, Field } from "formik";
import {
  paymentMethodDataInterface,
  updateUserPaymentMethod,
  getUserById,
  userDbFieldsInterface
} from "@/DbClient/users";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { sendMail } from '@/Helper/mailSender';

const UserMembership: React.FC<FormCallbackProp> = ({ callbackActive }) => {
  const headerProps: CommonCardHeaderProp = {
    title: "Membership Details",
    span: [{ text: "Check Current membership details." }],
  };
  const updateHeaderProps: CommonCardHeaderProp = {
    title: "Update Membership Details",
    span: [{ text: "Update membership details." }],
  };
  const [membership, setMembership] = useState<any>([]);
  const [membershipPlan, setMembershipPlan] = useState<any>([]);
  const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const cardFormRef = useRef<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  // const [planId, setPlanId] = useState('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") as string
  );
  // const [planId, setPlanId] = useState<number>();

  const formatDate = (dateString: string) => {
    if ((dateString ?? null) != null) {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      return formatter.format(date);
    } else {
      return "-";
    }
  };

  const formik = useFormik({
    initialValues: {
      planId: "",
    },
    validationSchema: Yup.object().shape({
      planId: Yup.string().required("Please Select Plan"),
    }),

    onSubmit: async (values) => {
      setSubmitted(true);
      try {
        // if (cardFormRef.current) {
        //     const cardFormData = await cardFormRef.current.getNonceToken();
        //     const planId = values.planId;
        //     const { nonce, expiryMonth, expiryYear } = cardFormData;
        //     if (!nonce || !expiryMonth || !expiryYear) {
        //         setErrorMessage("Something is wrong, please try again");
        //         return;
        //     }
        //     const customerData: paymentMethodDataInterface = {
        //         nonceToken: nonce,
        //         expiryMonth: expiryMonth,
        //         expiryYear: expiryYear,
        //         nameOnCreditCard: ""
        //     }
        //     const planChanged: boolean = await changeUserMembershipPlan(userId, Number(planId));
        //     const result: boolean = await updateUserPaymentMethod(userId, customerData);
        //     if (result && planChanged) {
        //         toast.success("Plan Changed Sucessfully......");
        //         clearCardDiv();
        //     }
        //     else {
        //         toast.error("Something went wrong.Please try again later!");
        //         setSubmitted(false)
        //         clearCardDiv()
        //     }
        // }

        const planId = values.planId;
        const planChanged: boolean = await changeUserMembershipPlan(
          userId,
          Number(planId)
        );

        if (planChanged) {
          fetchMembershipData(Number(planId));
          values.planId = "";
          toast.success("Plan Changed Sucessfully......");
          const user: userDbFieldsInterface = await getUserById(userId, ["user_email"]) as userDbFieldsInterface;
          // const response = await sendMail({
          //   sendTo: user.user_email,
          //   subject: 'Membership Update',
          //   text: 'Your Membership Updated Sucessfully.',
          // })
          const dataTemplate = {
            mainHeading: "Membership Plan Update",
            message: "Your Membership Plan Updated Sucessfully."
          }
          const response = await sendMail({
            sendTo: user.user_email,
            subject: 'Membership Update',
            template: 'membershipPlanUpdateTemplate',
            context: dataTemplate
          }, { extension: '.html', dirpath: './EmailTemplates' })
        } else {
          toast.error("Something went wrong.Please try again later!");
          setSubmitted(false);
        }
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        //clearCardDiv()
      }
    },
  });

  // function handleChangeEvent(event: any) {
  //     setErrorMessage(event.error || '');
  // }

  // function clearCardDiv() {
  //     if (cardFormRef.current) {
  //         document.getElementById("formContainer")?.remove();
  //         const newDiv = document.createElement("div");
  //         newDiv.id = "formContainer";
  //         document.getElementById("cardDetails")?.appendChild(newDiv);
  //         cardFormRef.current = undefined;
  //     }
  // }

  // function createCardDiv() {
  //     if (showSpinner) return;
  //     const hostedTokenization: any = new window.HostedTokenization(process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY);
  //     cardFormRef.current = hostedTokenization.create('card-form')
  //         .mount('#formContainer')
  //         .on('change', handleChangeEvent);
  //     return () => {
  //         clearCardDiv()
  //     };
  // }

  // useEffect(() => {
  //     createCardDiv();
  // }, [showSpinner]);

  const getPlanName = (planId: number) => {
    if ((membershipPlan ?? null) !== null) {
      const planName = (membershipPlan as MemberShipPlans[])?.find(
        (x) => x.plan_id === planId
      )?.plan_name;
      return planName;
    } else {
      return "-";
    }
  };

  const getPlanStatus = (planStatus: string) => {
    if ((planStatus ?? null) !== null && planStatus != "") {
      const planNameString = planStatus;
      return (
        planNameString.charAt(0).toUpperCase() + String(planStatus).slice(1)
      );
    } else {
      return "-";
    }
  };

  // useEffect(() => {
  //   Promise.all([
  //     getUserMembershipByPlan(localStorage.getItem("userId") as string),
  //     getMembershipPlans(),
  //   ]).then((results) => {
  //     setMembership(results[0] as []);
  //     setMembershipPlan(results[1] as []);
  //     setShowSpinner(false);
  //   });
  // }, [userId]);

  const fetchMembershipData = async (planId?: number) => {
    try {
      const [membershipData, membershipPlans] = await Promise.all([
        getUserMembershipByPlan(userId as string, planId),
        getMembershipPlans(),
      ]);
      setMembership(membershipData);
      setMembershipPlan(membershipPlans);
    } catch (error) {
    } finally {
      setShowSpinner(false);
    }
  };

  useEffect(() => {
    fetchMembershipData();
  }, [userId]);

  return (
    <div>
      {showSpinner && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "100vh" }}
        >
          <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
        </div>
      )}
      {!showSpinner && (
        <Col md="12">
          <div className="mb-3">
            <h3>Membership Details:</h3>
          </div>
          {/* <Card className="light-card">
            <CommonCardHeader
              title={headerProps.title}
              span={headerProps.span}
            ></CommonCardHeader> */}
          {/* <CardBody> */}
          <Row>
            <Col md="8">
              <span className="text-truncate f-w-600">Membership: </span>
            </Col>
            <Col md="4">
              <div className="text-right">
                {(membership[0]?.plan_id ?? null) == null
                  ? "-"
                  : getPlanName(membership[0]?.plan_id)}
              </div>
            </Col>
          </Row>
          <Row>
            <Col md="8">
              <span className="text-truncate f-w-600">Status: </span>
            </Col>
            <Col md="4">
              <div className="text-right">
                <span
                  className={
                    membership[0]?.status === "active" ? "text-success" : ""
                  }
                >
                  {(membership[0]?.status ?? null) == null
                    ? "-"
                    : getPlanStatus(membership[0]?.status)}
                </span>
              </div>
            </Col>
          </Row>
          <Row>
            <Col md="8">
              <span className="text-truncate f-w-600">
                Next Payment Date:{" "}
              </span>
            </Col>
            <Col md="4">
              <div className="text-right">
                {(membership[0]?.next_payment_date ?? null) == null
                  ? "-"
                  : formatDate(membership[0]?.next_payment_date)}
              </div>
            </Col>
          </Row>
          {/* </CardBody> */}
          {/* </Card> */}
          {/* <Card> */}
          {/* <CommonCardHeader
              title={updateHeaderProps.title}
              span={updateHeaderProps.span}
            ></CommonCardHeader>
            <CardBody> */}
          <hr />
          <div className="mb-3 mt-3">
            <h3>Update Membership Details:</h3>
          </div>
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <Row>
                <FormGroup>
                  <Label check>Change Plan</Label>
                  <Field
                    as="select"
                    name="planId"
                    placeholder="Select Plan"
                    className="form-control form-select">
                    <option value="">Select Plan</option>
                    {(membershipPlan as MemberShipPlans[]).map(
                      (item: MemberShipPlans, index: number) => (
                        <option value={item.plan_id} key={index}>
                          {item.plan_name +
                            "( " +
                            item.plan_amount +
                            " / " +
                            item.plan_frequency +
                            " )"}
                        </option>
                      )
                    )}
                  </Field>
                  {formik.errors.planId &&
                    (submitted || formik.touched) && (
                      <div className="text-danger mt-2">
                        {formik.errors.planId}
                      </div>
                    )}
                </FormGroup>
              </Row>
              {/* <Row>
                                            <div className="mt-3">
                                                <div id="cardDetails">
                                                    <div id="formContainer"></div>
                                                </div>
                                            </div>
                                        </Row> */}
              <Row>
                <Col md="10"></Col>
                <Col md="2">
                  <div className="text-right">
                    <Button block color="primary" type="submit">
                      Update
                    </Button>
                  </div>
                </Col>
              </Row>
            </form>
          </FormikProvider>
          {/* </CardBody>
          </Card> */}
        </Col>
      )}
    </div>
  );
};

export default UserMembership;
