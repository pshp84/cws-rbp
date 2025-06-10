"use client";
import {
    addDealReport,
    getDealCategories,
    getDeals,
    ReportType,
} from "@/DbClient";
import { DealCategory, DealData } from "@/Types/Deals";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    Card,
    CardBody,
    Col,
    Row,
    Form,
    FormGroup,
    Input,
    Spinner,
    CardHeader,
} from "reactstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import DefaultImg from "../../../../public/assets/images/home/defaultImg.jpg";

interface DealsListProps {
    userId?: string;
    title?: string;
    subTitle?: string;
    dealDetailPath?: string;
}

const DealsList: React.FC<DealsListProps> = (props) => {

    const { userId, title, subTitle, dealDetailPath = "/deals/details" } = props;
    const router = useRouter();
    const [deals, setDeals] = useState<DealData[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [category, setCategory] = useState<DealCategory[]>([]);
    const [validDeals, setValidDeals] = useState<DealData[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [allRecords, setAllRecords] = useState<number>(0);
    const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
    const [selectedOrder, setSelectedOrder] = useState("desc");
    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const filterValidDeals = (deals: DealData[]): DealData[] => {
        const currentDate = new Date();
        const today = new Date(currentDate.toISOString().split("T")[0]);
        return deals.filter((deal) => {
            const dealEndDate = deal.end_date ? new Date(deal.end_date) : null;
            return deal.end_date === null || (dealEndDate && dealEndDate >= today);
        });
    };

    const fetchDealsList = async (page: number = 1) => {
        if (loading || loadingMore || !hasMore) return;

        // setLoading(true);
        if (page === 1) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const result = await getDeals({
                page: page ? page : currentPage,
                limit: 12,
                order: displayOrder,
            });

            const result1 = await getDeals({
                limit: -1,
                order: displayOrder,
            });

            if (result1 && result1.data) {
                const totalDeals = filterValidDeals(result1.data);
                setTotalRecords(totalDeals?.length);
                setAllRecords(result1.data.length);


                const categories = await getDealCategories();

                if (result && result.data && categories) {
                    const data = result.data;
                    let newValidDeals = filterValidDeals(data);
                    // Check if we have less than 12 valid deals

                    let currentPage = page;
                    while (newValidDeals.length < 12 && currentPage * 12 <= totalDeals.length) {
                        currentPage += 1;

                        const nextPageResult = await getDeals({
                            page: currentPage,
                            limit: 12,
                            order: displayOrder,
                        });

                        if (nextPageResult && nextPageResult.data) {
                            const nextPageValidDeals = filterValidDeals(nextPageResult.data);
                            newValidDeals = [...newValidDeals, ...nextPageValidDeals];

                            // Stop fetching once we have 12 valid deals
                            if (newValidDeals.length >= 12) {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    const finalValidDeals = newValidDeals.slice(0, 12);
                    if (finalValidDeals.length === 0) {
                        setHasMore(false);
                        setLoading(false);
                        setLoadingMore(false);
                    } else {
                        if (page === 1) {
                            setValidDeals(finalValidDeals);
                            setDeals(finalValidDeals);
                            setLoading(false);
                            setPageLoading(false);
                        } else {
                            setValidDeals((prevValidDeals) => {
                                const allDeals = [...prevValidDeals, ...finalValidDeals];
                                const uniqueDeals = Array.from(
                                    new Map(allDeals.map((deal) => [deal.deal_id, deal])).values()
                                );
                                return uniqueDeals;
                            });

                            setDeals((prevData) => [...prevData, ...finalValidDeals]);
                            setLoading(false);
                            setPageLoading(false);
                        }

                        setCategory(categories);
                    }
                } else {
                    toast.error("Something went wrong");
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setPageLoading(false);
        }
    };

    const handleScroll = () => {
        const scrollableHeight =
            document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY;

        if (currentScroll >= scrollableHeight - 200 && hasMore && !pageLoading) {
            setCurrentPage((prevPage) => prevPage + 1);
            fetchDealsList(currentPage + 1);
        }
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [loading, hasMore, currentPage]);

    useEffect(() => {
        fetchDealsList(1);
    }, [displayOrder, currentPage, hasMore]);

    const handleCategoryChange = (category: number) => {
        setSelectedCategories((prev) => {
            if (prev.includes(category)) {
                return prev.filter((item) => item !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleClearCategories = () => {
        setSelectedCategories([]);
    };

    const filteredDeals = validDeals.filter((item) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategories.length
            ? item.categories.some((category) =>
                selectedCategories.includes(category.category_id)
            )
            : true;
        return matchesSearch && matchesCategory;
    });

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value;

        setSelectedOrder(selectedValue);

        if (selectedValue === "asc") {
            setDisplayOrder("asc");
            setCurrentPage(1);
        } else {
            setDisplayOrder("desc");
        }
    };

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

    if (pageLoading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
            </div>
        );
    }

    return <>
        {validDeals.length > 0 ? (
            <div className="product-grid">
                <div className="feature-products">
                    <Row className="mb-4">
                        <Col xs="12" md="6" className="mb-3 mb-md-0">
                            {title && <div className="mb-2 text-dark f-w-500 details">
                                {title}
                            </div>}

                            {subTitle && <p className="mb-0">
                                {subTitle}
                            </p>}

                        </Col>
                        <Col xs="12" md="6">
                            <Form>
                                <FormGroup className="m-0 search-container">
                                    <div className="position-relative">
                                        <Input
                                            style={{ backgroundColor: "#F5F5F6" }}
                                            className="form-control border-0 rounded-lg pe-5"
                                            type="search"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <i className="fa fa-search position-absolute top-50 end-0 translate-middle-y pe-3"></i>
                                    </div>
                                </FormGroup>
                            </Form>
                        </Col>
                    </Row>

                    <Row>
                        <Col xs="12" lg="3" className="mb-4 mb-lg-0">
                            <Card className="rounded-lg overflow-hidden">
                                <CardHeader className="d-flex justify-content-between align-items-center">
                                    <div className="text-dark ff-sora-bold">
                                        {"FILTERS"}
                                    </div>
                                    {selectedCategories.length > 0 &&
                                        <Link
                                            href={"#"}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleClearCategories();
                                            }}
                                            className="text-primary f-s-12 ff-sora-medium"
                                            style={{ letterSpacing: "normal" }}
                                        >
                                            {"CLEAR ALL"}
                                        </Link>
                                    }
                                </CardHeader>

                                <CardBody className="left-filter">
                                    <div className="product-filter">
                                        <div className="ff-sora-bold text-dark mb-2 category-text">
                                            Categories
                                        </div>
                                        <div className="mt-3">
                                            {category &&
                                                category.map((item) => (
                                                    <div
                                                        key={item.category_id}
                                                        className="category form-check custom-checkbox mb-2"
                                                    >
                                                        <input
                                                            className="category-checkbox checkbox_animated text-dark"
                                                            type="checkbox"
                                                            id={`category-${item.category_id}`}
                                                            checked={selectedCategories.includes(
                                                                item.category_id
                                                            )}
                                                            onChange={() =>
                                                                handleCategoryChange(item.category_id)
                                                            }
                                                        />
                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={`category-${item.category_id}`}
                                                        >
                                                            {item.name}
                                                        </label>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                            <p className="mb-1"><b><small>Affiliate Disclosure</small></b></p>
                            <p className="mb-1"><small>Some of the links on this website are affiliate links, including links to Amazon. As an Amazon Associate, we earn from qualifying purchases at no additional cost to you. These commissions help support our website and allow us to continue providing valuable content.</small></p>
                            <p className="mb-1"><small>We only recommend products we believe in, and we appreciate your support!</small></p>
                        </Col>

                        <Col xs="12" lg="9">
                            <div className="d-flex justify-content-between align-items-center dealsSetupDiv">
                                <div className="flex-start">
                                    {filteredDeals.length === allRecords
                                        ? `Showing 1-${filteredDeals.length} of ${filteredDeals.length} results`
                                        : `Showing ${Math.min(
                                            (currentPage - 1) * 12 + 1,
                                            filteredDeals.length
                                        )}-${Math.min(
                                            currentPage * 12,
                                            filteredDeals.length
                                        )} of ${totalRecords} results`}
                                </div>
                                <div className="flex-end ff-sora">
                                    <div className="d-flex align-items-center borderLight py-1 px-2">
                                        <div className="labelDropdown">
                                            <span>Sort By:</span>
                                        </div>
                                        <div className="select">
                                            <select
                                                className="form-select border-0 text-dark sortSelect"
                                                style={{
                                                    fontSize: "0.875rem",
                                                    width: "auto",
                                                    cursor: "pointer",
                                                }}
                                                name="product-sorting"
                                                value={selectedOrder}
                                                onChange={handleChange}
                                            >
                                                <option className="ff-sora" value={"desc"}>
                                                    {"What's New"}
                                                </option>
                                                <option className="ff-sora" value={"asc"}>
                                                    {"What's Old"}
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 gy-3 gx-3 mt-2 mobile-row">
                                {filteredDeals.length === 0 && (
                                    <div className="col-12 col-lg-12">
                                        <div className="d-flex justify-content-center mt-4">
                                            <h4>No deals found for selected category</h4>
                                        </div>
                                    </div>
                                )}
                                {loading ? (
                                    <>
                                        <LoadingIcon withOverlap={true} />
                                        {filteredDeals.map((el, index) => (
                                            <div key={index} className="col mb-3">
                                                <div className="h-100 d-flex flex-column">
                                                    <div className="position-relative mb-2 mx-auto">
                                                        <img
                                                            src={el.dealImageURL || DefaultImg.src}
                                                            alt={el.name}
                                                            className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
                                                            style={{
                                                                width: "100%",
                                                                height: "154px",
                                                                objectFit: "cover",
                                                            }}
                                                            onClick={() =>
                                                                router.push(
                                                                    `${dealDetailPath}/${el.deal_id}`
                                                                )
                                                            }
                                                        />
                                                        <div className="position-absolute top-0 start-0 m-2">
                                                            {el.categories.map((category, catIndex) => (
                                                                <span
                                                                    key={catIndex}
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
                                                            className="mb-2 fs-6 text-dark cursor-pointer"
                                                            onClick={() =>
                                                                router.push(
                                                                    `${dealDetailPath}/${el.deal_id}`
                                                                )
                                                            }
                                                        >
                                                            {el.name}
                                                        </h5>
                                                        <p
                                                            className="mb-2 cursor-pointer"
                                                            onClick={() =>
                                                                router.push(
                                                                    `${dealDetailPath}/${el.deal_id}`
                                                                )
                                                            }
                                                        >
                                                            {el.small_description?.replace(
                                                                /<\/?[^>]+(>|$)/g,
                                                                ""
                                                            )}
                                                        </p>
                                                        <div className="mt-auto">
                                                            {el.discount_text && (
                                                                <span className="badge bg-danger mb-2 d-inline-block deals-text">
                                                                    {el.discount_text}
                                                                </span>
                                                            )}
                                                            <div className="deals-text">
                                                                <span className="me-2 deals-price">
                                                                    {el.sale_price
                                                                        ? `$${el.sale_price.toFixed(2)}`
                                                                        : ""}
                                                                </span>
                                                                <span className="text-decoration-line-through">
                                                                    {el.regular_price
                                                                        ? `$${el.regular_price.toFixed(2)}`
                                                                        : ""}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() =>
                                                                    router.push(
                                                                        `${dealDetailPath}/${el.deal_id}`
                                                                    )
                                                                }
                                                                className="btn btn-outline-primary mt-2 btn-sm deals-text"
                                                            >
                                                                Explore
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    filteredDeals.map((el, index) => (
                                        <div key={index} className="col mb-3">
                                            <div className="h-100 d-flex flex-column">
                                                <div className="position-relative mb-2">
                                                    <img
                                                        src={el.dealImageURL || DefaultImg.src}
                                                        alt={el.name}
                                                        className="img-fluid w-100 rounded dashboard-badge cursor-pointer ms-auto"
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
                                                        {el.categories.map((category, catIndex) => (
                                                            <span
                                                                key={catIndex}
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
                                                        className="mb-2 fs-6 text-dark cursor-pointer"
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
                                                        {el.small_description?.replace(
                                                            /<\/?[^>]+(>|$)/g,
                                                            ""
                                                        )}
                                                    </p>
                                                    <div className="mt-auto">
                                                        {el.discount_text && (
                                                            <span className="badge bg-danger mb-2 d-inline-block deals-text">
                                                                {el.discount_text}
                                                            </span>
                                                        )}
                                                        <div className="deals-text">
                                                            <span className="me-2 deals-price">
                                                                {el.sale_price
                                                                    ? `$${el.sale_price.toFixed(2)}`
                                                                    : ""}
                                                            </span>
                                                            <span className="text-decoration-line-through">
                                                                {el.regular_price
                                                                    ? `$${el.regular_price.toFixed(2)}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                router.push(
                                                                    `${dealDetailPath}/${el.deal_id}`
                                                                );
                                                                viewDeal(el.deal_id);
                                                            }}
                                                            className="btn btn-outline-primary mt-2 btn-sm deals-text"
                                                        >
                                                            Explore
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {loadingMore && (
                                <div className="d-flex justify-content-center align-items-center my-4">
                                    <Spinner
                                        style={{ width: "3rem", height: "3rem" }}
                                        color="primary"
                                    />
                                </div>
                            )}
                        </Col>
                    </Row>
                </div>
            </div>
        ) : (
            <div className="col-12">
                <div
                    style={{
                        borderColor: "#cfe2ff",
                        backgroundColor: "#cfe2ff",
                        color: "black",
                    }}
                    className="alert alert-primary"
                    role="alert"
                >
                    No deals are available.
                </div>
            </div>
        )}
    </>
}

export default DealsList;