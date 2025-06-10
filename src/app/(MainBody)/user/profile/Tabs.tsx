import { getUserRole } from "@/DbClient";
import { TabHeadingProps, NavComponentProp } from "@/Types/TabType";
import React, { useEffect, useState } from "react";
import { Nav, NavItem, NavLink } from "reactstrap";

const HeaderTabs: React.FC<NavComponentProp> = ({
  callbackActive,
  activeTab,
}) => {
  const userId = localStorage.getItem("userId");
  const [role, setRole] = useState<string>("");
  const handleTab = (id: number | undefined) => {
    if (id !== undefined) {
      callbackActive(id);
    }
  };

  const fetchUserRole = async () => {
    try {
      const result = await getUserRole(userId as string);
      setRole(result);
    } catch (err) {}
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const HeadingNavData: TabHeadingProps[] = [
    {
      activeTab: 1,
      iconClassName: "fa-user",
      title: "User Details",
    },
    {
      activeTab: 2,
      iconClassName: "fa-key",
      title: "Change Password",
    },
    {
      activeTab: 3,
      iconClassName: "fa-check-square",
      title: "Membership",
    },
    {
      activeTab: 4,
      iconClassName: "fa-money",
      title: "Update Payment Method",
    },
  ];

  const AdminHeadingNavData: TabHeadingProps[] = [
    {
      activeTab: 1,
      iconClassName: "fa-user",
      title: "User Details",
    },
    {
      activeTab: 2,
      iconClassName: "fa-key",
      title: "Change Password",
    },
  ];

  return (
    <Nav className="nav-pills horizontal-options shipping-options">
      {role === "admin" ? (
        <>
          {AdminHeadingNavData.map((data, index) => (
            <NavItem className="w-100" key={index}>
              <NavLink
                className={`b-r-0 ${activeTab === index + 1 ? "active" : ""}`}
                onClick={() => handleTab(data.activeTab)}
              >
                <div className="cart-options">
                  <div className="stroke-icon-wizard">
                    <i className={`fa ${data.iconClassName}`} />
                  </div>
                  <div className="cart-options-content">
                    <h6>{data.title}</h6>
                  </div>
                </div>
              </NavLink>
            </NavItem>
          ))}
        </>
      ) : (
        <>
          {HeadingNavData.map((data, index) => (
            <NavItem className="w-100" key={index}>
              <NavLink
                className={`b-r-0 ${activeTab === index + 1 ? "active" : ""}`}
                onClick={() => handleTab(data.activeTab)}
              >
                <div className="cart-options">
                  <div className="stroke-icon-wizard">
                    <i className={`fa ${data.iconClassName}`} />
                  </div>
                  <div className="cart-options-content">
                    <h6>{data.title}</h6>
                  </div>
                </div>
              </NavLink>
            </NavItem>
          ))}
        </>
      )}
    </Nav>
  );
};

export default HeaderTabs;
