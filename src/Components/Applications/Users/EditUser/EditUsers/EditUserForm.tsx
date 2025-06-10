import { Col, Card, Row } from "reactstrap";
import { useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import HeaderTabs from "../Tabs";
import TabsContent from "./TabsContent";
import { getUserRole } from "@/DbClient";

const EditUserForm = () => {
  const { id: userID } = useParams();
  const [activeTab, setActiveTab] = useState<number | undefined>(1);
  const [userRole, setUserRole] = useState<string | undefined>();

  const callback = useCallback((tab: number | undefined) => {
    setActiveTab(tab);
  }, []);

  const checkUserRole = async () => {
    if (!userID || userID == "") return;
    const userRole = await getUserRole(userID.toString());
    if (typeof userRole === "boolean") return;
    setUserRole(userRole);
  }

  useEffect(() => {
    if (!userID || userID == "") return;
    checkUserRole();
  }, [userID]);

  return (
    <Col md="12">
      <Card>
        <Row className="shopping-wizard">
          <Col xs="12">
            <Row className="shipping-form g-5">
              <div className="shipping-border">
                <HeaderTabs callbackActive={callback} activeTab={activeTab} userRole={userRole} />
                <TabsContent activeTab={activeTab} userId={userID} callbackActive={callback} />
              </div>
            </Row>
          </Col>
        </Row>
        {/* </CardBody> */}
      </Card>
    </Col>
  );
};

export default EditUserForm;
