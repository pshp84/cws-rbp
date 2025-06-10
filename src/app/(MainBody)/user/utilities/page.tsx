"use client";

import React from "react";
import { getOption } from "@/DbClient";
import { useEffect, useState } from "react";
import { Spinner } from "reactstrap";

const UserUtilities = () => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUtilityUrl = async () => {
    setLoading(true);
    try {
      const data = await getOption("utility_setup_url", true);
      setUrl(data);
      setLoading(false);
    } catch (error) {
      setUrl("");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilityUrl();
  }, []);

  if (loading) {
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
    <div>
      <a
        href={"#"}
        onClick={(e:any) => {
          e.preventDefault();
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      >
        {url}
      </a>
    </div>
  );
};

export default UserUtilities;
