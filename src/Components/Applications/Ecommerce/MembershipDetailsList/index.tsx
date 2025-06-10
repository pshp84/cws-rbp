import { MembershipListTableDataColumn } from "@/Data/Application/Ecommerce";
import React, { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "reactstrap";
import { getMemberships } from "@/DbClient";
import { MembershipDetais } from "@/Types/Membership";
import moment from "moment";
import Link from "next/link";
import SVG from "@/CommonComponent/SVG";
import PaginationComponent from "@/CommonComponent/PaginationComponent";

const MembershipDetailsListContainer = () => {
  const [users, setUsers] = useState<MembershipDetais[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [perPageDropdownOpen, setPerPageDropdownOpen] = useState(false);
  const [filterText, setFilterText] = useState<string>("");
  const [filteredData, setFilteredData] = useState<MembershipDetais[]>([]);

  const fetchUsers = async (page: number = 0) => {
    setIsLoading(true);
    const result = await getMemberships({
      page: page === 0 ? currentPage : page,
      limit: perPage,
      order: displayOrder,
      orderBy: "start_date",
    });

    if (!result.data || !result.status) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    if (result.totalRecords) setTotalRecords(result.totalRecords);
    if (result.totalPages) setTotalPages(result.totalPages);
    if (result.data) setUsers(result.data);
    setIsLoading(false);
    return;
  };

  const togglePerPageDropdown = () =>
    setPerPageDropdownOpen((prevState) => !prevState);
  const handlePageChange = (page: number) => setCurrentPage(page);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, perPage, displayOrder]);

  useEffect(() => {
    if (filterText === "") {
      setFilteredData(users);
    }
  }, [filterText, users]);

  const handleSearchClick = () => {
    const filtered =
      users &&
      users.filter(
        (item) =>
          (item.membership_plans.plan_name &&
            item.membership_plans.plan_name
              .toLowerCase()
              .includes(filterText.toLowerCase())) ||
          (item.membership_plans.plan_frequency &&
            item.membership_plans.plan_frequency
              .toLowerCase()
              .includes(filterText.toLowerCase()))
      );
    setFilteredData(filtered);
  };

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

  if (!users) {
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
              placeholder="Search Memberships"
              onChange={(e) => setFilterText(e.target.value)}
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
                  <th>Name</th>
                  <th>Plan Name</th>
                  <th>Plan Frequency</th>
                  <th>Plan Amount</th>
                  <th style={{ width: "125px" }}>
                    Start Date &nbsp;
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
                  <th>Status</th>
                  <th>Next Payment Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length <= 0 && (
                  <tr>
                    <td className="text-center" colSpan={9}>
                      Memberships not found.
                    </td>
                  </tr>
                )}
                {filteredData.length > 0 &&
                  filteredData.map((user, userIndex) => {
                    return (
                      <tr key={`deal-tr-${userIndex}`}>
                        <td>
                          {" "}
                          <div className="product-action">
                            <Link
                              href={`/admin/memberships/details/${user.user_id}`}
                            >
                              <SVG iconId="edit-content" />
                            </Link>
                          </div>
                        </td>
                        <td className="">
                          {user.users.first_name} {user.users.last_name}
                        </td>
                        <td>{user.membership_plans.plan_name}</td>
                        <td>{user.membership_plans.plan_frequency}</td>
                        <td>{formatPlanAmount(user)}</td>
                        <td>
                          {user.start_date
                            ? moment(user.start_date).format("MM/DD/YYYY")
                            : ""}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              user.status == "hold"
                                ? "badge-warning"
                                : "badge-success"
                            }`}
                            style={{
                              textTransform: "capitalize",
                              width: "50px",
                            }}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td>
                          {user.next_payment_date
                            ? moment(user.next_payment_date).format(
                                "MM/DD/YYYY"
                              )
                            : ""}
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
        {/* <Container fluid>
        <Row>
          <Col sm="12">
            <Card>
              <CardBody>
                <div className="list-product">
                  <div
                    style={{ width: "100%", cursor: "pointer" }}
                    className="table-responsive"
                  >
                    <DataTable
                      className="theme-scrollbar"
                      data={users}
                      columns={MembershipListTableDataColumn}
                      striped
                      highlightOnHover
                      pagination
                      paginationServer
                      paginationTotalRows={totalPages * 10}
                      onChangePage={(page: number) => setCurrentPage(page)}
                      progressPending={loading}
                      // onRowClicked={handleRowClick}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container> */}
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

export default MembershipDetailsListContainer;
