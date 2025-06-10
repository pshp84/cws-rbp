import { useAppSelector } from "@/Redux/Hooks";
import { DealData } from "@/Types/Deals";
import React, { useState } from "react";
import Slider from "react-slick";
import { Card, CardBody, Col } from "reactstrap";

interface Deal {
  deal: DealData;
}

const ImageSlider: React.FC<Deal> = ({ deal }) => {
  const [nav1, setNav1] = useState<Slider | null>();
  const [nav2, setNav2] = useState<Slider | null>();

  return (
    <Col md="4" className="">
      <Card className="detailCard">
        <CardBody className="p-2 ecommerce-slider">
          <Slider className="p-1" arrows={false} asNavFor={nav2!}>
            {/* {deal
              ? deal.map((item) => (
                  <img
                    src={`${item.image_url}`}
                    alt=""
                    className="rounded-4 p-2 detailCard"
                    key={item.image_url}
                  />
                ))
              : "No product Found"} */}
            {deal && deal.dealImageURL && (
              <img
                className="detailCard"
                src={deal.dealImageURL}
                alt={deal.name}
                style={{ width: "100%", height: "241px" }}
              />
            )}
            {!deal.dealImageURL && (
              <span className="p-2 bg-primary bg-gradient d-flex justify-content-center align-items-center text-white">
                <i
                  style={{
                    width: "100%",
                    height: "210px",
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                  className="fa fa-image"
                ></i>
              </span>
            )}
            {/* {deal ? (
              <img
              
                src={`${
                  deal.dealImageURL
                    ? deal.dealImageURL
                    : `/assets/images/ecommerce/01.jpg`
                }`}
                alt=""
                className="p-2 detailCard"
                style={{ width: "100%", height: "241px" }}
                key={
                  deal.dealImageURL
                    ? deal.dealImageURL
                    : `/assets/images/ecommerce/01.jpg`
                }
              />
            ) : (
              "No product Found"
            )} */}
          </Slider>
        </CardBody>
      </Card>
    </Col>
  );
};
export default ImageSlider;
