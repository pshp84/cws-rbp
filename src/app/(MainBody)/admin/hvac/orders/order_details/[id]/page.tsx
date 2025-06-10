 "use client";
import { useParams } from "next/navigation";
import React from "react";
import { CardBody, Col, Row, Card } from "reactstrap";

import DataTable from "react-data-table-component";

const OrderDetails = () => {
  const { id } = useParams();

  const orderItems = [
    { name: "Item 1", quantity: 2, unitPrice: 25, total: 50 },
    { name: "Item 2", quantity: 1, unitPrice: 100, total: 100 },
    { name: "Item 3", quantity: 3, unitPrice: 15, total: 45 },
  ];

  const subtotal = orderItems.reduce((acc, item) => acc + item.total, 0);

  const columns = [
    {
      name: "Item",
      selector: (row: any) => row.item,
      cell: (row: any) => (
        <a href="#" className="text-primary">
          {row.item}
        </a>
      ),
    },
    {
      name: "Cost",
      selector: (row: any) => row.cost,
      right: true,
      format: (row: any) => `$${row.cost.toFixed(2)}`,
    },
    {
      name: "Qty",
      selector: (row: any) => row.quantity,
      right: true,
      format: (row: any) => `× ${row.quantity}`,
    },
    {
      name: "Total",
      selector: (row: any) => row.total,
      right: true,
      format: (row: any) => `$${row.total.toFixed(2)}`,
    },
  ];

  const data = [
    {
      id: 1,
      item: "Solar Panel",
      cost: 25.0,
      quantity: 1,
      total: 25.0,
    },
  ];

  return (
    <>
      <Row>
        <Col md="8">
          <Card>
            <CardBody>
              <span>{`Order #${id} details`}</span>
              <br />
              <span>{`Payment via Bankwest. Paid on November 19,2024 at 1:41 pm`}</span>

              <Row style={{ marginTop: "10px" }}>
                <Col md="4">
                  <h5>Date created: 19,Nov 2024</h5>
                  <p style={{ marginTop: "2px" }}>Status: Completed</p>
                  <p style={{ marginTop: "-15px" }}>Customer: Test</p>
                </Col>
                <Col md="4">
                  <h5 style={{ marginBottom: "5px" }}>Billing Address</h5>
                  <p style={{ marginBottom: "2px" }}>Jane Doe</p>
                  <p style={{ marginBottom: "2px" }}>5678 Oak Avenue</p>
                  <p style={{ marginBottom: "2px" }}>Chicago, IL 60601</p>
                  <p style={{ marginBottom: "2px" }}>Phone: (555) 987-6543</p>
                </Col>
                <Col md="4">
                  <h5 style={{ marginBottom: "5px" }}>Shipping Address</h5>
                  <p style={{ marginBottom: "2px" }}>John Doe</p>
                  <p style={{ marginBottom: "2px" }}>1234 Elm Street</p>
                  <p style={{ marginBottom: "2px" }}>Springfield, IL 62704</p>
                  <p style={{ marginBottom: "2px" }}>Phone: (555) 123-4567</p>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col md="4">
          <Card>
            <CardBody>
              <Row>
                <Col md="8">
                  <span className="text-truncate f-w-600">
                    {"Package tracking div"}
                  </span>
                  {/* <span className="text-truncate f-w-600">
                    {"Payment via PayPal. Paid on November 19, 2024 @ 2:00 pm"}
                  </span> */}
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col md="8">
          <Card style={{ marginTop: "20px" }}>
            <CardBody>
              <DataTable columns={columns} data={data} noHeader dense />
              <div style={{float:"right",marginTop:"10px"}} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Items Subtotal:</span>
                  <span>$25.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Order Total:</span>
                  <span>$19.12</span>
                </div>
                <hr/>
                <div  className="flex justify-between items-center border-l-2">
                  <span>Paid:</span>
                  <span>$19.12</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* <Row>
        <Col md="8">
          <Card>
            <CardBody>
              <Row>
                <Col md="8">
                  <span className="text-truncate f-w-600">{`Order #${id} details`}</span>
                  <span className="text-truncate f-w-600">{`Payment via Bankquest. Paid on November 19, 2024 @ 1:41 pm`}</span>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card>
            <CardBody>
              <Row>
                <Col md="8">
                  <span className="text-truncate f-w-600">
                    {"Another Order #123 details"}
                  </span>
                  <span className="text-truncate f-w-600">
                    {"Payment via PayPal. Paid on November 19, 2024 @ 2:00 pm"}
                  </span>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row> */}
    </>
  );
};

export default OrderDetails;
