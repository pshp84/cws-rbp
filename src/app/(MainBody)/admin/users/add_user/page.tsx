"use client"
import AddProfileContainer from "@/Components/Applications/Users/AddProfile";
import withAuth from "@/Components/WithAuth/WithAuth";
import React from "react";

const AddUserPage = () => {
  return <AddProfileContainer/>
};

export default withAuth(AddUserPage);
