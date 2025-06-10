"use client";
import { useState , useCallback } from "react";
import { Card, CardBody, Col, Row , Container } from "reactstrap";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";
import { CommonCardHeaderProp } from "@/Types/UikitsType";
// import UserDetails from "@/CommonComponent/UserDetails/page";
import HeaderTabs from "./Tabs";
import UserProfileFormTabContent from "./Tabscontent";
import withAuth from "@/Components/WithAuth/WithAuth";

const UserProfile = () => {
  const headerProps :CommonCardHeaderProp = {
    title : "Profile Details",
    span: [
      { text: "Check Profile Details and Update necessary fields." }
    ]
  };

  const [activeTab, setActiveTab] = useState<number | undefined>(1);
  const callback = useCallback((tab: number | undefined) => {
    setActiveTab(tab);
  }, []);

  return (
    <Container fluid>
    <Row>
      <Col xl="12" md="12">
        <Card>
          <CommonCardHeader title={ headerProps.title } span={ headerProps.span }></CommonCardHeader>
          <CardBody>
            <Row className="shopping-wizard">
              <Col xs="12">
                <Row className="shipping-form g-5">
                  <div className="shipping-border">
                  <HeaderTabs callbackActive={callback} activeTab={activeTab}></HeaderTabs>
                  <UserProfileFormTabContent activeTab={activeTab} callbackActive={callback}></UserProfileFormTabContent>
                  </div> 
                </Row>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
    </Container>
  );
};

export default withAuth(UserProfile);
