import {
  Col,
  Row,
  Card,
  Spinner,
} from "reactstrap";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/Redux/Hooks";
import Link from "next/link";
import { DealData } from "@/Types/Deals";
import { getDeals } from "@/DbClient";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";

interface Deal {
  deal: DealData;
}

const RealtedDeal: React.FC<Deal> = ({ deal }) => {
  const { symbol } = useAppSelector((state) => state.product);
  const { id } = useParams();
  const [deals, setDeals] = useState<DealData[]>([]);
  const getIds = deal && deal.categories.map((el) => el.category_id);

  const fetchDealsList = async () => {
    try {
      const result = await getDeals();
      if (result && result.data) {
        const filteredDeals = result.data.filter((deal) =>
          deal.categories.some((category: any) =>
            getIds.includes(category.category_id)
          )
        );
        const filteredDealsCatrgory = filteredDeals.filter(
          (item: DealData) => item.deal_id !== Number(id)
        );
        setDeals(filteredDealsCatrgory);
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

  if (!deals || deals.length <= 0) {
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
      <Row>
        <Col sm="12">
          <h4 style={{ marginTop: "-1rem" }}>Related Deals</h4>
          <div
            style={{ marginTop: "-2rem" }}
            className={`product-wrapper-grid ${""}`}
          >
            <Row className="gridRow gRow">
              {deals && deals.length > 0 ? (
                <>
              {deals &&
                deals.map((item, index) => (
                  <div
                    id="gridId"
                    style={{ marginTop: "1rem" }}
                    className={`col-xl-3 col-sm-3`}
                    key={index}
                  >
                    <Card className="cardStrap2">
                      <div className="flexCard product-box">
                        <div className="product-img bg-img-cover">
                          {/* {item.status !== "none" && (
                          <div
                            className={`ribbon-index ${item.ribbonClassName}`}
                          >
                            {item.status}
                          </div>
                        )} */}
                          {item && item.dealImageURL && (
                            <img
                              className="img-fluid"
                              src={item.dealImageURL}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "241px",
                                objectFit: "cover",
                              }}
                            />
                          )}
                          {!item.dealImageURL && (
                            <span
                              className="bg-primary bg-gradient d-flex justify-content-center align-items-center text-white"
                              style={{
                                width: "100%",
                                height: "241px",
                                fontSize: "20px",
                                objectFit: "cover",
                              }}
                            >
                              <i className="fa fa-image"></i>
                            </span>
                          )}
                          {/* <RatioImage
                            className="img-fluid"
                            style={{ height: 241 }}
                            src={`${
                              item.dealImageURL
                                ? item.dealImageURL
                                : "/assets/images/ecommerce/01.jpg"
                            }`}
                            alt=""
                          /> */}
                        </div>
                        <div
                          style={{ borderRadius: "0px" }}
                          className="pDetail product-details"
                        >
                          <h4>{item.name}</h4>

                          <p>
                            {item.small_description &&
                              item.small_description.replace(
                                /<\/?[^>]+(>|$)/g,
                                ""
                              )}
                          </p>
                          {!item.regular_price || !item.sale_price ? (
                            <>{""}</>
                          ) : (
                            <>
                              <div className="product-price">
                                {item.sale_price ? symbol : ""}
                                {item.sale_price ? item.sale_price : ""}
                                <del className="f-w-700">
                                  {item.regular_price ? symbol : ""}
                                  {item.regular_price
                                    ? item.regular_price.toFixed(2)
                                    : ""}
                                </del>
                              </div>
                            </>
                          )}
                          {/* <div className="product-price">
                      {item.price ? symbol : ""}
                      {item.price ? item.price : ""}
                      <del className="f-w-700">
                        {item.discountPrice ? symbol : ""}
                        {item.discountPrice ? item.discountPrice : ""}
                      </del>
                    </div> */}
                          <div className={`mt-2`}>
                            <Link
                              href={`/user/deals/details/${item.deal_id}`}
                              className={`btn btn-primary text-white w-100`}
                            >
                              {"Get Deal"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
               </>
              ):<div className="mt-4">{"No related deals available"}</div>}
               
            </Row>
          </div>
        </Col>
      </Row>
     
    </>
  );
};

export default RealtedDeal;
