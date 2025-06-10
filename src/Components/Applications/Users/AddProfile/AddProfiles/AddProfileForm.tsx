import { Card, Col, Form } from "reactstrap";
import { AddProfileFormBody } from "./AddProfileFormBody";
import CommonCardHeader from "@/CommonComponent/CommonCardHeader";

const AddProfileForm = () => {
  return (
    <Col xl="8">
      <Form onSubmit={(event) => event.preventDefault()}>
        <Card>
          <CommonCardHeader title={"Add User"} />
          <AddProfileFormBody />
        </Card>
      </Form>
    </Col>
  );
};

export default AddProfileForm;
