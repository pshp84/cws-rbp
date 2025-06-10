"use client";
import {
    addDealReport,
    getDeal,
    getDeals,
    ReportType,
} from "@/DbClient";
import { DealData } from "@/Types/Deals";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DefaultImg from "../../../../public/assets/images/home/defaultImg.jpg";
import { Spinner } from "reactstrap";

interface DealDetailsProps {
    dealId: number;
    userId?: string;
    dealDetailPath?: string;
    dealsListPath?: string;
    dealDetails?: (dealData: DealData) => void;
}

const DealDetails: React.FC<DealDetailsProps> = (props) => {

    const { dealId: id, userId, dealDetailPath = "/deals/details", dealsListPath = "/deals", dealDetails } = props;
    const router = useRouter();
    const [deal, setDeal] = useState<DealData>();
    const [list, setList] = useState<DealData[]>([]);

    const filterValidDeals = (deals: DealData[]): DealData[] => {
        const currentDate = new Date();
        const today = new Date(currentDate.toISOString().split("T")[0]);
        return deals.filter((deal) => {
            const dealEndDate = deal.end_date ? new Date(deal.end_date) : null;
            return deal.end_date === null || (dealEndDate && dealEndDate >= today);
        });
    };

    const fetchDealDetails = async () => {
        try {
            const result = await getDeal(Number(id), true);
            setDeal(result);
            if (dealDetails) dealDetails(result);
        } catch (error) { }
    };

    const fetchDealsList = async () => {
        const getIds = deal && deal.categories.map((el) => el.category_id);
        try {
            const result = await getDeals();
            if (result && result.data) {
                const filteredDeals = result.data.filter((deal) =>
                    deal.categories.some((category: any) =>
                        getIds?.includes(category.category_id)
                    )
                );
                const filteredDealsCatrgory = filteredDeals.filter(
                    (item: DealData) => item.deal_id !== Number(id)
                );
                const newDeals = filterValidDeals(filteredDealsCatrgory);

                setList(newDeals);
            } else {
                toast.error("Something went wrong");
            }
        } catch (error) {
            console.log(error);
        }
    };

    const openInNewTab = async (url: string, id: number) => {
        window.open(url, "_blank", "noopener,noreferrer");
        try {
            await addDealReport({
                userID: userId as string,
                dealID: id,
                reportType: "click" as ReportType.Click,
            });
        } catch (error) { }
    };

    useEffect(() => {
        fetchDealDetails();
    }, []);

    useEffect(() => {
        fetchDealsList();
    }, [deal]);

    if (!deal) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
            </div>
        );
    }

    const viewDeal = async (id: number) => {
        if (!userId) return;
        try {
            await addDealReport({
                dealID: id,
                userID: userId as string,
                reportType: "view" as ReportType.View,
            });
        } catch (error) {
            console.log(error);
        }
    };

    return <>
        <div className="d-flex flex-column flex-md-row align-items-start gap-2">
            <div className="col-12 col-md-5">
                <div className="position-relative mb-2">
                    <img
                        src={deal?.dealImageURL || DefaultImg.src}
                        alt={deal.name}
                        className="img-fluid rounded dashboard-badge product-img ms-auto"
                    />
                    <div className="position-absolute top-0 start-0 m-2">
                        {deal.categories.map((category, catIndex) => (
                            <span
                                key={catIndex}
                                style={{ backgroundColor: "#D1FD64", marginTop: "inherit" }}
                                className="badge text-black text-center justify-center ms-1"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>
                    <div className="mt-1 f-s-10">
                        <p className="mb-1"><b><small>Affiliate Disclosure</small></b></p>
                        <p className="mb-1"><small>Some of the links on this website are affiliate links, including links to Amazon. As an Amazon Associate, we earn from qualifying purchases at no additional cost to you. These commissions help support our website and allow us to continue providing valuable content.</small></p>
                        <p className="mb-1"><small>We only recommend products we believe in, and we appreciate your support!</small></p>
                    </div>
                </div>
            </div>
            <div className="col-12 col-md-6">
                <div className="d-flex justify-content-between">
                    <h2 className="flex-start text-dark">{deal?.name}</h2>
                    {/* <div className="flex-end">
                {deal.discount_text && (
                  <span className="badge bg-danger mb-2 d-inline-block deals-text">
                    {deal?.discount_text}
                  </span>
                )}
              </div> */}
                </div>

                <div className="mt-4 deal-text">
                    <div className="">
                        {deal.discount_text && (
                            <span className="badge bg-danger mb-2 d-inline-block deals-text">
                                {deal?.discount_text}
                            </span>
                        )}
                    </div>
                    <span className="me-2 deals-price">{`${deal.sale_price ? `$${deal?.sale_price?.toFixed(2)}` : ""
                        } `}</span>
                    <span className="text-decoration-line-through">{`${deal.regular_price ? `$${deal?.regular_price?.toFixed(2)}` : ""
                        }`}</span>

                </div>
                <div className="mt-4 text-dark">
                    {/* {deal?.description
                ? deal?.description.replace(/<\/?[^>]+(>|$)/g, "")
                : ""} */}
                    <div
                        className="editor"
                        dangerouslySetInnerHTML={{
                            __html: (deal?.description as string) || "",
                        }} // Type assertion
                    />
                </div>
                {deal.deal_website_url !== null && (
                    <div>
                        <button
                            onClick={() => {
                                openInNewTab(deal.deal_website_url, deal.deal_id);
                            }}
                            className="btn btn-outline-primary mt-4 btn-sm deals-text buy-width"
                        >
                            {"Buy Now"}
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Related deals section */}
        {list && list.length > 0 && (
            <>
                <div className="mt-4">
                    <div className="d-flex justify-content-between">
                        <h4 className="flex-start text-dark text-lg">
                            {"Related Deals"}
                        </h4>
                        <div className="flex-end">
                            <button
                                onClick={() => router.push(dealsListPath)}
                                className="btn btn-outline-primary btn-sm deals-text"
                            >
                                {"See All"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* realted deals list */}
                <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 gy-3 gx-3 mt-2 mobile-row">
                    {list.map((el, index) => (
                        <div key={index} className="col mb-3">
                            <div className="h-100 d-flex flex-column">
                                <div className="position-relative mb-2 mx-auto">
                                    <img
                                        src={el.dealImageURL || DefaultImg.src}
                                        alt={el.name}
                                        className="img-fluid w-100 rounded dashboard-badge ms-auto cursor-pointer"
                                        style={{
                                            width: "100%",
                                            height: "154px",
                                            objectFit: "cover",
                                        }}
                                        onClick={() => {
                                            router.push(`${dealDetailPath}/${el.deal_id}`);
                                            viewDeal(el.deal_id);
                                        }}
                                    />
                                    <div className="position-absolute top-0 start-0 m-2">
                                        {el &&
                                            el.categories.map((category, index) => (
                                                <span
                                                    key={index}
                                                    style={{
                                                        backgroundColor: "#D1FD64",
                                                        marginTop: "inherit",
                                                    }}
                                                    className="badge text-black text-center justify-center ms-1"
                                                >
                                                    {category.name}
                                                </span>
                                            ))}
                                    </div>
                                </div>

                                <div className="d-flex flex-column flex-grow-1">
                                    <h5
                                        className="mb-2 fs-6 cursor-pointer"
                                        onClick={() => {
                                            router.push(`${dealDetailPath}/${el.deal_id}`);
                                            viewDeal(el.deal_id);
                                        }}
                                    >
                                        {el.name}
                                    </h5>
                                    <p
                                        className="mb-2 cursor-pointer"
                                        onClick={() => {
                                            router.push(`${dealDetailPath}/${el.deal_id}`);
                                            viewDeal(el.deal_id);
                                        }}
                                    >
                                        {el.small_description}
                                    </p>
                                    <div className="mt-auto">
                                        {el.discount_text && (
                                            <span className="badge bg-danger mb-2 d-inline-block dashboard-badge">
                                                {el.discount_text}
                                            </span>
                                        )}
                                        <div className="deals-text">
                                            <span className="me-2 deals-price">
                                                {el.sale_price ? "$" : ""}
                                                {el.sale_price ? el.sale_price : ""}
                                            </span>
                                            <span
                                                color="#565959"
                                                className="text-decoration-line-through font-normal"
                                            >
                                                {el.regular_price ? "$" : ""}
                                                {el.regular_price
                                                    ? el.regular_price.toFixed(2)
                                                    : ""}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                router.push(`${dealDetailPath}/${el.deal_id}`);
                                                viewDeal(el.deal_id);
                                            }}
                                            className="btn btn-outline-primary mt-2 btn-sm dashboard-badge w-100"
                                        >
                                            Explore
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </>
}

export default DealDetails;