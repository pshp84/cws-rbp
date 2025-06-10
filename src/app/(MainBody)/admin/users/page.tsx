"use client";

import UserListContainer from "@/Components/Applications/Ecommerce/UserList";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const AdminUsersPage = () => {
  return <UserListContainer />;
};

export default withAuth(AdminUsersPage);
