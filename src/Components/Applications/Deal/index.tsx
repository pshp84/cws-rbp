import { useAppDispatch, useAppSelector } from "@/Redux/Hooks";
import React, { useEffect, useState } from "react";
import { CardHeader, Container, Label, Spinner } from "reactstrap";
import ProductGrid from "./ProductGrid";
import { getDealCategories, getDeals } from "@/DbClient";
import { DealCategory, DealData } from "@/Types/Deals";
import { toast } from "react-toastify";
import { Card, CardBody, Col, Row, Form, FormGroup, Input } from "reactstrap";
import { setSideBarOn } from "@/Redux/Reducers/FilterSlice";

const DealContainer = () => {
  const { sideBarOn } = useAppSelector((state) => state.filterData);
  const dispatch = useAppDispatch();
  const [deals, setDeals] = useState<DealData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [category, setCategory] = useState<DealCategory[]>([]);

  const fetchDealsList = async () => {
    try {
      const result = await getDeals({
        imageSize: {
          height: 221,
          resize: "fill",
        },
      });
      const categories = await getDealCategories();
      if (result && result.data && categories) {
        setDeals(result.data);
        setCategory(categories);
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDealsList();
  }, []);

  const handleCategoryChange = (category: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((item) => item !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const filteredDeals = deals.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length
      ? item.categories.some((category) =>
          selectedCategories.includes(category.category_id)
        )
      : true;
    return matchesSearch && matchesCategory;
  });

  if (deals.length === 0) {
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
    <Container className={`product-wrapper ${sideBarOn ? "sidebaron" : ""}`}>
      <div className="product-grid">
        <div className="feature-products">
          <Row>
            <Col sm="3">
              {/* ${isFilter ? "open" : ""} */}
              <div className={`product-sidebar `}>
                <div className="filter-section">
                  <Card>
                    <CardHeader>
                      <h4 className="mb-0 f-w-500">
                        {"Filters"}
                        <span
                          className="pull-right"
                          onClick={() => dispatch(setSideBarOn())}
                        >
                          <i className="fa fa-chevron-down toggle-data fs-6"></i>
                        </span>
                      </h4>
                    </CardHeader>
                    <div className="left-filter theme-scrollbar z-1">
                      <CardBody className="filter-cards-view animate-chk theme-scrollbar">
                        <div className="product-filter">
                          <h4 className="f-w-600 mb-2">{"Category"}</h4>
                          <div className="checkbox-animated mt-0">
                            {category &&
                              category.map((item) => (
                                <Label
                                  className="d-block"
                                  key={item.category_id}
                                >
                                  <Input
                                    className="checkbox_animated"
                                    type="checkbox"
                                    name="name"
                                    value={item.name}
                                    checked={selectedCategories.includes(
                                      item.category_id
                                    )}
                                    onChange={() =>
                                      handleCategoryChange(item.category_id)
                                    }
                                  />
                                  {item.name}
                                </Label>
                              ))}
                          </div>
                        </div>
                      </CardBody>
                    </div>
                  </Card>
                </div>
              </div>
            </Col>
            <Col md="9" sm="12">
              <Form>
                <FormGroup className="form-group m-0">
                  <Input
                    className="form-control"
                    type="search"
                    placeholder={"Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fa fa-search"></i>
                </FormGroup>
              </Form>
            </Col>
          </Row>
        </div>
        {/* <ProductFeatures /> */}
     
        {/* <ProductGrid deals={filteredDeals} /> */}

        {filteredDeals.length > 0 ? (
          <ProductGrid deals={filteredDeals} />
        ) : (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "50vh" }}
          >
            <h4>No deals found for selected category</h4>
          </div>
        )}
      </div>
    </Container>
  );
};

export default DealContainer;
