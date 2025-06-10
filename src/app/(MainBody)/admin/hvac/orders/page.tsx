"use client";
import { AdminHvacOrderTableDataColumn } from "@/Data/Application/Ecommerce";
import React, { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Spinner,
} from "reactstrap";
import { getOrderByID, getOrderMeta, getOrders } from "@/DbClient";
import { HvacOrders } from "@/Types/AdminHvacType";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import Link from "next/link";
import SVG from "@/CommonComponent/SVG";
import moment from "moment";

const AdminOrdersContainer = () => {
  const [filterText, setFilterText] = useState("");
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [orders, setOrders] = useState<HvacOrders[]>([]);
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [perPage, setPerPage] = useState<number>(50);
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<HvacOrders[]>([]);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");

  const fetchOrders = async (page: number = 0) => {
    setIsLoading(true);
    const result = await getOrders({
      page: page === 0 ? currentPage : page,
      limit: perPage,
      displayOrder: displayOrder,
    });

    if (!result || !result.status) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    if (result && result.status) {
      const fetchedOrders: any[] = result.data || [];
      const orderIds: number[] = fetchedOrders.map((order) => order.order_id);

      if (orderIds.length > 0) {
        const data = await fetchOrderById(orderIds);
        const subscriptionIds = await fetchOrderMeta(orderIds);

        const updatedOrders = data.map((order: any, index: number) => {
          order.subscription_id = subscriptionIds[index];
          return order;
        });
        if (result.totalPages) setTotalPages(result.totalPages);
        if (result.totalRecords) setTotalRecords(result.totalRecords);
        setOrders(updatedOrders);
        setIsLoading(false);
        return;
      }
    }
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilteredOrders([]);
  };

  const fetchOrderById = async (orderIds: number[]): Promise<any[]> => {
    const orderDetails: any[] = [];
    try {
      for (const orderId of orderIds) {
        try {
          const data = await getOrderByID(orderId, true);
          if (data) {
            orderDetails.push(data);
          }
        } catch (error) {
          console.error(`Error fetching order with ID ${orderId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error processing order IDs:", error);
    }
    return orderDetails;
  };

  const fetchOrderMeta = async (orderIds: number[]): Promise<any[]> => {
    const orderMeta: any[] = [];
    try {
      for (const orderId of orderIds) {
        try {
          const subscriptionId = await getOrderMeta(
            orderId,
            "subscription_id",
            true
          );
          if (subscriptionId) {
            orderMeta.push(subscriptionId);
          } else {
            orderMeta.push(null);
          }
        } catch (error) {
          console.error(
            `Error fetching subscription_id for order ${orderId}:`,
            error
          );
          orderMeta.push(null);
        }
      }
    } catch (error) {
      console.error("Error processing order IDs:", error);
    }
    return orderMeta;
  };

  const getFormattedAmount = (row: any) => {
    const getAmount = row.orderItems?.map((el: any) => el.price) || [];

    const totalAmount = getAmount.reduce(
      (acc: any, price: any) => acc + (price || 0),
      0
    );

    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(totalAmount);

    return formattedAmount; // Return the formatted amount
  };

  const handleSearchClick = () => {
    const filtered =
      orders &&
      orders.filter(
        (order) =>
          (order.order_id &&
            order.order_id.toString().includes(filterText.toLowerCase())) ||
          (order.users?.first_name &&
            order.users.first_name
              .toLowerCase()
              .includes(filterText.toLowerCase())) ||
          (order.users?.last_name &&
            order.users.last_name.toLowerCase().includes(filterText)) ||
          (order.order_status &&
            order.order_status.toLowerCase().includes(filterText.toLowerCase()))
      );
    setFilteredOrders(filtered);
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, perPage, displayOrder]);

  useEffect(() => {
    if (filterText === "") {
      setFilteredOrders(orders);
    }
  }, [filterText, orders]);

  if (!filteredOrders) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
      </div>
    );
  }

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
              placeholder="Search Orders"
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
                  <th>Action</th>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Subscription ID</th>
                  <th>Amount</th>
                  <th>
                    Date &nbsp;
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();

                        const newDisplayOrder =
                          displayOrder == "asc" ? "desc" : "asc";
                        setDisplayOrder(newDisplayOrder);
                        setFilteredOrders([]);
                      }}
                    >
                      <i className={`fa fa-sort-${displayOrder}`}></i>
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="text-center" colSpan={9}>
                      Loading please wait...
                    </td>
                  </tr>
                ) : filteredOrders.length <= 0 ? (
                  <tr>
                    <td className="text-center" colSpan={9}>
                      Orders not found.
                    </td>
                  </tr>
                ) : (
                  ""
                )}
                {filteredOrders.length > 0 &&
                  filteredOrders.map((order, orderIndex) => {
                    return (
                      <tr key={`order-tr-${orderIndex}`}>
                        <td className="text-center">
                          {" "}
                          <div className="product-action">
                            <Link
                              href={`/admin/hvac/orders/order_details/${order.order_id}`}
                            >
                              <SVG iconId="edit-content" />
                            </Link>
                          </div>
                        </td>
                        <td className="">
                          <div className="">
                            <Link
                              href={`/admin/hvac/orders/order_details/${order.order_id}`}
                            >{`#${order.order_id}`}</Link>
                            <span
                              style={{ marginLeft: "4px" }}
                            >{` ${order.users?.first_name} ${order.users?.last_name}`}</span>
                          </div>
                        </td>
                        <td className="p-0">{`${order.productsData
                          ?.map((el) =>
                            el.product_type === "variation" ? el.name : ""
                          )
                          .filter((name) => name)
                          .join(", ")}`}</td>
                        <td>{order.order_status}</td>
                        <td className="text-center">{order.subscription_id}</td>
                        <td>{getFormattedAmount(order)}</td>
                        <td>
                          {order.order_date
                            ? moment(order.order_date).format("MM/DD/YYY hh:mm")
                            : ""}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && filteredOrders.length > 0 && (
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
    //             <CollapseFilterData />
    //           </div>
    //           <div className="list-product">
    //             <div style={{ width: "100%" }} className="table-responsive">
    //               <DataTable
    //                 className="theme-scrollbar"
    //                 data={filteredItems}
    //                 columns={AdminHvacOrderTableDataColumn}
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

export default AdminOrdersContainer;
