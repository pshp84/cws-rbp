"use client";

import PaginationComponent from "@/CommonComponent/PaginationComponent";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import withAuth from "@/Components/WithAuth/WithAuth";
import { getUtmCampaigns, getUtmCampaignsArgs, getUTMCampaignsMedium, getUTMCampaignsSource } from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import Link from "next/link";
import { off } from "process";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card } from "reactstrap";

type UTMParams = {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_id?: string;
};

const UtmCampaigns = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [perPage, setPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [displayOrder, setDisplayOrder] = useState<"asc" | "desc">("desc");
    const [utmCampaigns, setUtmCampaigns] = useState<Array<any>>([]);
    const [mediumFilter, setMediumFilter] = useState<string>();
    const [sourceFilter, setSourceFilter] = useState<string>();
    const [mediumList, setMediumList] = useState<Array<String>>([]);
    const [sourceList, setSourceList] = useState<Array<String>>([]);

    const fetchUtmCampaigns = async (page: number = 0) => {
        setIsLoading(true);
        let pageNumber = currentPage;
        if (page !== 0) {
            pageNumber = page;
            setCurrentPage(page);
        }

        const getUtmCampaignsArgs: getUtmCampaignsArgs = {
            limit: perPage,
            page: pageNumber,
            order: displayOrder
        };
        if (mediumFilter) getUtmCampaignsArgs.medium = mediumFilter;
        if (sourceFilter) getUtmCampaignsArgs.source = sourceFilter;
        const data = await getUtmCampaigns(getUtmCampaignsArgs);

        if (typeof data == "boolean") {
            setUtmCampaigns([]);
            setIsLoading(false);
            return;
        }

        const { status, data: utmCampaigns, message, totalPages, totalRecords } = data;

        if (!status) {
            setUtmCampaigns([]);
            setIsLoading(false);
            return;
        }

        if (utmCampaigns) setUtmCampaigns(utmCampaigns);
        if (totalRecords) setTotalRecords(totalRecords);
        if (totalPages) setTotalPages(totalPages);
        setIsLoading(false);
    }

    const fetchUtmCampaignsMedium = async () => {
        const data = await getUTMCampaignsMedium();
        if (typeof data == "boolean") return;
        const mediumListData = data.map(data => data.utm_medium);
        setMediumList(mediumListData);
    }

    const fetchUtmCampaignsSource = async () => {
        const data = await getUTMCampaignsSource();
        if (typeof data == "boolean") return;
        const mediumListData = data.map(data => data.utm_source);
        setSourceList(mediumListData);
    }

    const copyUTMLink = ({ utm_source, utm_medium, utm_campaign, utm_id }: UTMParams) => {
        const baseUrl = `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}sign-up`;;
        const url = new URL(baseUrl);

        // Append UTM parameters if provided
        if (utm_source) url.searchParams.append("utm_source", utm_source);
        if (utm_medium) url.searchParams.append("utm_medium", utm_medium);
        if (utm_campaign) url.searchParams.append("utm_campaign", utm_campaign);
        if (utm_id) url.searchParams.append("utm_id", utm_id);

        // Copy to clipboard
        navigator.clipboard
            .writeText(url.toString())
            .then(() => {
                toast.success("Link copied to clipboard: " + url.toString());
            })
            .catch((err) => {
                toast.error("Failed to copy link:", err);
            });
    }

    useEffect(() => {
        if (!isLoading) {
            fetchUtmCampaigns(1);
        }
    }, [perPage, displayOrder, mediumFilter, sourceFilter]);

    useEffect(() => {
        if (!isLoading) {
            fetchUtmCampaigns();
        }
    }, [currentPage]);

    useEffect(() => {
        fetchUtmCampaigns();
        fetchUtmCampaignsMedium();
        fetchUtmCampaignsSource();
    }, [])

    return <div className="utm-campaigns-admin mb-4 col-12">
        {/* Top bar */}
        <div className={`rewards-points-log-top-bar d-flex justify-content-${(isLoading) ? 'end' : 'between'} align-items-center gap-2 mb-3`}>
            {!isLoading && <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={true} onPerPageChange={setPerPage} />}

            <div className="d-flex justify-content-end align-items-center gap-2">
                {sourceList.length > 0 &&
                    <div>
                        <select className="form-select form-select-sm" onChange={e => setSourceFilter(e.target.value)}>
                            <option value="">Source</option>
                            {sourceList.map((source, sourceIndex) => {
                                if (typeof source == "string" && source !== "")
                                    return <option key={sourceIndex} value={source}>{source}</option>
                            })}
                        </select>
                    </div>
                }

                {mediumList.length > 0 &&
                    <div>
                        <select className="form-select form-select-sm" onChange={e => setMediumFilter(e.target.value)}>
                            <option value="">Medium</option>
                            {mediumList.map((medium, mediumIndex) => {
                                if (typeof medium == "string" && medium !== "")
                                    return <option key={mediumIndex} value={medium}>{medium}</option>
                            })}
                        </select>
                    </div>
                }

                {/* <div>
                    <button className="btn btn-sm btn-primary px-2 py-1">Add New</button>
                </div> */}
            </div>
        </div>
        {/* EOF Top bar */}

        {/* Card Table */}
        <Card className="overflow-hidden position-relative">
            <div className="table-responsive">
                {isLoading && (
                    <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }} >
                        Loading please wait...
                    </div>
                )}
                <table className="table">
                    <thead>
                        <tr>
                            <th className="text-center" style={{ width: "50px" }}>#</th>
                            <th>Campaign Name</th>
                            <th>Campaign ID</th>
                            <th>Source</th>
                            <th>Medium</th>
                            <th>Content</th>
                            <th>Term</th>
                            <th>Users</th>
                            <th style={{ width: "125px" }}>Date &nbsp;
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    const newDisplayOrder =
                                        displayOrder == "asc" ? "desc" : "asc";
                                    setDisplayOrder(newDisplayOrder);
                                }}
                                >
                                    <i className={`fa fa-sort-${displayOrder}`}></i>
                                </a>
                            </th>
                            <th className="text-center" style={{ width: "80px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!isLoading && utmCampaigns.length <= 0) &&
                            <tr>
                                <td className="text-center" colSpan={10}>Campaigns not found.</td>
                            </tr>
                        }
                        {utmCampaigns.length > 0 &&
                            utmCampaigns.map((utmCampaign, utmCampaignIndex) => {
                                return <tr key={`utm-campaign-tr-${utmCampaignIndex}`}>
                                    <td className="text-center">{utmCampaign.utm_id}</td>
                                    <td>{utmCampaign.utm_campaign}</td>
                                    <td>{utmCampaign.campaign_id}</td>
                                    <td>{utmCampaign.utm_source}</td>
                                    <td>{utmCampaign.utm_medium}</td>
                                    <td>{utmCampaign.utm_content}</td>
                                    <td>{utmCampaign.utm_term}</td>
                                    <td>{utmCampaign.users_count}</td>
                                    <td>{formatDate(utmCampaign.created_at)}</td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center align-items-center gap-2">
                                            <Link href={`#`} onClick={e => {
                                                e.preventDefault();
                                                copyUTMLink({
                                                    utm_campaign: utmCampaign.utm_campaign,
                                                    utm_medium: utmCampaign.utm_medium,
                                                    utm_source: utmCampaign.utm_source,
                                                    utm_id: utmCampaign.campaign_id
                                                })
                                            }}><i className="fa fa-link"></i></Link>
                                            <Link href={`/admin/utm-campaigns/report/${utmCampaign.utm_id}`}><i className="fa fa-bar-chart-o"></i></Link>
                                        </div>
                                    </td>
                                </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
        </Card >
        {/* EOF Card Table */}

        {/* Bottom bar */}
        {
            !isLoading && utmCampaigns.length > 0 && (
                <div className="rewards-points-log-bottom-bar d-flex justify-content-between align-items-center gap-2">
                    <PaginationInfo totalRecords={totalRecords} recordsPerPage={perPage} currentPage={currentPage} showDropDown={false} />

                    {totalPages > 1 && (
                        <PaginationComponent totalRecords={totalRecords} perPage={perPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                    )}
                </div>
            )
        }
        {/* EOF Bottom bar */}
    </div >
}

export default withAuth(UtmCampaigns);