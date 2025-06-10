"use client";

import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import withAuth from "@/Components/WithAuth/WithAuth";
import {
  getUserById,
  getUtmCampaign,
  getUtmEvents,
  getUtmEventsArgs,
  UtmEventType,
} from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "reactstrap";

const ViewUtmCampaign = () => {
  const { campaign_id } = useParams();
  const id = Number(campaign_id);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [perPage, setPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
  const [utmCampaignReport, setUtmCampaignReport] = useState<Array<any>>([]);
  const [utmCampaign, setUtmCampaign] = useState<any>();
  const [utmEventTypeFilter, setUtmEventTypeFilter] = useState<UtmEventType>();

  const fetchUtmEvents = async (page: number = 0) => {
    setIsLoading(true);
    let pageNumber = currentPage;
    if (page !== 0) {
      pageNumber = page;
      setCurrentPage(page);
    }

    const getUtmEventsArgs: getUtmEventsArgs = {
      utmID: id,
      limit: perPage,
      page: pageNumber,
      order: displayOrder
    };
    if(utmEventTypeFilter) getUtmEventsArgs.event = utmEventTypeFilter;
    const result = await getUtmEvents(getUtmEventsArgs);
    if (typeof result == "boolean") {
      setUtmCampaignReport([]);
      setIsLoading(false);
      return;
    }
    const {
      status,
      data: utmEvents,
      message,
      totalPages,
      totalRecords,
    } = result;

    if (!status || !utmEvents) {
      setUtmCampaignReport([]);
      setIsLoading(false);
      return;
    }

    setUtmCampaignReport(utmEvents);
    if (totalRecords) setTotalRecords(totalRecords);
    if (totalPages) setTotalPages(totalPages);
    setIsLoading(false);
  };

  const fetchUtmCampaign = async () => {
    setLoading(true);
    try {
      const result = await getUtmCampaign(id);
      setUtmCampaign(result);
      setLoading(false);
    } catch (err) {
      setUtmCampaign(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchUtmEvents();
    }
  }, [perPage, displayOrder, currentPage, utmEventTypeFilter]);

  useEffect(() => {
    fetchUtmCampaign();
  }, []);

  return (
    <div className="utm-campaigns-admin mb-4 col-12">
      {/* Top bar */}
      <div
        className={`rewards-points-log-top-bar d-flex justify-content-${isLoading ? "end" : "between"
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
            <select className="form-select form-select-sm" onChange={e => {
              switch (e.target.value) {
                case "link_view":
                  setUtmEventTypeFilter(UtmEventType.LinkView)
                  break;

                  case "signup":
                  setUtmEventTypeFilter(UtmEventType.Signup)
                  break;

                  case "referral":
                  setUtmEventTypeFilter(UtmEventType.Referral)
                  break;
              
                default:
                  setUtmEventTypeFilter(undefined)
                  break;
              }              
            }}>
              <option value="">Event</option>
              <option value={UtmEventType.LinkView}>Link View</option>
              <option value={UtmEventType.Signup}>Sing-Up</option>
              <option value={UtmEventType.Referral}>Referral</option>
            </select>
          </div>

          <div>
            <Link
              href={`/admin/utm-campaigns`}
              className="btn btn-sm btn-primary px-2 py-1"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
      {/* EOF Top bar */}

      <div className="row">
        <div className="col-md-4 position-relative">
          <Card className="position-sticky overflow-hidden">
            <CardHeader>Campaign Details</CardHeader>
            <CardBody className="p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Campaign Name</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? utmCampaign.utm_campaign : ''}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Source</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? utmCampaign.utm_source : ''}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Medium</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? utmCampaign.utm_medium : ''}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Content</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? utmCampaign.utm_content : ''}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Term</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? utmCampaign.utm_term : ''}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-4">
                  <b>Create Date</b>
                  <span className="text-muted">{utmCampaign && utmCampaign ? formatDate(utmCampaign.created_at) : ''}</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
        <div className="col-md-8">
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
                    <th className="text-center" style={{ width: "50px" }}>#</th>
                    <th>User Name</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>IP Address</th>
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
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && utmCampaignReport.length <= 0 && (
                    <tr>
                      <td className="text-center" colSpan={6}>
                        Campaign report not available.
                      </td>
                    </tr>
                  )}
                  {utmCampaignReport.length > 0 &&
                    utmCampaignReport.map(
                      (utmCampaignReport, utmCampaignReportIndex) => {
                        return (
                          <tr key={`utm-campaign-tr-${utmCampaignReportIndex}`}>
                            <td className="text-center">
                              {utmCampaignReport.event_id}
                            </td>
                            {utmCampaignReport?.users &&
                              <>
                              <td>
                                <Link href={`/admin/users/edit_user/${utmCampaignReport?.user_id}`} target="_blank" >
                                  {`${utmCampaignReport?.users.first_name
                                      ? utmCampaignReport?.users.first_name
                                      : ""
                                    } ${utmCampaignReport?.users.last_name
                                      ? utmCampaignReport?.users.last_name
                                      : ""
                                    }`}
                                </Link>
                              </td>
                              <td>
                                <a href={`mailto:${utmCampaignReport?.users.user_email}`}>
                                    {utmCampaignReport?.users.user_email ? utmCampaignReport?.users.user_email : ""}
                                </a>
                              </td>
                              </>
                            }

                            {!utmCampaignReport?.users &&
                              <>
                              <td>Anonymous User</td>
                              <td>NA</td>
                              </>
                            }

                            <td>
                              {utmCampaignReport.event_type
                                ? utmCampaignReport.event_type
                                : ""}
                            </td>
                            <td>
                              {utmCampaignReport.user_ip
                                ? utmCampaignReport.user_ip
                                : ""}
                            </td>
                            <td>{formatDate(utmCampaignReport.created_at)}</td>
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>
            </div>
          </Card>
          {/* EOF Card Table */}

          {/* Bottom bar */}
          {!isLoading && utmCampaignReport.length > 0 && (
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
        </div>
      </div>
    </div>
  );
};

export default withAuth(ViewUtmCampaign);
