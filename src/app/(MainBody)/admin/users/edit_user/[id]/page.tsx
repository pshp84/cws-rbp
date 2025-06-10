"use client"

import EditUserContainer from "@/Components/Applications/Users/EditUser";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const EditUserPage = () => {

  return <EditUserContainer/>
};

export default withAuth(EditUserPage);
