"use client";

import PaginationComponent from "@/CommonComponent/PaginationComponent";
import withAuth from "@/Components/WithAuth/WithAuth";
import {
  DealType,
  deleteDeal,
  getDealCategories,
  getDealReports,
  getDeals,
  GetDealsArgsInterface,
  getUserById,
} from "@/DbClient";
import {
  formatDate,
  priceFormat,
  truncateString,
} from "@/Helper/commonHelpers";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalFooter,
  ModalHeader,
} from "reactstrap";

const DealsListingAdmin = () => {
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [viewPerPageDropdownOpen, setViewPerPageDropdownOpen] = useState(false);
  const [clickPerPageDropdownOpen, setClickPerPageDropdownOpen] = useState(false);
  const [dealCategoriesFilterValue, setDealCategoriesFilterValue] =
    useState("");
  const [dealTypeFilterValue, setDealTypeFilterValue] = useState("");
  const [dealStatusFilterValue, setDealStatusFilterValue] = useState("");
  const [dealSearchFilterValue, setDealSearchFilterValue] = useState("");
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [shouldProceedWithFilter, setShouldProceedWithFilter] = useState(false);
  const [showFilters, setShowFilters] = useState<Boolean>(false);
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);

   // viewed model pagination states
  const [viewCurrentPage, setViewCurrentPage] = useState<number>(1);
  const [viewPerPage, setViewPerPage] = useState<number>(50);
  const [viewTotalPages, setViewTotalPages] = useState<number>(0);
  const [viewTotalRecords, setViewTotalRecords] = useState<number>(0);

  // clicked model pagination states
  const [clickCurrentPage, setClickCurrentPage] = useState<number>(1);
  const [clickPerPage, setClickPerPage] = useState<number>(10);
  const [clickTotalPages, setClickTotalPages] = useState<number>(0);
  const [clickTotalRecords, setClickTotalRecords] = useState<number>(0);

  const [deals, setDeals] = useState<Array<any>>([]);
  const [isLoadingCategories, setIsLoadingCategories] =
    useState<Boolean>(false);
  const [dealCategories, setDealCategories] = useState<Array<any>>([]);
  const [dealReports, setDealReports] = useState<Array<any>>([]);
  const [modal, setModal] = useState<boolean>(false);
  const [viewModal, setViewModal] = useState<boolean>(false);
  const [clickedData, setClickedData] = useState<Array<any>>([]);
  const [viewedData, setViewedData] = useState<Array<any>>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersViewData, setUsersViewData] = useState<any[]>([]);
  const [viewId, setViewId] = useState<number>(0);
  const [clickId, setClickId] = useState<number>(0);

  const toggleModel = () => setModal(!modal);
  const toggleViewModel = () => setViewModal(!viewModal);

  const fetchUsersById = async (userId: string) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (error) {}
  };

  const fetchDealsReports = async () => {
    try {
      const result = await getDealReports();
      if (result) {
        setDealReports(result);
      }
    } catch (error) {}
  };

  const countReportsForDeal = (dealId: number) => {
    const viewsCount = dealReports.filter(
      (report) => report.deal_id === dealId && report.report_type === "view"
    ).length;

    const viewsCountData = dealReports.filter(
      (report) => report.deal_id === dealId && report.report_type === "view"
    );

    const clicksCount = dealReports.filter(
      (report) => report.deal_id === dealId && report.report_type === "click"
    ).length;

    const clicksCountData = dealReports.filter(
      (report) => report.deal_id === dealId && report.report_type === "click"
    );
    return { viewsCount, clicksCount, viewsCountData, clicksCountData };
  };

  const fetchDealCategories = async () => {
    setIsLoadingCategories(true);
    const dealCategoriesData = await getDealCategories();
    if (!dealCategoriesData) {
      setDealCategories([]);
      return;
    }
    setDealCategories(dealCategoriesData);
    setIsLoadingCategories(false);
    return;
  };

  const fetchDeals = async (page: number = 0) => {
    setIsLoading(true);
    const dealsArgs: GetDealsArgsInterface = {
      page: page === 0 ? currentPage : page,
      limit: perPage,
      order: displayOrder,
      imageSize: {
        height: 65,
        width: 75,
        resize: "fill",
      },
    };
    if (dealCategoriesFilterValue !== "")
      dealsArgs.categories = [parseInt(dealCategoriesFilterValue)];
    if (dealStatusFilterValue == "1" || dealStatusFilterValue == "0")
      dealsArgs.status = dealStatusFilterValue === "1" ? true : false;
    if (
      dealTypeFilterValue === DealType.Affiliate ||
      dealTypeFilterValue === DealType.Coupon
    )
      dealsArgs.type = dealTypeFilterValue;
    if (dealSearchFilterValue !== "") dealsArgs.search = dealSearchFilterValue;

    const dealsData = await getDeals(dealsArgs);

    if (!dealsData || !dealsData.status) {
      setDeals([]);
      setIsLoading(false);
      return;
    }

    if (dealsData.totalRecords) setTotalRecords(dealsData.totalRecords);
    if (dealsData.totalPages) setTotalPages(dealsData.totalPages);
    if (dealsData.data) setDeals(dealsData.data);
    setIsLoading(false);
    return;
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);

  const toggleViewPerPageDropdown = () =>
    setViewPerPageDropdownOpen((prevState) => !prevState);

  const toggleClickPerPageDropdown = () =>
    setClickPerPageDropdownOpen((prevState) => !prevState);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleViewPageChange = (page: number) => setViewCurrentPage(page);
  const handleClickPageChange = (page: number) => setClickCurrentPage(page);

  const proceedWithFilter = async () => {
    setShowFilters(false);
    setCurrentPage(1);
    fetchDeals(1);
  };

  const removeDeal = async (dealID: number) => {
    setIsLoading(true);
    const dealDeleteStatus = await deleteDeal(dealID);
    if (!dealDeleteStatus) {
      setIsLoading(false);
      toast.error("Something is wrong! deal was not deleted.");
      return;
    }
    fetchDeals(1);
    toast.success("Deal deleted successfully.");
    return;
  };

  useEffect(() => {
    const fetchUsersData = async () => {
      const fetchedUsers = await Promise.all(
        clickedData.map(async (item) => {
          const user = await fetchUsersById(item.user_id);
          return { user };
        })
      );
      setUsersData(fetchedUsers);
    };

    if (clickedData.length > 0) {
      fetchUsersData();
    }
  }, [clickedData]);

  useEffect(() => {
    const fetchUsersData = async () => {
      const fetchedUsers = await Promise.all(
        viewedData.map(async (item) => {
          const user = await fetchUsersById(item.user_id);
          return { user };
        })
      );
      setUsersViewData(fetchedUsers);
    };

    if (viewedData.length > 0) {
      fetchUsersData();
    }
  }, [viewedData]);

  useEffect(() => {
    if (shouldProceedWithFilter) {
      proceedWithFilter();
      setShouldProceedWithFilter(false);
    }
  }, [
    dealCategoriesFilterValue,
    dealSearchFilterValue,
    dealTypeFilterValue,
    dealStatusFilterValue,
  ]);

  useEffect(() => {
    if (!shouldProceedWithFilter) {
      fetchDeals();
    }
  }, [perPage, currentPage, displayOrder]);

  useEffect(() => {
    fetchDeals();
    fetchDealCategories();
    fetchDealsReports();
  }, []);

  useEffect(() => {
    if (viewModal && viewedData) {
      const { viewsCountData } = countReportsForDeal(viewId);
      setViewTotalRecords(viewsCountData.length);

      const startIndex = (viewCurrentPage - 1) * viewPerPage;
      const endIndex = viewCurrentPage * viewPerPage;

      setViewedData(viewsCountData.slice(startIndex, endIndex));
    }
  }, [viewModal, viewPerPage, viewCurrentPage, viewId]);

  useEffect(() => {
    if (modal && clickedData) {
      const { clicksCountData } = countReportsForDeal(clickId);
      setClickTotalRecords(clicksCountData.length);

      const startIndex = (clickCurrentPage - 1) * clickPerPage;
      const endIndex = clickCurrentPage * clickPerPage;

      setClickedData(clicksCountData.slice(startIndex, endIndex));
    }
  }, [modal, clickPerPage, clickCurrentPage, clickId]);

  return (
    <>
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

        <div className="d-flex justify-content-end align-items-center gap-2 me-2">
          {dealCategoriesFilterValue !== "" && (
            <div className="d-flex justify-content-end align-items-center gap-1">
              <p className="m-0">Categories:</p>
              <button
                className="btn btn-sm btn-outline-primary px-2 py-1 position-relative"
                onClick={() => {
                  setShouldProceedWithFilter(true);
                  setCurrentPage(1);
                  setDealCategoriesFilterValue("");
                }}
              >
                {
                  dealCategories.filter(
                    (data) => data.category_id == dealCategoriesFilterValue
                  )[0].name
                }
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  &times;
                </span>
              </button>
            </div>
          )}
          {dealTypeFilterValue !== "" && (
            <div className="d-flex justify-content-end align-items-center gap-1">
              <p className="m-0">Type:</p>
              <button
                className="btn btn-sm btn-outline-primary px-2 py-1 position-relative"
                onClick={() => {
                  setShouldProceedWithFilter(true);
                  setCurrentPage(1);
                  setDealTypeFilterValue("");
                }}
              >
                {dealTypeFilterValue}
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  &times;
                </span>
              </button>
            </div>
          )}
          {dealStatusFilterValue !== "" && (
            <div className="d-flex justify-content-end align-items-center gap-1">
              <p className="m-0">Status:</p>
              <button
                className="btn btn-sm btn-outline-primary px-2 py-1 position-relative"
                onClick={() => {
                  setShouldProceedWithFilter(true);
                  setCurrentPage(1);
                  setDealStatusFilterValue("");
                }}
              >
                {dealStatusFilterValue == "1" ? "Active" : "Inactive"}
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  &times;
                </span>
              </button>
            </div>
          )}
        </div>

        <div>
          <input
            type="text"
            className="form-control py-1"
            placeholder="Search Deals"
            onChange={(e) => {setDealSearchFilterValue(e.target.value)
            
            }}
            value={dealSearchFilterValue}
          />
        </div>
        <button
            className="btn btn-outline-primary px-3"
            type="button"
            id="button-addon2"
            onClick={proceedWithFilter}
          >
            <i className="fa fa-search"></i>
          </button>

        <button
          className="btn btn-outline-primary px-3"
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fa fa-filter"></i> Filters
        </button>

        <Link href={"deals/add-new"} className="btn btn-primary px-3">
          <i className="fa fa-plus"></i> Add New
        </Link>
      </div>

      {showFilters && !isLoading && (
        <div className="deals-listing-filter-bar d-flex align-items-center gap-3 mb-3">
          <div className="d-flex align-items-center gap-1">
            <label className="m-0">Categories:</label>
            {!isLoadingCategories && dealCategories.length > 0 && (
              <select
                className="form-select form-select-sm"
                onChange={(e) => setDealCategoriesFilterValue(e.target.value)}
              >
                <option value="">Select</option>
                {dealCategories.map((category, categoryIndex) => {
                  return (
                    <option
                      key={`select-category-${categoryIndex}`}
                      selected={
                        dealCategoriesFilterValue == category.category_id
                      }
                      value={category.category_id}
                    >
                      {category.name}
                    </option>
                  );
                })}
              </select>
            )}
            {isLoadingCategories && <span>Loading...</span>}
            {!isLoadingCategories && dealCategories.length <= 0 && (
              <span>NA</span>
            )}
          </div>
          {/* <div className="d-flex align-items-center gap-1">
            <label className="m-0">Type:</label>
            <select
              className="form-select form-select-sm"
              onChange={(e) => setDealTypeFilterValue(e.target.value)}
            >
              <option value="">Select</option>
              <option
                selected={dealTypeFilterValue == DealType.Affiliate}
                value={DealType.Affiliate}
              >
                {DealType.Affiliate}
              </option>
              <option
                selected={dealTypeFilterValue == DealType.Coupon}
                value={DealType.Coupon}
              >
                {DealType.Coupon}
              </option>
            </select>
          </div> */}
          <div className="d-flex align-items-center gap-1">
            <label className="m-0">Status:</label>
            <select
              className="form-select form-select-sm"
              onChange={(e) => setDealStatusFilterValue(e.target.value)}
            >
              <option value="">Select</option>
              <option selected={dealStatusFilterValue === "1"} value={1}>
                Active
              </option>
              <option selected={dealStatusFilterValue === "0"} value={0}>
                Inactive
              </option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm px-2"
            onClick={() => {
              setShouldProceedWithFilter(true);
              proceedWithFilter();
            }}
          >
            Apply Filter
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
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
                <th>Deal</th>
                <th className="text-center" style={{ width: "100px" }}>
                  Is Featured
                </th>
                <th className="text-center" style={{ width: "50px" }}>
                  Clicked
                </th>
                <th className="text-center" style={{ width: "50px" }}>
                  Viewed
                </th>
                <th style={{ width: "125px" }}>Categories</th>
                <th style={{ width: "80px" }}>Price</th>
                {/* <th style={{ width: "80px" }}>Type</th> */}
                <th className="text-center" style={{ width: "80px" }}>
                  Status
                </th>
                <th style={{ width: "125px" }}>
                  Create Date &nbsp;
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
              {deals.length <= 0 && (
                <tr>
                  <td className="text-center" colSpan={9}>
                    Deals not found.
                  </td>
                </tr>
              )}

              {deals.length > 0 &&
                deals.map((deal, dealIndex) => {
                  const editDealURL = `deals/edit/${deal.deal_id}`;
                  const {
                    viewsCount,
                    clicksCount,
                    viewsCountData,
                    clicksCountData,
                  } = countReportsForDeal(deal.deal_id);

                  return (
                    <tr key={`deal-tr-${dealIndex}`}>
                      <td className="text-center">{deal.deal_id}</td>
                      <td>
                        <div className="d-flex align-items-top gap-2">
                          <Link href={editDealURL}>
                            {deal.dealImageURL && (
                              <img
                                className="rounded-3"
                                src={deal.dealImageURL}
                                alt={deal.name}
                                style={{ width: "75px", height: "65px" }}
                              />
                            )}
                            {!deal.dealImageURL && (
                              <span
                                className="rounded-3 bg-primary bg-gradient d-flex justify-content-center align-items-center text-white"
                                style={{
                                  width: "75px",
                                  height: "65px",
                                  fontSize: "20px",
                                }}
                              >
                                <i className="fa fa-image"></i>
                              </span>
                            )}
                          </Link>
                          <div>
                            <Link href={editDealURL}>{deal.name}</Link>
                            {deal.small_description &&
                              <span className="mb-1 w-100">
                                {truncateString(deal.small_description, 50)}
                              </span>
                            }
                            <ul className="list-inline justify-content-start">
                              <li className="list-inline-item">
                                <Link href={editDealURL}>
                                  <i className="fa fa-pencil"></i> Edit
                                </Link>
                              </li>
                              <li className="list-inline-item">
                                <a
                                  href="#"
                                  className="text-danger"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (confirm("Are you sure you want to delete this deal?")) {
                                      removeDeal(deal.deal_id);
                                    }
                                  }}
                                >
                                  <i className="fa fa-trash-o"></i> Delete
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                          <i
                            className={
                              deal.is_featured
                                ? `fa fa-check-circle`
                                : `fa fa-times-circle`
                            }
                          ></i>
                      </td>
                      <td className="text-center">
                        {clicksCountData.length > 0 ? (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setClickId(deal.deal_id);
                              setModal(true);
                              setClickTotalPages(
                                Math.ceil(clicksCountData.length / clickPerPage)
                              );
                              setClickedData(clicksCountData);
                            }}
                          >
                            {" "}
                            {clicksCount ? clicksCount : ""}
                          </a>
                        ) : (
                          <a> {0}</a>
                        )}
                      </td>
                      <td className="text-center">
                        {viewsCountData.length > 0 ? (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setViewId(deal.deal_id);
                              setViewModal(true);
                              setViewTotalPages(
                                Math.ceil(viewsCountData.length / viewPerPage)
                              );
                              setViewedData(viewsCountData);
                            }}
                          >
                            {viewsCount ? viewsCount : ""}
                          </a>
                        ) : (
                          <a>{0}</a>
                        )}
                      </td>
                      <td>
                        {deal.categories && (
                          <div className="d-flex flex-wrap align-items-center gap-1">
                            {deal.categories.map(
                              (category: any, categoryIndex: number) => {
                                return (
                                  <a
                                    key={`category-table-link-${categoryIndex}`}
                                    href="#"
                                    title="Click to apply category filter"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setShouldProceedWithFilter(true);
                                      setDealCategoriesFilterValue(
                                        category.category_id
                                      );
                                    }}
                                  >
                                    {category.name}
                                  </a>
                                );
                              }
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {deal.regular_price && (
                          <small>
                            <del>{priceFormat(deal.regular_price)}</del>
                          </small>
                        )}
                        {deal.sale_price && (
                          <span>{priceFormat(deal.sale_price)}</span>
                        )}
                      </td>
                      <td className="text-center">
                        <a
                          href="#"
                          title="Click to apply status filter"
                          className={!deal.status ? `text-danger` : ``}
                          onClick={(e) => {
                            e.preventDefault();
                            setShouldProceedWithFilter(true);
                            const filterVal = deal.status ? "1" : "0";
                            setDealStatusFilterValue(filterVal);
                          }}
                        >
                          <i
                            className={
                              deal.status
                                ? `fa fa-check-circle`
                                : `fa fa-times-circle`
                            }
                          ></i>
                        </a>
                      </td>
                      <td>{formatDate(deal.created_at)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && deals.length > 0 && (
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

      {/* Clicked deals model */}
      <Modal size="md" isOpen={modal} toggle={toggleModel}>
        <ModalHeader>Clicked Deals</ModalHeader>
        {clickedData && (
          <div className="d-flex align-items-center gap-2 p-2">
            {ClickedPaginationInfo({
              clickCurrentPage,
              limit: clickPerPage,
              clickTotalRecords,
            })}
            <span>|</span>
            <div className="d-flex align-items-center gap-1">
              <span>Per Page:</span>
              <Dropdown
                size="sm"
                isOpen={clickPerPageDropdownOpen}
                toggle={toggleClickPerPageDropdown}
              >
                <DropdownToggle className="px-2 py-1" color="primary" caret>
                  {clickPerPage}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => setClickPerPage(10)}>
                    10
                  </DropdownItem>
                  <DropdownItem onClick={() => setClickPerPage(20)}>
                    20
                  </DropdownItem>
                  <DropdownItem onClick={() => setClickPerPage(50)}>
                    50
                  </DropdownItem>
                  <DropdownItem onClick={() => setClickPerPage(80)}>
                    80
                  </DropdownItem>
                  <DropdownItem onClick={() => setClickPerPage(100)}>
                    100
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        )}
        <div className="position-relative overflow-hidden">
          <>
            {clickedData && (
              <>
                {clickedData && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clickedData.some(
                        (item) =>
                          !usersData.some(
                            (userData) => userData.user.user_id === item.user_id
                          )
                      ) ? (
                        <tr>
                          <td colSpan={2} className="text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : (
                        clickedData.map((item, i) => {
                          const userData = usersData.map((el) => el.user);
                          const findUser = userData.find(
                            (user) => user.user_id === item.user_id
                          );

                          return (
                            findUser && (
                              <tr key={i}>
                                <td>
                                  {findUser.first_name && findUser.last_name
                                    ? `${findUser.first_name} ${findUser.last_name}`
                                    : "User Name"}
                                </td>
                                <td>
                                  {moment(item.created_at).format(
                                    "MM/DD/YYYY hh:mm"
                                  )}
                                </td>
                              </tr>
                            )
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        </div>
        {clickedData.length > 0 && (
          <div className="d-flex justify-content-end align-items-center gap-2 p-2">
            <div className="flex-fill">
              {ClickedPaginationInfo({
                clickCurrentPage,
                limit: clickPerPage,
                clickTotalRecords,
              })}
            </div>

            {clickTotalPages > 1 && (
              <PaginationComponent
                totalRecords={clickTotalRecords}
                perPage={clickPerPage}
                currentPage={clickCurrentPage}
                onPageChange={handleClickPageChange}
              />
            )}
          </div>
        )}
        <ModalFooter className="position-relative overflow-hidden">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setModal(false)}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>

      {/* Viewed deals model */}
      <Modal size="md" isOpen={viewModal} toggle={toggleViewModel}>
        <ModalHeader>Viewed Deals</ModalHeader>
        {viewedData && (
          <div className="d-flex align-items-center gap-2 p-2">
            {ViewedPaginationInfo({
              viewCurrentPage,
              limit: viewPerPage,
              viewTotalRecords,
            })}
            <span>|</span>
            <div className="d-flex align-items-center gap-1">
              <span>Per Page:</span>
              <Dropdown
                size="sm"
                isOpen={viewPerPageDropdownOpen}
                toggle={toggleViewPerPageDropdown}
              >
                <DropdownToggle className="px-2 py-1" color="primary" caret>
                  {viewPerPage}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => setViewPerPage(10)}>
                    10
                  </DropdownItem>
                  <DropdownItem onClick={() => setViewPerPage(20)}>
                    20
                  </DropdownItem>
                  <DropdownItem onClick={() => setViewPerPage(50)}>
                    50
                  </DropdownItem>
                  <DropdownItem onClick={() => setViewPerPage(80)}>
                    80
                  </DropdownItem>
                  <DropdownItem onClick={() => setViewPerPage(100)}>
                    100
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        )}
        <div className="position-relative overflow-hidden">
          <>
            {viewedData && (
              <>
                {viewedData && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewedData.some(
                        (item) =>
                          !usersViewData.some(
                            (userData) => userData.user.user_id === item.user_id
                          )
                      ) ? (
                        <tr>
                          <td colSpan={2} className="text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : (
                        viewedData.map((item, i) => {
                          const userData = usersViewData.map((el) => el.user);
                          const findUser = userData.find(
                            (user) => user.user_id === item.user_id
                          );

                          return (
                            findUser && (
                              <tr key={i}>
                                <td>
                                  {findUser.first_name && findUser.last_name
                                    ? `${findUser.first_name} ${findUser.last_name}`
                                    : "User Name"}
                                </td>
                                <td>
                                  {moment(item.created_at).format(
                                    "MM/DD/YYYY hh:mm"
                                  )}
                                </td>
                              </tr>
                            )
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        </div>
        {viewedData.length > 0 && (
          <div className="d-flex justify-content-end align-items-center gap-2 p-2">
            <div className="flex-fill">
              {ViewedPaginationInfo({
                viewCurrentPage,
                limit: viewPerPage,
                viewTotalRecords,
              })}
            </div>

            {viewTotalPages > 1 && (
              <PaginationComponent
                totalRecords={viewTotalRecords}
                perPage={viewPerPage}
                currentPage={viewCurrentPage}
                onPageChange={handleViewPageChange}
              />
            )}
          </div>
        )}
        <ModalFooter className="position-relative overflow-hidden">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setViewModal(false)}
          >
            Close
          </button>
        </ModalFooter>
      </Modal>
    </div>
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

const ViewedPaginationInfo = ({
  viewTotalRecords,
  limit,
  viewCurrentPage,
}: {
  viewTotalRecords: number;
  limit: number;
  viewCurrentPage: number;
}) => {
  const startRecord = (viewCurrentPage - 1) * limit + 1;
  const endRecord = Math.min(viewCurrentPage * limit, viewTotalRecords);

  return (
    <p className="m-0">
      Showing <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{viewTotalRecords}</span>
    </p>
  );
};

const ClickedPaginationInfo = ({
  clickTotalRecords,
  limit,
  clickCurrentPage,
}: {
  clickTotalRecords: number;
  limit: number;
  clickCurrentPage: number;
}) => {
  const startRecord = (clickCurrentPage - 1) * limit + 1;
  const endRecord = Math.min(clickCurrentPage * limit, clickTotalRecords);

  return (
    <p className="m-0">
      Showing <span>{startRecord}</span>-<span>{endRecord}</span> of{" "}
      <span>{clickTotalRecords}</span>
    </p>
  );
};

export default withAuth(DealsListingAdmin);
