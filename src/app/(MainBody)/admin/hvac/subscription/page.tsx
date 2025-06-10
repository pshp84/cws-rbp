"use client";
import { SearchTableButton } from "@/Constant";
import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Input,
  Label,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "reactstrap";
import { FilterData } from "@/Components/Applications/Ecommerce/AdminHvac/HvacSubscription/FilterData";
import { getProduct, getSubscriptions } from "@/DbClient";
import { HvacSubscription } from "@/Types/AdminHvacType";
import { toast } from "react-toastify";
import moment from "moment";
import { HvacSubButton } from "@/Types/EcommerceType";
import Link from "next/link";
import PaginationComponent from "@/CommonComponent/PaginationComponent";

const AdminSubscriptionContainer = () => {
  const [filterText, setFilterText] = useState("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [subscription, setSubscription] = useState<HvacSubscription[]>([]);
  const [name, setName] = useState<string>();
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [perPage, setPerPage] = useState<number>(50);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [filteredData, setFilteredData] = useState<HvacSubscription[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");

  const fetchSubscription = async (page: number = 0) => {
    setIsLoading(true);
    const result = await getSubscriptions({
      page: page === 0 ? currentPage : page,
      limit: perPage,
      displayOrder: displayOrder,
    });
    if (!result || !result.status) {
      setSubscription([]);
      setIsLoading(false);
      return;
    }
    if (result && result.data) {
      const fetchedOrders: any[] = result.data || [];

      const ids: number[] = fetchedOrders.map((el) => el.product_id);
      ids.forEach(async (el) => {
        const productName = await fetchProductName(el);
        setName(productName);
      });
      if (result.totalPages) setTotalPages(result.totalPages);
      if (result.totalRecords) setTotalRecords(result.totalRecords);
      setSubscription(fetchedOrders);
      setIsLoading(false);
      return;
    }
  };

  const formatAmount = (row: any) => {
    const amount = row.amount ?? 0;
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return formattedAmount;
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSubscription([]);
  };

  const fetchProductName = async (id: number): Promise<string> => {
    try {
      const result = await getProduct(id);
      return result?.name || "Unknown Product"; // Ensure fallback in case of missing product
    } catch (error) {
      console.error("Error fetching product:", error);
      return "Unknown Product";
    }
  };

  const handleSearchClick = () => {
    const filtered =
      subscription &&
      subscription.filter(
        (item) =>
          (item.users?.first_name &&
            item.users?.first_name
              .toLowerCase()
              .includes(filterText.toLowerCase())) ||
          (item.users?.last_name &&
            item.users.last_name
              .toLowerCase()
              .includes(filterText.toLowerCase())) ||
          (item.amount && item.amount.toFixed().includes(filterText))
      );
    setFilteredData(filtered);
  };

  useEffect(() => {
    fetchSubscription(currentPage);
  }, [currentPage, perPage, displayOrder]);

  useEffect(() => {
    if (filterText === "") {
      setFilteredData(subscription);
    }
  }, [filterText, subscription]);

  const HvacSubsTableButton: React.FC<HvacSubButton> = ({ name }) => {
    const [showLinks, setShowLinks] = useState(false);

    return (
      <span
        className="badge badge-warning"
        style={{ textTransform: "capitalize" }}
      >
        {name}
      </span>
      // <div
      //   style={{
      //     width: "200px",
      //     marginTop: "5px",
      //     position: "relative",
      //   }}
      //   onMouseEnter={() => setShowLinks(true)}
      //   onMouseLeave={() => setShowLinks(false)}
      // >
      //   <Button>{name}</Button>
      //   {showLinks ? (
      //     <>
      //       <div
      //         style={{ marginTop: "5px", marginBottom: "5px" }}
      //         className="status-links"
      //       >
      //         <Link href="#" className="status-link">
      //           Cancel
      //         </Link>
      //         |
      //         <Link href="#" className="status-link">
      //           Suspend
      //         </Link>
      //       </div>
      //     </>
      //   ) : (
      //     ""
      //   )}
      // </div>
    );
  };

  const AdminHvacSubscriptionsTableDataColumn = [
    {
      name: "Status",
      cell: (row: HvacSubscription) => (
        <HvacSubsTableButton name={row.subscription_status} />
      ),
      sortable: false,
      width: "80px",
    },
    {
      name: "Subscription",
      selector: (row: HvacSubscription) =>
        `${`#${row.subscription_id}`} ${row.users?.first_name} ${
          row.users?.last_name
        }`,
      sortable: true,
      width: "200px",
    },
    {
      name: "Items",
      selector: (row: HvacSubscription) => `${name}`,
      sortable: true,
      width: "250px",
    },
    {
      name: "Amount",
      cell: (row: HvacSubscription) => {
        const amount = row.amount ?? 0;
        const formattedAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);

        return `${formattedAmount} / ${row.frequency}`;
      },
      sortable: true,
      width: "150px",
    },
    {
      name: "Start Date",
      selector: (row: HvacSubscription) =>
        `${moment(row.start_date).format("MM/DD/YYYY")}`,
      sortable: true,
      width: "150px",
    },
    {
      name: "Next Payment Date",
      selector: (row: HvacSubscription) =>
        `${moment(row.next_order_date).format("MM/DD/YYYY")}`,
      sortable: true,
      width: "180px",
    },
  ];

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
          <div className="input-group" style={{ maxWidth: "250px" }}>
            <input
              type="text"
              className="form-control py-0"
              placeholder="Search Subscription"
              onChange={(e) => {
                setFilterText(e.target.value);
                handleSearchClick();
              }}
              value={filterText}
            />
            <button
              className="btn btn-outline-primary px-3"
              type="button"
              id="button-addon2"
              onClick={handleSearchClick}
            >
              <i className="fa fa-search"></i>
            </button>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Subscription</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>
                    Start Date &nbsp;
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();

                        const newDisplayOrder =
                          displayOrder == "asc" ? "desc" : "asc";
                        setDisplayOrder(newDisplayOrder);
                        setFilteredData([]);
                      }}
                    >
                      <i className={`fa fa-sort-${displayOrder}`}></i>
                    </a>
                  </th>
                  <th>Next Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="text-center" colSpan={9}>
                      Loading please wait...
                    </td>
                  </tr>
                ) : filteredData.length <= 0 ? (
                  <tr>
                    <td className="text-center" colSpan={9}>
                      Subscriptions not found.
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {filteredData.length > 0 &&
                  filteredData.map((item, itemIndex) => {
                    return (
                      <tr key={`subscription-tr-${itemIndex}`}>
                        <td className="">
                          <div className="">
                            <span
                              className="badge badge-warning"
                              style={{ textTransform: "capitalize" }}
                            >
                              {item.subscription_status}
                            </span>
                          </div>
                        </td>
                        <td className="">{`${`#${item.subscription_id}`} ${
                          item.users?.first_name
                        } ${item.users?.last_name}`}</td>
                        <td>{name}</td>
                        <td className="">{`${formatAmount(item)} / ${
                          item.frequency
                        }`}</td>
                        <td>{`${moment(item.start_date).format(
                          "MM/DD/YYYY"
                        )}`}</td>
                        <td>
                          {`${moment(item.next_order_date).format(
                            "MM/DD/YYYY"
                          )}`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && filteredData.length > 0 && (
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
    </>
    // <Container fluid>
    //   <Row>
    //     <Col sm="12">
    //       <Card>
    //         <CardBody>
    //           <div className="list-product-header">
    //             <FilterData />
    //           </div>
    //           <div className="list-product">
    //             <div style={{ width: "100%" }} className="table-responsive">
    //               <DataTable
    //                 className="theme-scrollbar"
    //                 data={filteredItems}
    //                 columns={AdminHvacSubscriptionsTableDataColumn}
    //                 striped
    //                 highlightOnHover
    //                 pagination
    //                 paginationServer
    //                 paginationTotalRows={totalPages * 10}
    //                 onChangePage={(page: number) => setCurrentPage(page)}
    //                 subHeader
    //                 subHeaderComponent={subHeaderComponentMemo}
    //                 progressPending={loading}
    //               />
    //             </div>
    //           </div>
    //         </CardBody>
    //       </Card>
    //     </Col>
    //   </Row>
    // </Container>
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

export default AdminSubscriptionContainer;
