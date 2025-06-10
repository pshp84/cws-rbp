import React, { useEffect, useState } from "react";
import {
  Card,
  Container,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  Spinner,
} from "reactstrap";
import ImageSlider from "./ImageSlider";
import { useAppDispatch } from "@/Redux/Hooks";
import { fetchProductApiData } from "@/Redux/Reducers/ProductSlice";
import ProductDetails from "./ProductDetails";
import BrandDetail from "./BrandDetail";
import ClothsDetails from "./ClothsDetails";
import Link from "next/link";
import RealtedDeal from "./RealtedDeal";
import { getDeal } from "@/DbClient";
import { DealData } from "@/Types/Deals";

interface Deals {
  dealId: number;
}

const ProductPageContainer: React.FC<Deals> = ({ dealId }) => {
  const DealsDetailsData: string[] = ["Description", "Terms & Conditions"];
  const DealDescriptionData: string[] = ["Description"];
  const [list, setList] = useState<DealData>();
  const [activeTab, setActiveTab] = useState(1);

  const fetchDealById = async () => {
    try {
      const result = await getDeal(dealId, true);
      setList(result);
    } catch (error) {}
  };

  useEffect(() => {
    fetchDealById();
  }, []);

  if (!list) {
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
    <>
      <Container style={{ marginTop: "0.5rem" }} fluid>
        <div>
          <Row>
            {list && <ImageSlider deal={list} />}
            {list && <ProductDetails deal={list} />}
            {/* <BrandDetail /> */}
          </Row>
          {/* {list?.terms_and_conditions !== null && (
            <Card>
              <Row className="product-page-main">
                {list && <ClothsDetails deal={list} activeTab={activeTab}/>}
              </Row>
            </Card>
          )} */}
          <Card>
            <Row className="product-page-main">
              <Col sm="12">
                <Nav tabs className="border-tab nav-primary mb-0">
                  {list && list.terms_and_conditions !== null ? (
                    <>
                      {DealsDetailsData.map((data, index) => (
                        <NavItem key={index}>
                          <NavLink
                            href={"#"}
                            className={activeTab === index + 1 ? "active" : ""}
                            onClick={() => setActiveTab(index + 1)}
                          >
                            {data}
                          </NavLink>
                        </NavItem>
                      ))}
                    </>
                  ) : (
                    <>
                      {DealDescriptionData.map((data, index) => (
                        <NavItem key={index}>
                          <NavLink
                            href={"#"}
                            className={activeTab === index + 1 ? "active" : ""}
                            onClick={() => setActiveTab(index + 1)}
                          >
                            {data}
                          </NavLink>
                        </NavItem>
                      ))}
                    </>
                  )}
                </Nav>

                {list && <ClothsDetails deal={list} activeTab={activeTab} />}
              </Col>
            </Row>
          </Card>
          {list && list.categories.length > 0 && (
            <Card>
              <Row className="product-page-main">
                {list && <RealtedDeal deal={list} />}
              </Row>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
};

export default ProductPageContainer;
