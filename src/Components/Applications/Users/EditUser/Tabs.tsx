import { getUserRole } from "@/DbClient";
import { TabHeadingProps , NavComponentProp } from "@/Types/TabType";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Nav, NavItem, NavLink } from "reactstrap";

const HeaderTabs :React.FC<NavComponentProp> = ({ callbackActive, activeTab, userRole }) => {

    const { id:userID } = useParams();
    const [headingNavData, setHeadingNavData] = useState<TabHeadingProps[]>([
      {
        activeTab: 1,
        iconClassName: "fa-user",
        title: "Edit User",
      },
      {
        activeTab: 2,
        iconClassName: "fa-key",
        title: "Change Password",
      }
  ]);

    const handleTab = (id: number | undefined) => {
        if (id !== undefined) {
          callbackActive(id);
        }
    };

    useEffect(()=>{     
      if(userRole && userRole=="user") {
        setHeadingNavData([...headingNavData, {
          activeTab: 3,
          iconClassName: "fa-money",
          title: "Membership",
        }]);
      }
    },[userRole]);

    return (
        <Nav className="nav-pills horizontal-options shipping-options">
        {headingNavData.map((data, index) => (
          <NavItem className="w-100" key={index}>
            <NavLink className={`b-r-0 ${activeTab === index + 1 ? "active" : ""}`} onClick={() => handleTab(data.activeTab)}>
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
      </Nav>
    );
};
  
export default HeaderTabs;