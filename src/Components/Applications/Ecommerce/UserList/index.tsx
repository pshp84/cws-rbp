"use client";

import React, { useEffect, useState } from "react";
import PaginationComponent from "@/CommonComponent/PaginationComponent";
import { UsersList } from "@/Types/Users";
import Link from "next/link";
import { dbClient, getMembershipPlans, getUsers, getUsersArgsInterface, getUsersDataForCSV } from "@/DbClient";
import { MemberShipPlans } from "@/Types/Membership";
import { formatDate } from "@/Helper/commonHelpers";
import PaginationInfo from "@/CommonComponent/PaginationInfoComponent";
import CsvDownload from "react-csv-downloader";

const UserListContainer = () => {
  const [filterText, setFilterText] = useState("");
  const [users, setUsers] = useState<UsersList[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<Boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(50);
  const [displayOrder, setDisplayOrder] = useState<"desc" | "asc">("desc");
  const [filteredData, setFilteredData] = useState<UsersList[]>([]);
  const [plans, setPlans] = useState<MemberShipPlans[]>([]);
  const [optInData, setOptInData] = useState<{ meta_key: string, meta_value: string | boolean, user_id: string }[]>([]);
  const [isLoadingCsvData, setIsLoadingCsvData] = useState<boolean>(false);
  const [csvColumns, setCsvColumns] = useState([
    {
      id: 'cell1',
      displayName: '#',
    },
    {
      id: 'cell2',
      displayName: 'Full Name',
    },
    {
      id: 'cell3',
      displayName: 'Email',
    },
    {
      id: 'cell4',
      displayName: 'Phone Number',
    },
    {
      id: 'cell5',
      displayName: 'Role',
    },
    {
      id: 'cell6',
      displayName: 'Email Opt-In'
    },
    {
      id: 'cell7',
      displayName: 'Phone Opt-In'
    },
    {
      id: 'cell8',
      displayName: 'Street',
    },
    {
      id: 'cell9',
      displayName: 'Street 2',
    },
    {
      id: 'cell10',
      displayName: 'State',
    },
    {
      id: 'cell11',
      displayName: 'City',
    },
    {
      id: 'cell12',
      displayName: 'Zip Code',
    },
    {
      id: 'cell13',
      displayName: 'Country'
    },
    {
      id: 'cell14',
      displayName: 'Create Date'
    }
  ]);
  const [usersCsvData, setUsersCsvData] = useState<Array<any>>([]);

  const fetchCsvData = async () => {
    setIsLoadingCsvData(true);
    const data = await getUsersDataForCSV();
    setIsLoadingCsvData(false);
    if (typeof data === "boolean") return;

    const dataForCsv = data.map((userData) => {
      const { id, email, full_name, phone_number, role, created_at, email_opt_in, phone_number_opt_in, street, street2, city, state, zip_code, country } = userData;

      let roleName = "Subscriber";
      if (role && role === "property_manager") {
        roleName = "Property Manager";
      } else if (role && role === "admin") {
        roleName = "Admin";
      }

      const createDate = created_at ? formatDate(created_at) : "";
      
      return {
        cell1: id,
        cell2: full_name,
        cell3: email,
        cell4: phone_number,
        cell5: roleName,
        cell6: email_opt_in ? "Yes" : "No",
        cell7: phone_number_opt_in ? "Yes" : "No",
        cell8: street,
        cell9: street2,
        cell10: state,
        cell11: city,
        cell12: zip_code,
        cell13: country,
        cell14: createDate
      };
    });
    setUsersCsvData(dataForCsv);
    return;
  }

  const fetchUsers = async (page: number = 0) => {
    if (isLoading) return;
    setIsLoading(true);
    if (page !== 0) setCurrentPage(page);
    const getUsersArgs: getUsersArgsInterface = {
      page: page === 0 ? currentPage : page,
      limit: perPage,
      order: displayOrder,
    }
    if (filterText && filterText != "") getUsersArgs.search = filterText;
    const result = await getUsers(getUsersArgs);

    if (!result || !result.status) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    if (result && result.data) {
      if (result.totalPages) setTotalPages(result.totalPages);
      if (result.totalRecords) setTotalRecords(result.totalRecords);
      const userIds = result.data.map(user => user.user_id);

      const { data: metaData } = await dbClient
        .from("usermeta")
        .select("meta_key,meta_value,user_id")
        .in("meta_key", ["email_opt_in", "phone_number_opt_in"])
        .in("user_id", userIds);
      if (metaData && metaData.length > 0) {
        setOptInData(metaData);
      } else {
        setOptInData([]);
      }

      const { data: membershipsDBData } = await dbClient
        .from('memberships')
        .select('*')
        .in('user_id', userIds);

      if (!membershipsDBData || membershipsDBData.length <= 0) {
        setUsers(result.data);
        setIsLoading(false);
        return;
      }

      const usersWithMembership = await Promise.all(
        result.data.map(async (user) => {
          if (user.user_role !== "user") return { ...user };

          const membership = membershipsDBData?.filter(data => data.user_id == user.user_id)[0];
          if (!membership) return { ...user };

          return {
            ...user,
            planId: membership.plan_id || "",
            nextPaymentDate: membership.next_payment_date || undefined,
            membershipStatus: membership.status || undefined
          };
        })
      );
      setUsers(usersWithMembership);
      setIsLoading(false);
      return;
    }
  };

  const fetchUserPlans = async () => {
    try {
      const result = await getMembershipPlans(false);
      if (result) {
        setPlans(result);
      }
    } catch (error) { }
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleSearchClick = () => {
    const filtered =
      users &&
      users.filter(
        (item) =>
          (item.user_email &&
            item.user_email.toLowerCase().includes(filterText.toLowerCase())) ||
          (item.first_name &&
            item.first_name.toLowerCase().includes(filterText.toLowerCase())) ||
          (item.last_name &&
            item.last_name.toLowerCase().includes(filterText.toLowerCase())) ||
          (item.user_status !== undefined &&
            (item.user_status ? "Verified" : "Pending")
              .toLowerCase()
              .includes(filterText.toLowerCase())) ||
          (plans &&
            plans.some(
              (el) =>
                el.plan_id === item.planId &&
                el.plan_name.toLowerCase().includes(filterText.toLowerCase())
            ))
      );
    setFilteredData(filtered);
    setTotalRecords(filtered.length);
  };

  useEffect(() => {
    if (isLoading) return;
    fetchUsers(currentPage);
  }, [currentPage, perPage, displayOrder]);

  useEffect(() => {
    if (filterText === "") {
      setFilteredData(users);
    }
  }, [filterText, users]);

  useEffect(() => {
    fetchUserPlans();
    fetchCsvData();
  }, []);

  if (!users || !plans) {
    return (
      <>
        <div>Loading...</div>
      </>
    );
  }

  return (
    <>
      <div className="deals-listing col-12 mb-4">
        <div className="deals-listing-top-bar d-flex justify-content-end align-items-center gap-2 mb-3">
          <div className="flex-fill">
            {!isLoading && (
              <PaginationInfo currentPage={currentPage} recordsPerPage={perPage} totalRecords={totalRecords} showDropDown={true} onPerPageChange={setPerPage} />
            )}
          </div>
          <div className="input-group" style={{ maxWidth: "250px" }}>
            <input
              type="text"
              className="form-control py-1"
              placeholder="Search Users"
              onChange={(e) => {
                setFilterText(e.target.value);
              }}
              value={filterText}
            />
          </div>
          <button
            className="btn btn-outline-primary px-3"
            type="button"
            id="button-addon2"
            onClick={handleSearchClick}
          >
            <i className="fa fa-search"></i>
          </button>
          <CsvDownload
            columns={csvColumns}
            datas={usersCsvData}
            filename="RBP Users"
            extension=".csv"
            disabled={!(usersCsvData.length > 0)}
            suffix={true}
            wrapColumnChar='"'
          >
            <button className="btn btn-primary px-3" disabled={!(usersCsvData.length > 0)}>
              <i className="fa fa-download"></i> Download CSV
            </button>
          </CsvDownload>

          <Link href={"/admin/users/add_user"} className="btn btn-primary px-3">
            <i className="fa fa-plus"></i> Add User
          </Link>
        </div>
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
                  <th>User</th>
                  <th>Role</th>
                  <th>Membership</th>
                  <th>Email Opt-In</th>
                  <th>Phone Opt-In</th>
                  <th>Created Date &nbsp;
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
                    </a></th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length <= 0 && (
                  <tr>
                    <td className="text-center" colSpan={7}>
                      Users not found.
                    </td>
                  </tr>
                )}

                {filteredData.length > 0 &&
                  filteredData.map(async (user, userIndex) => {
                    let emailOptIn;
                    let phoneOptIn;
                    if (optInData && optInData.length > 0) {
                      const metaData = optInData.filter(data => data.user_id == user.user_id);
                      if (metaData) {
                        emailOptIn = metaData.filter(data => data.meta_key === "email_opt_in")[0];
                        phoneOptIn = metaData.filter(data => data.meta_key === "phone_number_opt_in")[0];
                      }
                    }

                    let userRole;
                    switch (user.user_role) {
                      case "property_manager":
                        userRole = "Property Manager"
                        break;

                      case "admin":
                        userRole = "Admin"
                        break;

                      default:
                        userRole = "Subscriber"
                        break;
                    }

                    return <tr>
                      <td>{userCard(user)}</td>
                      <td>{userRole}</td>
                      <td>{userMembershipCard(user, plans)}</td>
                      <td className="text-center">
                        {(emailOptIn?.meta_value && emailOptIn?.meta_value === "true") ? <i className="fa fa-check-circle text-success"></i> : <i className="fa fa-times-circle text-danger"></i>}
                      </td>
                      <td className="text-center">
                        {(phoneOptIn?.meta_value && phoneOptIn?.meta_value === "true") ? <i className="fa fa-check-circle text-success"></i> : <i className="fa fa-times-circle text-danger"></i>}
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <Link href={`/admin/users/edit_user/${user.user_id}`}>
                          <i className="fa fa-pencil"></i> Edit
                        </Link>
                      </td>
                    </tr>
                  })
                }

              </tbody>
            </table>
          </div>
        </div>

        {!isLoading && filteredData.length > 0 && (
          <div className="d-flex justify-content-end align-items-center gap-2">
            <div className="flex-fill">
              <PaginationInfo currentPage={currentPage} recordsPerPage={perPage} totalRecords={totalRecords} showDropDown={false} />
            </div>

            {/* {totalPages > 1 && ( */}
            <PaginationComponent
              totalRecords={totalRecords}
              perPage={perPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
            {/* )} */}
          </div>
        )}
      </div>
    </>
  );
};

const userCard = (user: UsersList) => {
  const userDisplayName = user.first_name.split("")[0] + user.last_name.split("")[0]
  return <div className="d-flex gap-2">
    <Link className="bg-dark rounded-circle d-flex justify-content-center align-items-center border border-3 border-secondary text-uppercase" style={{ width: "50px", height: "50px" }} href={`/admin/users/edit_user/${user.user_id}`}>{userDisplayName}</Link>
    <div>
      <div>
        <Link href={`/admin/users/edit_user/${user.user_id}`}>{`${user.first_name} ${user.last_name}`}</Link>
      </div>
      <div>
        <a href={`mailto:${user.user_email}`}><small><i className="fa fa-envelope"></i> {user.user_email}</small></a>
      </div>
      {user.phone_number &&
        <div>
          <a href={`tel:${user.phone_number}`}><small><i className="fa fa-phone"></i> {user.phone_number}</small></a>
        </div>
      }
    </div>
  </div>
}

const userMembershipCard = async (user: UsersList, plans: MemberShipPlans[] = []) => {

  if (!user.planId) return "-";
  const plan = plans.filter(data => data.plan_id === user.planId)[0];

  return <ul>
    {plan &&
      <li>
        <b>Plan:</b> <span>{plan.plan_name}</span>
      </li>
    }
    {user.nextPaymentDate &&
      <li>
        <b>Upcoming Payment:</b> <span>{formatDate(user.nextPaymentDate as string)}</span>
      </li>
    }
    {user.membershipStatus &&
      <li>
        <b>Status:</b> <span className="text-capitalize">{user.membershipStatus}</span>
      </li>
    }
  </ul>
}

export default UserListContainer;