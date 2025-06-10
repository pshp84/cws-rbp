import React from "react";
import { Container, Row } from "reactstrap";
import AddProfileForm from "./AddProfiles/AddProfileForm";

const AddProfileContainer = () => {
  return (
    <Container fluid>
      <div className="edit-profile">
        <Row>
          <AddProfileForm />
        </Row>
      </div>
    </Container>
  );
};

export default AddProfileContainer;
