import { Card, Row, Spinner } from "reactstrap";
import { useAppSelector } from "@/Redux/Hooks";
import { ImagePath } from "@/Constant";
import RatioImage from "@/CommonComponent/RatioImage";
import { DealData } from "@/Types/Deals";
import Link from "next/link";
import { addDealReport, ReportType } from "@/DbClient";
import { useEffect, useState } from "react";

interface Deals {
  deals: DealData[];
}

const ProductGrid: React.FC<Deals> = ({ deals }) => {
  const { listView } = useAppSelector((state) => state.filterData);
  const userId = localStorage.getItem("userId");
  const [validDeal, setValidDeal] = useState<DealData[]>([]);

  const viewDeal = async (id: number) => {
    try {
      await addDealReport({
        dealID: id,
        userID: userId as string,
        reportType: "view" as ReportType.View,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const currentDate = new Date();
    const today = new Date(currentDate.toISOString().split("T")[0]);
    const validDeals = deals.filter((deal) => {
      const dealEndDate = deal.end_date ? new Date(deal.end_date) : null;
      return deal.end_date === null || (dealEndDate && dealEndDate >= today);
    });
    setValidDeal(validDeals);
  }, [deals]);

  // if (!deals || !validDeal || validDeal.length <= 0) {
  //   return (
  //     <div
  //       className="d-flex justify-content-center align-items-center"
  //       style={{ height: "100vh" }}
  //     >
  //       <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
  //     </div>
  //   );
  // } 
  // else if (deals.length <= 0 || validDeal.length <= 0) {
  //   return (
  //     <div className="d-flex justify-content-center align-items-center">
  //       {"No deals found for selected category."}
  //     </div>
  //   );
  // }

  return (
    <div className={`product-wrapper-grid ${listView ? "list-view" : ""}`}>
      <Row className="gridRow">
        {validDeal &&
          validDeal.map((item: DealData, index: number) => {
            return (
              <div
                id="gridId"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
                className={`col-xl-3 col-sm-3`}
                key={index}
              >
                <Card className="cardStrap">
                  <div className="flexCard product-box">
                    <div className="product-img bg-img-cover">
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
                        src={`${
                          item.dealImageURL
                            ? item.dealImageURL
                            : `${ImagePath}/ecommerce/01.jpg`
                        }`}
                        alt=""
                      /> */}

                      {/* <HoverButtons setDataId={setDataId} setOpenModal={setOpenModal} item={item} /> */}
                    </div>
                    <div className="pDetail product-details">
                      <h4>{item.name}</h4>

                      <p>
                      {item.small_description ? item.small_description: ''}
                      </p>
                      <div className="product-price">
                        {item.sale_price ? "$" : ""}
                        {item.sale_price ? item.sale_price : ""}
                        <del className="f-w-700">
                          {item.regular_price ? "$" : ""}
                          {item.regular_price
                            ? item.regular_price.toFixed(2)
                            : ""}
                        </del>
                      </div>
                      <div className="mt-2 -mb-4">
                        <Link
                          href={`/user/deals/details/${item.deal_id}`}
                          onClick={() => viewDeal(item.deal_id)}
                          className="btn btn-primary text-white w-100"
                        >
                          {"Get Deal"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
      </Row>
    </div>
  );
};
export default ProductGrid;
