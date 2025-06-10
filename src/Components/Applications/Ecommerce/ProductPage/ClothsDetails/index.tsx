import { CardBody, Col, Nav, NavItem, NavLink, Row, Card } from "reactstrap";
import { Href } from "@/Constant";
import { useState } from "react";
import ClothsDetailsTabContent from "./ClothsDetailsTabContent";
import { DealData } from "@/Types/Deals";
import { TabContent, TabPane } from "reactstrap";

interface Deal {
  deal: DealData;
  activeTab: number;
}

const ClothsDetails: React.FC<Deal> = ({ deal, activeTab }) => {
  return (
    <>
      <TabContent activeTab={activeTab}>
        <TabPane tabId={1}>
          <p className="mb-0 m-t-20">
            {deal && deal.description ? (
              <div>{deal.description.replace(/<[^>]+>/g, "")}</div>
            ) : (
              "No description found"
            )}
          </p>
        </TabPane>
        <TabPane tabId={2}>
          <p className="mb-0 m-t-20">
            {deal && deal.terms_and_conditions ? (
              <div>{deal.terms_and_conditions.replace(/<[^>]+>/g, "")}</div>
            ) : (
              "No conditions applied"
            )}
          </p>
        </TabPane>
      </TabContent>
      {/* <Row>
        <Col sm="12">
          <h4 style={{ marginTop: "-1rem" }}>Terms & Conditions</h4>
          <div className="mt-2">
            {deal && deal.terms_and_conditions ? (
              <div>{deal.terms_and_conditions.replace(/<[^>]+>/g, '')}</div>
            ) : (
              "No conditions applied"
            )}
          </div>
        </Col>
      </Row> */}
    </>
  );
};

export default ClothsDetails;
