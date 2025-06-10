"use client";

import { calculateNextRunDate } from "@/app/api/banquest/banquestConfig";
import { addUserToBrevo } from "@/CommonComponent/brevoContactLists";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import { sendApiEmailToUser } from "@/CommonComponent/SendEmailToUser";
import withAuth from "@/Components/WithAuth/WithAuth";
import {
  addMembership,
  freeMembershipsRequestsDBInterface,
  FreeMembershipsRequestStatus,
  getFreeMembershipsRequests,
  getFreeMembershipsRequestsArgs,
  getMembershipPlan,
  membershipPlanFrequency,
  membershipStatus,
  updateFreeMembershipsRequestStatus,
} from "@/DbClient";
import { formatDate, priceFormat } from "@/Helper/commonHelpers";
import { sendMail } from "@/Helper/mailSender";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

interface utmCampaignData {
  campaignID?: string | number;
  campaignName?: string;
  source?: string;
  medium?: string;
  content?: string;
  term?: string;
  userIP?: string;
}

const FreeMembershipRequestAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
  const [freeMembershipsRequestsList, setFreeMembershipsRequestsList] =
    useState<Array<freeMembershipsRequestsDBInterface>>([]);
  const [statusFilter, setStatusFilter] = useState<
    "approved" | "pending" | "rejected" | undefined
  >();
  const [utmCampaignData, setUtmCampaignData] = useState<
    utmCampaignData | undefined
  >();
  const [modal, setModal] = useState(false);

  const modalToggle = () => setModal(!modal);

  const fetchUserList = async (page: number = 0) => {
    if (isLoading) return;
    setIsLoading(true);
    let pageNumber = currentPage;
    if (page !== 0) {
      pageNumber = page;
      setCurrentPage(page);
    }

    const getFreeMembershipsRequestsArgs: getFreeMembershipsRequestsArgs = {
      limit: perPage,
      page: pageNumber,
      order: displayOrder,
    };
    if (statusFilter) getFreeMembershipsRequestsArgs.status = statusFilter;
    const data = await getFreeMembershipsRequests(
      getFreeMembershipsRequestsArgs
    );

    if (typeof data == "boolean") {
      setFreeMembershipsRequestsList([]);
      setIsLoading(false);
      return;
    }

    const {
      status,
      data: freeMembershipsRequests,
      message,
      totalPages,
      totalRecords,
    } = data;

    if (!status) {
      setFreeMembershipsRequestsList([]);
      setIsLoading(false);
      return;
    }

    if (freeMembershipsRequests)
      setFreeMembershipsRequestsList(freeMembershipsRequests);
    if (totalRecords) setTotalRecords(totalRecords);
    if (totalPages) setTotalPages(totalPages);
    setIsLoading(false);
  };

  const subscribeToFreeMembership = async (userID: string) => {
    const membershipId = await addMembership({
      planId: 4,
      userId: userID,
      status: membershipStatus.Active,
      nextPaymentDate: new Date(
        calculateNextRunDate(membershipPlanFrequency.Biannually)
      ),
    });
    return !membershipId ? false : true;
  };

  const approveRequest = async (requestID: number) => {
    if (
      !confirm(
        "Are you sure you want approve this request? This action cannot be reversed."
      )
    )
      return;

    setIsLoading(true);

    const updateStatus = await updateFreeMembershipsRequestStatus(
      requestID,
      FreeMembershipsRequestStatus.Approved
    );

    if (!updateStatus) {
      toast.error("Something is wrong! please try again.");
      setIsLoading(false);
      return;
    }

    const requestData = freeMembershipsRequestsList.filter(
      (data) => data.request_id == requestID
    )[0];
    const userID = requestData.user_id;
    if (!userID) {
      toast.error("Something is wrong! please try again.");

      setIsLoading(false);
      return;
    }

    const freeMembershipStatus = await subscribeToFreeMembership(userID);

    if (!freeMembershipStatus) {
      toast.error("Unable to subscribe to Free Membership! please try again.");
      setIsLoading(false);
      return;
    }

    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
      siteURL,
      userName: requestData.users.first_name,
      planName: "Free Membership",
      startDate: formatDate(new Date()),
      planAmount: priceFormat(0.0),
      nextPaymentDate: "NA",
      userEmail: requestData.users.user_email
    };

    // await sendMail(
    //     {
    //         sendTo: requestData.users.user_email,
    //         subject: `Welcome to RBP Club! Let's Get Started`,
    //         template: "welcomeEmail",
    //         context: emailTemplateData,
    //     },
    //     { extension: ".html", dirpath: "./EmailTemplates" }
    // );

    await sendApiEmailToUser({
      sendTo: requestData.users.user_email,
      subject: `Welcome to RBP Club! Let's Get Started`,
      template: "welcomeEmail",
      context: emailTemplateData,
      extension: ".html",
      dirpath: "public/email-templates",
    });

    const listId = Number(process.env.NEXT_PUBLIC_BREVO_LIST_IDS);
    const brevoData = {
      email: requestData.users.user_email,
      attributes: {
        FIRSTNAME: requestData.users.firstName,
        LASTNAME: requestData.users.lastName,
        SMS: "",
      },
      listIds: [listId],
      emailBlacklisted: false,
      smsBlacklisted: false,
      listUnsubscribed: null,
    };
    await addUserToBrevo(brevoData);

    const newRequestData = freeMembershipsRequestsList.map((data) => {
      if (data.request_id == requestID) {
        return { ...data, status: FreeMembershipsRequestStatus.Approved };
      }
      data.status;
      return { ...data };
    });

    setFreeMembershipsRequestsList(newRequestData);
    toast.success("Request approved successfully.");
    setIsLoading(false);
  };

  const rejectedRequest = async (requestID: number) => {
    if (
      !confirm(
        "Are you sure you want reject this request? This action cannot be reversed."
      )
    )
      return;

    setIsLoading(true);

    const updateStatus = await updateFreeMembershipsRequestStatus(
      requestID,
      FreeMembershipsRequestStatus.Rejected
    );

    if (!updateStatus) {
      toast.error("Something is wrong! please try again.");
      setIsLoading(false);
      return;
    }

    const requestData = freeMembershipsRequestsList.filter(
      (data) => data.request_id == requestID
    )[0];

    const siteURL = process.env.NEXT_PUBLIC_NEXTAUTH_URL;
    const emailTemplateData = {
      siteURL,
      userName: requestData.users.first_name.charAt(0).toUpperCase() + requestData.users.first_name.slice(1),
      userEmail: requestData.users.user_email
    };

    // await sendMail(
    //   {
    //     sendTo: requestData.users.user_email,
    //     subject: `Your free membership request is rejected`,
    //     template: "freeMembershipRejectEmail",
    //     context: emailTemplateData,
    //   },
    //   { extension: ".html", dirpath: "./EmailTemplates" }
    // );

    await sendApiEmailToUser(
        {
          sendTo: requestData.users.user_email,
          subject: `Your free membership request is rejected`,
          template: "freeMembershipRejectEmail",
          context: emailTemplateData,
          extension: ".html", 
          dirpath: "public/email-templates"
        }
      );

    const newRequestData = freeMembershipsRequestsList.map((data) => {
      if (data.request_id == requestID) {
        return { ...data, status: FreeMembershipsRequestStatus.Rejected };
      }
      data.status;
      return { ...data };
    });

    setFreeMembershipsRequestsList(newRequestData);
    toast.success("Request rejected successfully.");
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isLoading) {
      fetchUserList();
    }
  }, [currentPage, perPage, displayOrder, statusFilter]);

  useEffect(() => {
    fetchUserList();
  }, []);

  return (
    <div className="free-membership-request-admin col-12 mb-4">
      {/* Top bar */}
      <div
        className={`rewards-points-log-top-bar d-flex justify-content-${
          isLoading ? "end" : "between"
        } align-items-center gap-2 mb-3`}
      >
        {!isLoading && (
          <PaginationInfo
            totalRecords={totalRecords}
            recordsPerPage={perPage}
            currentPage={currentPage}
            showDropDown={true}
            onPerPageChange={setPerPage}
          />
        )}

        <div className="d-flex justify-content-end align-items-center gap-2">
          <div>
            <select
              className="form-select form-select-sm"
              onChange={(e) => {
                switch (e.target.value) {
                  case "approved":
                    setStatusFilter("approved");
                    break;

                  case "pending":
                    setStatusFilter("pending");
                    break;

                  case "rejected":
                    setStatusFilter("rejected");
                    break;

                  default:
                    setStatusFilter(undefined);
                    break;
                }
              }}
              value={statusFilter}
            >
              <option value="">Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>
      {/* EOF Top bar */}

      {/* Card Table */}
      <Card className="overflow-hidden position-relative">
        <div className="table-responsive">
          {isLoading && (
            <div
              className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
              style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}
            >
              Loading please wait...
            </div>
          )}
          <table className="table">
            <thead>
              <tr>
                <th className="text-center" style={{ width: "50px" }}>
                  #
                </th>
                <th>User Name</th>
                <th>Email</th>
                <th style={{ width: "135px" }}>UTM Campaign</th>
                <th style={{ width: "125px" }}>Status</th>
                <th style={{ width: "125px" }}>
                  Date &nbsp;
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
                  </a>
                </th>
                <th className="text-center" style={{ width: "80px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
                freeMembershipsRequestsList.length > 0 &&
                freeMembershipsRequestsList.map((data, index) => {
                  return (
                    <tr key={`freeMembershipsRequestsList-${index}`}>
                      <td className="text-center">{data.request_id}</td>
                      <td>
                        <Link
                          href={`/admin/users/edit_user/${data.user_id}`}
                          target="_blank"
                        >
                          {`${data.users.first_name} ${data.users.last_name}`}
                        </Link>
                      </td>
                      <td>
                        <a href={`mailto:${data.users.user_email}`}>
                          {data.users.user_email}
                        </a>
                      </td>
                      <td>
                        {data.utmData && (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const utmDataRow = data.utmData;
                              const utmData: utmCampaignData = {};

                              if (utmDataRow.utm_campaigns.campaign_id)
                                utmData.campaignID =
                                  utmDataRow.utm_campaigns.campaign_id;
                              if (utmDataRow.utm_campaigns.utm_campaign)
                                utmData.campaignName =
                                  utmDataRow.utm_campaigns.utm_campaign;
                              if (utmDataRow.utm_campaigns.utm_content)
                                utmData.content =
                                  utmDataRow.utm_campaigns.utm_content;
                              if (utmDataRow.utm_campaigns.utm_medium)
                                utmData.medium =
                                  utmDataRow.utm_campaigns.utm_medium;
                              if (utmDataRow.utm_campaigns.utm_source)
                                utmData.source =
                                  utmDataRow.utm_campaigns.utm_source;
                              if (utmDataRow.utm_campaigns.utm_term)
                                utmData.term =
                                  utmDataRow.utm_campaigns.utm_term;
                              if (utmDataRow.user_ip)
                                utmData.userIP = utmDataRow.user_ip;

                              setUtmCampaignData(utmData);
                              modalToggle();
                            }}
                          >
                            View
                          </a>
                        )}
                        {!data.utmData && `NA`}
                      </td>
                      <td className="text-capitalize">{data.status}</td>
                      <td>{data.created_at && formatDate(data.created_at)}</td>
                      <td className="text-center">
                        {data.status == "pending" && (
                          <div className="d-flex justify-content-center align-items-center gap-2">
                            <Link
                              href={`#`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (data.request_id) {
                                  approveRequest(data.request_id);
                                }
                              }}
                            >
                              <i
                                className="fa fa-check-circle"
                                title="Approve"
                              ></i>
                            </Link>
                            <Link
                              href={`#`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (data.request_id) {
                                  rejectedRequest(data.request_id);
                                }
                              }}
                              className="text-danger"
                              title="Reject"
                            >
                              <i className="fa fa-times-circle"></i>
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

              {!isLoading && freeMembershipsRequestsList.length <= 0 && (
                <tr>
                  <td className="text-center" colSpan={7}>
                    Free memberships request not found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* EOF Card Table */}

      {/* Bottom bar */}
      {!isLoading && freeMembershipsRequestsList.length > 0 && (
        <div className="rewards-points-log-bottom-bar d-flex justify-content-between align-items-center gap-2">
          <PaginationInfo
            totalRecords={totalRecords}
            recordsPerPage={perPage}
            currentPage={currentPage}
            showDropDown={false}
          />

          {totalPages > 1 && (
            <PaginationComponent
              totalRecords={totalRecords}
              perPage={perPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
      {/* EOF Bottom bar */}

      <Modal isOpen={modal} toggle={modalToggle}>
        <ModalHeader toggle={modalToggle} className="border-bottom-0">
          UTM Campaign Details
        </ModalHeader>
        <ModalBody className="p-0">
          {utmCampaignData && (
            <table className="table table-bordered">
              <tr>
                <th>UTM Campaign ID</th>
                <td>{utmCampaignData.campaignID}</td>
              </tr>
              <tr>
                <th>UTM Campaign Name</th>
                <td>{utmCampaignData.campaignName}</td>
              </tr>
              <tr>
                <th>UTM Source</th>
                <td>{utmCampaignData.source}</td>
              </tr>
              <tr>
                <th>UTM Medium</th>
                <td>{utmCampaignData.medium}</td>
              </tr>
              <tr>
                <th>UTM Content</th>
                <td>{utmCampaignData.content}</td>
              </tr>
              <tr>
                <th>UTM Term</th>
                <td>{utmCampaignData.term}</td>
              </tr>

              <tr>
                <th>User IP</th>
                <td>{utmCampaignData.userIP}</td>
              </tr>
            </table>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default withAuth(FreeMembershipRequestAdmin);
