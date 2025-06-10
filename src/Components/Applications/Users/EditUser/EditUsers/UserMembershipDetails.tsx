"use client";
import { useEffect, useState } from "react";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import {
  Card,
  CardBody,
  Col,
  Row,
  Spinner,
  FormGroup,
  Button,
  Label,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  DropdownMenu,
} from "reactstrap";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import { FormCallbackProp } from "@/Types/TabType";
import {
  Membership,
  MemberShipPlans,
  MembershipTransaction,
} from "@/Types/Membership";
import {
  getUserMembershipByPlan,
  getMembershipPlans,
  membershipsDbFieldsInterface,
  updateMembership,
  membershipStatus,
  getUserMembership,
  getTransactions,
} from "@/DbClient/memberships";
import { useParams, useRouter } from "next/navigation";
import { useFormik, FormikProvider, Field } from "formik";
import * as Yup from "yup";
import { sendMail } from "@/Helper/mailSender";
import { toast } from "react-toastify";
import { getUserById, getUserMeta, userDbFieldsInterface } from "@/DbClient";
import moment from "moment";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";

type TransactionMeta = {
  [key: string]: string;
};

const UserMembershipDetails: React.FC<FormCallbackProp> = ({
  callbackActive,
}) => {
  const userId = useParams();
  const id = userId.id;
  const getUserId = localStorage.getItem("userId");

  const headerProps: CommonCardHeaderProp = {
    title: "Membership Details",
    span: [{ text: "Check Current membership details." }],
  };

  const [membership, setMembership] = useState<any>([]);
  const [membershipPlan, setMembershipPlan] = useState<any>([]);
  const [showSpinner, setShowSpinner] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [disableUpdateButton, setDisableUpdateButton] = useState(false);
  const [membershipId, setMembershipId] = useState<number>();

  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<Membership[]>([]);
  const [planId, setPlanId] = useState<number>();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(50);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [membershipData, setMembershipData] = useState<MembershipTransaction[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

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

  const getMembershipDeatils = async () => {
    try {
      setLoading(true);
      const result = await getUserMembership(id as string, true);
      if (result) {
        setUsers([result]);
        setPlanId(result.plan_id);
        setMembershipId(result.membership_id);
        setLoading(false);
      }
    } catch (error) {
      setUsers([]);
    }
  };

  const membershipMeta = async (page: number = 0) => {
    if (!membershipId) return;
    try {
      setIsLoading(true);
      const data = await getTransactions({
        page: page === 0 ? currentPage : page,
        membershipID: membershipId,
        limit: perPage,
        order: displayOrder,
        orderBy: "created_at",
      });
      if (data && data.data && data.status) {
        if (data.totalRecords) setTotalRecords(data.totalRecords);
        if (data.totalPages) setTotalPages(data.totalPages);
        setMembershipData(data.data);
        setIsLoading(false);
      }
    } catch (error) { }
  };

  const getPlanName = (planId: number) => {
    if ((membershipPlan ?? null) !== null) {
      const planName = (membershipPlan as MemberShipPlans[])?.find(
        (x) => x.plan_id == planId
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

  const fetchMembershipDetails = async () => {
    try {

      const getData = await getUserMembershipByPlan(id as string, 2);
      //console.log("getData", getData);

    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    membershipMeta()
  }, [currentPage, displayOrder]);

  useEffect(() => {
    membershipMeta(1)
  }, [perPage])

  useEffect(() => {
    fetchMembershipDetails();
    getMembershipDeatils()
  }, [])

  useEffect(() => {
    Promise.all([
      getUserMembership(id as string),
      getMembershipPlans(),
    ]).then((results) => {
      setMembership(results[0] as []);
      setMembershipPlan(results[1] as []);
      setShowSpinner(false);
    });
  }, [id]);

  useEffect(() => {
    membershipMeta();
  }, [membershipId]);

  const formik = useFormik({
    initialValues: {
      status: "",
    },
    validationSchema: Yup.object().shape({
      status: Yup.string().required("Please Select Status"),
    }),

    onSubmit: async (values) => {
      setSubmitted(true);
      setDisableUpdateButton(true);
      try {
        const status = values.status;
        const result = await updateMembership(membershipId as number, {
          status: values.status as membershipStatus,
        });
        if (typeof result == "boolean" && !result) {
          toast.error("Something went wrong.Please try again later!");
          setSubmitted(false);
          setDisableUpdateButton(false);
        }
        const user: userDbFieldsInterface = (await getUserById(id as string, [
          "user_email",
        ])) as userDbFieldsInterface;
        toast.success("Membership Status Updated Sucessfully......");
        getMembershipDeatils();
        const dataTemplate = {
          mainHeading: "Membership Status Update",
          message: "Your Membership Status Updated Sucessfully.",
          userEmail: user.user_email
        };
        await sendApiEmailToUser(
          {
            sendTo: user.user_email,
            subject: "Membership Status Update - RBP Club",
            template: "membershipStatusUpdate",
            context: dataTemplate,
            extension: ".html", dirpath: "public/email-templates"
          }
        );
        setSubmitted(false);
        setDisableUpdateButton(false);
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        setSubmitted(false);
        setDisableUpdateButton(false);
      }
    },
  });

  const handlePageChange = (page: number) => setCurrentPage(page);

  const formatPlanAmount = (row: any) => {
    const amount = row.membership_plans?.plan_amount ?? 0;

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return formattedAmount;
  };

  return (
    <>
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
          <Card className="">
            <CommonCardHeader
              title={headerProps.title}
              span={headerProps.span}
            ></CommonCardHeader>
            <CardBody>
              <Row>
                <Col md="8">
                  <span className="text-truncate f-w-600">Membership: </span>
                </Col>
                <Col md="4">
                  <div className="text-right">
                    {(membership?.plan_id ?? null) == null
                      ? "-"
                      : getPlanName(membership?.plan_id)}
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
                        membership?.status === "active" ? "text-success" : ""
                      }
                    >
                      {(membership?.status ?? null) == null
                        ? "-"
                        : getPlanStatus(membership?.status)}
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
                    {(membership?.next_payment_date ?? null) == null
                      ? "-"
                      : formatDate(membership?.next_payment_date)}
                  </div>
                </Col>
              </Row>
              <hr />
              <div className="mt-3 mb-3">
                <h3>Update Membership Status:</h3>
              </div>
              <Row>
                <FormikProvider value={formik}>
                  <form onSubmit={formik.handleSubmit}>
                    <Row>
                      <Col md="12">
                        <FormGroup>
                          <Label check>Change Membership Plan Status:</Label>
                          <Field
                            as="select"
                            name="status"
                            placeholder="Select Membership Status Plan"
                            className="form-control form-select"
                          >
                            <option value="">Select Status</option>
                            <option value="hold">Hold</option>
                            <option value="suspend">Suspend</option>
                          </Field>
                          {formik.errors.status &&
                            (submitted || formik.touched) && (
                              <div className="text-danger mt-2">
                                {formik.errors.status}
                              </div>
                            )}
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="10"></Col>
                      <Col md="2">
                        <div className="text-right">
                          <Button
                            block
                            color="primary"
                            type="submit"
                            disabled={disableUpdateButton}
                            onClick={() => setSubmitted(true)}
                          >
                            Update
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </form>
                </FormikProvider>
              </Row>
            </CardBody>
          </Card>

          <div className="mt-3 mb-3 ps-2">
            <h3>{"Membership Transaction Data"}</h3>
          </div>
          <div className="deals-listing col-12 mb-4 p-6">
            <div className="deals-listing-top-bar d-flex justify-content-end align-items-center gap-2 mb-3">
              <div className="flex-fill">
                {!isLoading && (
                  <div className="d-flex align-items-center gap-2 ps-2">
                    <PaginationInfo
                      currentPage={currentPage}
                      recordsPerPage={perPage}
                      totalRecords={totalRecords}
                      showDropDown={true}
                      onPerPageChange={setPerPage}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Card/Account Holder</th>
                      <th>Last 4 Digits</th>
                      <th>Card/Account Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipData.length <= 0 && (
                      <tr>
                        <td className="text-center" colSpan={9}>
                          Transactions not found.
                        </td>
                      </tr>
                    )}
                    {membershipData.length > 0 &&
                      membershipData.map((membership, membershipIndex) => {

                        let paymentMethod: string = "";
                        let cardAccountHolder: string = "";
                        let last4Digits: string = "";
                        let cardAccountType: string = "";
                        let banquestTransactionID: string = "";
                        let banquestTransactionDescription: string = "";

                        const transactionMeta: Array<{ meta_key: string, meta_value: string }> = membership.membership_transactionmeta;
                        if (transactionMeta && transactionMeta.length > 0) {
                          const metaPrefix: string = "banquest_transaction_";
                          const btID = transactionMeta.filter(data => data.meta_key == metaPrefix + "id")[0];
                          banquestTransactionID = btID?.meta_value || "";

                          const btDescription = transactionMeta.filter(data => data.meta_key == metaPrefix + "description")[0];
                          banquestTransactionDescription = btDescription?.meta_value || "";

                          const checkDetailsFields = [
                            metaPrefix + "check_details_name",
                            metaPrefix + "check_details_routing_number",
                            metaPrefix + "check_details_account_number_last4",
                            metaPrefix + "check_details_account_type"
                          ];
                          const achDetails = transactionMeta.filter(data => checkDetailsFields.includes(data.meta_key));

                          const cardDetailsFields = [
                            metaPrefix + "card_details_name",
                            metaPrefix + "card_last4",
                            metaPrefix + "card_details_expiry_month",
                            metaPrefix + "card_details_expiry_year",
                            metaPrefix + "card_details_card_type"
                          ];
                          const ccDetails = transactionMeta.filter(data => cardDetailsFields.includes(data.meta_key));

                          if (achDetails.length > 0) {
                            paymentMethod = `ACH`;
                            cardAccountHolder = achDetails.find(data => data.meta_key == metaPrefix + "check_details_name")?.meta_value || "";
                            last4Digits = achDetails.find(data => data.meta_key == metaPrefix + "check_details_account_number_last4")?.meta_value || "";
                            cardAccountType = achDetails.find(data => data.meta_key == metaPrefix + "check_details_account_type")?.meta_value || "";
                          } else if (ccDetails.length > 0) {
                            paymentMethod = `Credit Card`;
                            cardAccountHolder = ccDetails.find(data => data.meta_key == metaPrefix + "card_details_name")?.meta_value || "";
                            last4Digits = ccDetails.find(data => data.meta_key == metaPrefix + "card_last4")?.meta_value || "";
                            cardAccountType = ccDetails.find(data => data.meta_key == metaPrefix + "card_details_card_type")?.meta_value || "";
                          }
                        }
                        return (
                          <tr key={`transaction-tr-${membershipIndex}`}>
                            <td>{banquestTransactionID}</td>
                            <td className="">{banquestTransactionDescription}</td>
                            <td>{formatPlanAmount(membership)}</td>
                            <td>{paymentMethod}</td>
                            <td>{cardAccountHolder != "" ? cardAccountHolder : `-`}</td>
                            <td>{last4Digits !== "" ? `***${last4Digits}` : `-`}</td>
                            <td>{cardAccountType != "" ? cardAccountType : `-`}</td>
                            <td>{membership.transaction_status}</td>
                            <td>
                              {`${membership.created_at
                                ? moment(membership.created_at).format(
                                  "MM/DD/YYYY"
                                )
                                : ""
                                }`}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {!isLoading && membershipData.length > 0 && (
              <div className="d-flex justify-content-end align-items-center gap-2 ps-2">
                <div className="flex-fill">
                  <PaginationInfo
                    currentPage={currentPage}
                    recordsPerPage={perPage}
                    totalRecords={totalRecords}
                  />
                </div>

                {totalPages > 1 && (
                  <PaginationComponent
                    totalRecords={totalRecords}
                    perPage={perPage}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </Col>
      )}
    </>
  );
};

export default UserMembershipDetails;
