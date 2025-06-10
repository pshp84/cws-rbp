import {
  getMembershipPlans,
  getTransactions,
  getUserById,
  getUserMembership,
  getUserMeta,
  updateMembership,
  membershipStatus,
  userDbFieldsInterface
} from "@/DbClient";
import {
  Membership,
  MemberShipPlans,
  MembershipTransaction,
} from "@/Types/Membership";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Button,
  FormGroup,
  Label
} from "reactstrap";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
import moment from "moment";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import { useFormik, FormikProvider, Field } from "formik";
import * as Yup from "yup";
import { sendMail } from '@/Helper/mailSender';

type TransactionMeta = {
  [key: string]: string;
};

const ViewMembershipDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const userId = id;
  const getUserId = localStorage.getItem("userId");
  const [users, setUsers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [planId, setPlanId] = useState<number>();
  const [plans, setPlans] = useState<MemberShipPlans[]>([]);
  const [name, setName] = useState<any>();
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [membershipId, setMembershipId] = useState<number>();
  const [membershipData, setMembershipData] = useState<MembershipTransaction[]>(
    []
  );
  const [metaData, setMetaData] = useState<TransactionMeta>({});
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [methodType, setMethodType] = useState<string>("");
  const [achData, setAchData] = useState<any>();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(50);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [disableUpdateButton, setDisableUpdateButton] = useState(false);

  const headerProps: CommonCardHeaderProp = {
    title: "Membership Details",
    span: [{ text: "Check Current membership details." }],
  };

  const getMembershipDeatils = async () => {
    try {
      setLoading(true);
      const result = await getUserMembership(userId as string, true);
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

  const getPlanById = async () => {
    try {
      const result = await getMembershipPlans();
      if (result) {
        setPlans(result);
      }
    } catch (error) { }
  };

  const fetchUserById = async () => {
    try {
      const result = await getUserById(userId as string);
      if (result) {
        setName(result);
      }
    } catch (error) { }
  };

  const membershipMeta = async (page: number = 0) => {
    try {
      setIsLoading(true);
      const data = await getTransactions({
        page: page === 0 ? currentPage : page,
        membershipID: membershipId,
        limit: perPage,
        order: displayOrder,
        orderBy: "created_at",
      });
      const result1 = await getUserMeta(
        getUserId as string,
        "banquest_payment_method_type"
      );
      setMethodType(result1[0].meta_value);
      if (data && data.data && data.status) {
        if (data.totalRecords) setTotalRecords(data.totalRecords);
        if (data.totalPages) setTotalPages(data.totalPages);
        setMembershipData(data.data);

        const transactionMetaData: TransactionMeta = {};
        const getData = data.data.map((el) => el);

        const getMemberShipMeta =
          getData && getData.map((el) => el.membership_transactionmeta);
        const transactionStatus =
          getData && getData.map((el) => el.transaction_status);
        if (transactionStatus) {
          if (transactionStatus[0] === "pending") {
            const banquestData = getMemberShipMeta[0];
            const achPaymentData = JSON.parse(banquestData[0].meta_value);
            setAchData(achPaymentData);
            // const result: any = {};
            // if(banquestData){
            //  console.log("banquestData",banquestData)
            // }
          } else {
            if (getMemberShipMeta) {
              getMemberShipMeta[0].forEach((meta: any) => {
                transactionMetaData[meta.meta_key] = meta.meta_value;
              });
              setMetaData(transactionMetaData);
            }
          }
        }
        // if (getMemberShipMeta) {
        //   getMemberShipMeta[0].forEach((meta: any) => {
        //     transactionMetaData[meta.meta_key] = meta.meta_value;
        //   });
        //   setMetaData(transactionMetaData);
        // }
        setIsLoading(false);
      }
    } catch (error) { }
  };

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
        const result = await updateMembership(membershipId as number, { status: values.status as membershipStatus });
        if (typeof (result) == 'boolean' && !result) {
          toast.error("Something went wrong.Please try again later!");
          setSubmitted(false);
          setDisableUpdateButton(false);
        }
        const user: userDbFieldsInterface = await getUserById(userId as string, ["user_email"]) as userDbFieldsInterface;
        toast.success("Membership Status Updated Sucessfully......");
        getMembershipDeatils();
        const dataTemplate = {
          heading: "Membership Status Update",
          textMessage: "Your Membership Status Updated Sucessfully."
        }
        const response = await sendMail({
          sendTo: user.user_email,
          subject: 'Membership Status Update',
          template: 'membershipStatusUpdate',
          context: dataTemplate
        }, { extension: '.html', dirpath: './EmailTemplates' })
        setSubmitted(false);
        setDisableUpdateButton(false);
      } catch (error) {
        toast.error("Something went wrong.Please try again later!");
        setSubmitted(false);
        setDisableUpdateButton(false);
      }
    },
  });

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);
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

  useEffect(() => {
    getMembershipDeatils();
    getPlanById();
    fetchUserById();
    membershipMeta(currentPage);
  }, [id, planId, currentPage, perPage, displayOrder]);

  const columns = [
    {
      name: "ID",
      selector: (row: MembershipTransaction) =>
        `${methodType === "ach"
          ? achData && achData.id
          : metaData && metaData.banquest_transaction_id
        }`,
      sortable: false,
      width: "80px",
    },
    {
      name: "Description",
      selector: (row: MembershipTransaction) =>
        `${methodType === "ach"
          ? achData && achData.transaction_details.description
          : metaData && metaData.banquest_transaction_description
        }`,
      sortable: false,
      width: "350px",
    },
    {
      name: "Amount",
      cell: (row: MembershipTransaction) => {
        const amount = row.membership_plans.plan_amount ?? 0;
        const formattedAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
        return `${formattedAmount}`;
      },

      sortable: false,
    },
    {
      name: "Payment Method",
      selector: (row: MembershipTransaction) =>
        `${methodType === "ach"
          ? `${achData && achData.check_details.account_type}/${`....${achData && achData.check_details.account_number_last4
          }`}`
          : `${metaData && metaData.banquest_transaction_card_details_card_type
          }/${`....${metaData && metaData.banquest_transaction_card_last4
          }`}`
        }`,
      sortable: false,
      width: "140px",
    },
    {
      name: "Status",
      selector: (row: MembershipTransaction) => `${row.transaction_status}`,
      sortable: false,
    },
    {
      name: "Date",
      selector: (row: MembershipTransaction) =>
        `${moment(row.created_at).format("MM/DD/YYYY")}`,
      sortable: false,
      width: "100px",
    },
  ];

  const plansId = users && users.map((el) => el.plan_id);

  const actionOptions = [
    {
      id: "suspend",
      name: "Suspend",
    },
    {
      id: "refund",
      name: "Redund",
    },
    {
      id: "cancel",
      name: "Cancel",
    },
  ];

  const handleActionClick = () => {
    setSubmitted(true);
    if (!selectedValue) {
      return;
    } else {
      // if (selectedValue === "cancel") {
      //   toast.success("Work in progress");
      // }
      toast.success("Work in progress");
      setSubmitted(false);
    }
  };

  if (!users || !plans) {
    return (
      <>
        <div>Loading...</div>
      </>
    );
  }

  return (
    <>
      <div className="list-product-header mb-3">
        {/* <Button
        style={{ marginBottom: "10px" }}
        onClick={() => router.push("/admin/memberships")}
      >
        Back
      </Button> */}
        <Link className="btn btn-primary" href={`/admin/memberships`}>
          <i className="fa fa-arrow-left" />
          {"Back"}
        </Link>
      </div>
      <Container fluid>
        <Row>
          <Col md="12">
            <Card>
              <CardBody>
                <div className="mb-3">
                  <h3>Membership Details:</h3>
                </div>
                <Row>
                  <Col md="8">
                    <span className="text-truncate f-w-600">Membership: </span>
                  </Col>
                  <Col md="4">
                    <div className="text-right">
                      {plans &&
                        plans.map((el) =>
                          el.plan_id === plansId[0] ? el.plan_name : ""
                        )}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md="8">
                    <span className="text-truncate f-w-600">Status: </span>
                  </Col>
                  <Col md="4">
                    <div className="text-right">
                      <span className={"text-success"}>
                        {users && users.map((el) => el.status)}
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
                      {users &&
                        users.map((el) =>
                          el.next_payment_date
                            ? moment(el.next_payment_date).format("MM/DD/YYYY")
                            : "-"
                        )}
                    </div>
                  </Col>
                </Row>
                <hr/>
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
                              className="form-control form-select">
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
                          <Button block color="primary" type="submit" disabled={disableUpdateButton} onClick={() => setSubmitted(true)}>
                            Update
                          </Button>
                        </div>
                      </Col>
                      </Row>
                    </form>
                  </FormikProvider>
                </Row>
                {/* <Card className="light-card">
                  <CommonCardHeader
                    title={headerProps.title}
                    span={headerProps.span}
                  ></CommonCardHeader>

                  <CardBody>
                    <Row>
                      <Col md="8">
                        <span className="text-truncate f-w-600">
                          Membership:{" "}
                        </span>
                      </Col>
                      <Col md="4">
                        <div className="text-right">
                          {plans &&
                            plans.map((el) =>
                              el.plan_id === plansId[0] ? el.plan_name : ""
                            )}
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="8">
                        <span className="text-truncate f-w-600">Status: </span>
                      </Col>
                      <Col md="4">
                        <div className="text-right">
                          <span className={"text-success"}>
                            {users && users.map((el) => el.status)}
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
                          {users &&
                            users.map((el) =>
                              el.next_payment_date
                                ? moment(el.next_payment_date).format(
                                    "MM/DD/YYYY"
                                  )
                                : "-"
                            )}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>
                </Card> */}

                {/* <Col md="4">
                  <Card>
                    <CardBody>
                      <Row>
                        <Col md="8">
                          <span className="text-truncate f-w-600">Actions</span>
                          <div>
                            <Input
                              style={{ marginTop: "0.5rem", width: "15rem" }}
                              type="select"
                              value={selectedValue}
                              onChange={(e) => setSelectedValue(e.target.value)}
                            >
                              <option value="">{"Select action"}</option>
                              {actionOptions.map((data, optionIndex) => (
                                <option key={optionIndex} value={data.id}>
                                  {data.name}
                                </option>
                              ))}
                            </Input>
                            {submitted && !selectedValue && (
                              <div style={{ color: "red", marginTop: "5px" }}>
                                {"Action is required"}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={handleActionClick}
                            style={{ marginTop: "2rem" }}
                          >
                            Save
                          </Button>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </Col> */}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <div className="deals-listing col-12 mb-4">
        <div className="deals-listing-top-bar d-flex justify-content-end align-items-center gap-2 mb-3">
          <div className="flex-fill">
            {!isLoading && (
              <div className="d-flex align-items-center gap-2">
                {PaginationInfo({ currentPage, limit: perPage, totalRecords })}
                <span>|</span>
                <div className="d-flex align-items-center gap-1">
                  <span>Per Page:</span>
                  <Dropdown
                    size="sm"
                    isOpen={perPageDropdownOpen}
                    toggle={togglePerPageDropdown}
                  >
                    <DropdownToggle className="px-2 py-1" color="primary" caret>
                      {perPage}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem onClick={() => setPerPage(10)}>
                        10
                      </DropdownItem>
                      <DropdownItem onClick={() => setPerPage(20)}>
                        20
                      </DropdownItem>
                      <DropdownItem onClick={() => setPerPage(50)}>
                        50
                      </DropdownItem>
                      <DropdownItem onClick={() => setPerPage(80)}>
                        80
                      </DropdownItem>
                      <DropdownItem onClick={() => setPerPage(100)}>
                        100
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
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
                  <th>Status</th>
                  <th>
                    Date
                    {/* &nbsp;
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const newDisplayOrder =
                          displayOrder == "asc" ? "desc" : "asc";
                        setDisplayOrder(newDisplayOrder);
                      }}
                    >
                      <i className={`fa fa-sort-${displayOrder}`}></i>
                    </a> */}
                  </th>
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
                    return (
                      <tr key={`transaction-tr-${membershipIndex}`}>
                        <td>
                          {`${methodType === "ach"
                            ? achData && achData.id
                            : metaData && metaData.banquest_transaction_id
                            }`}
                        </td>
                        <td className="">
                          {`${methodType === "ach"
                            ? achData &&
                            achData.transaction_details.description
                            : metaData &&
                            metaData.banquest_transaction_description
                            }`}
                        </td>
                        <td>{formatPlanAmount(membership)}</td>
                        <td>{`${methodType === "ach"
                          ? `${achData && achData.check_details.account_type
                          }/${`....${achData &&
                          achData.check_details.account_number_last4
                          }`}`
                          : `${metaData &&
                          metaData.banquest_transaction_card_details_card_type
                          }/${`....${metaData &&
                          metaData.banquest_transaction_card_last4
                          }`}`
                          }`}</td>
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
          <div className="d-flex justify-content-end align-items-center gap-2">
            <div className="flex-fill">
              {PaginationInfo({ currentPage, limit: perPage, totalRecords })}
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

      {/* <Container fluid>
        <Row>
          <Col md="12" sm="11">
            <Card>
              <CardBody>
                <div className="list-product">
                  <div
                    style={{ width: "100%", cursor: "pointer" }}
                    className="table-responsive"
                  >
                    <div>
                      <div
                        style={{ fontSize: "1rem", paddingBottom: "10px" }}
                      ><h3>Membership Tranasactions Data:</h3></div>
                    </div>

                    <DataTable
                      className="theme-scrollbar"
                      data={membershipData}
                      columns={columns}
                      striped
                      highlightOnHover
                      pagination
                      paginationServer
                      paginationTotalRows={totalPages * 10}
                      onChangePage={(page: number) => setCurrentPage(page)}
                      progressPending={loading}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container> */}
    </>
  );
};

const PaginationInfo = ({
  totalRecords,
  limit,
  currentPage,
}: {
  totalRecords: number;
  limit: number;
  currentPage: number;
}) => {
  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <p className="m-0">
      Showing <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{totalRecords}</span>
    </p>
  );
};

export default ViewMembershipDetails;
