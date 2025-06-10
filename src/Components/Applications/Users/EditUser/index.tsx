import React from "react";
import { Container, Row,Card } from "reactstrap";
import EditUserForm from "./EditUsers/EditUserForm";

const EditUserContainer = () => {
  return (
    <Container>
      <div >
        <Card>
          <Row className="product-page-main">
          <EditUserForm />
          </Row>
        </Card>
      </div>
    </Container>
  );
};

export default EditUserContainer;
