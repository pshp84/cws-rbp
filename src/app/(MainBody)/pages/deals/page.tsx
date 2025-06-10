"use client";
//import { ProductItemInterface } from "@/Types/EcommerceType";
//import Link from "next/link";
import React from "react";
//import { Button, Card, Container, Row } from "reactstrap";

// const ProductApiData: ProductItemInterface[] = [
//   {
//     id: 1,
//     image: "06.jpg",
//     name: "HEPA Filter",
//     note: "High efficiency particulate air filter, captures 99.97% of particles.",
//     description:
//       "High efficiency particulate air filter, captures 99.97% of particles.",
//     discountPrice: "35.00",
//     status: "none",
//     price: 120.0,
//     stock: "Out of stock",
//     review: "(120 review)",
//     category: "HEPA Filter",
//     rating: 4,
//     colors: ["White", "gray"],
//     size: "16x20x1",
//     tags: ["Diesel", "Hudson", "Lee"],
//     variants: [
//       {
//         color: "White",
//         images: "01.jpg",
//       },
//       {
//         color: "gray",
//         images: "02.jpg",
//       },
//       {
//         color: "black",
//         images: "03.jpg",
//       },
//       {
//         color: "pink",
//         images: "04.jpg",
//       },
//     ],
//   },
//   {
//     id: 2,
//     image: "07.jpg",
//     name: "Carbon Filter",
//     note: "Solid men's T-shirt",
//     description:
//       "Absorbs odors and harmful gases, improving indoor air quality.",
//     discountPrice: "320.00",
//     status: "Sale",
//     ribbonClassName: "ribbon ribbon-danger",
//     price: 260.0,
//     stock: "In stock",
//     review: "(120 review)",
//     rating: 3,
//     category: "Carbon Filter",
//     colors: ["green", "gray"],
//     size: "20x20x1",
//     tags: ["Levis", "Hudson", "Lee"],
//     variants: [
//       {
//         color: "White",
//         images: "05.jpg",
//       },
//       {
//         color: "gray",
//         images: "06.jpg",
//       },
//       {
//         color: "gray",
//         images: "07.jpg",
//       },
//       {
//         color: "gray",
//         images: "08.jpg",
//       },
//     ],
//   },
//   {
//     id: 3,
//     image: "03.jpg",
//     name: "MERV 13 Filter",
//     note: "Polyester Blend Women's Fit Dress",
//     description:
//       "Filters dust, pollen, smoke, and pet dander, rated for superior filtration.",
//     discountPrice: "110.00",
//     price: 60.0,
//     //status: "50%",
//     stock: "In stock",
//     review: "(200 review)",
//     rating: 2,
//     category: "MERV 13 Filter",
//     colors: ["White", "gray", "blue"],
//     size: "16x25x1",
//     tags: ["Diesel", "Spykar", "Lee"],
//     variants: [
//       {
//         color: "White",
//         images: "09.jpg",
//       },
//       {
//         color: "gray",
//         images: "10.jpg",
//       },
//       {
//         color: "gray",
//         images: "11.jpg",
//       },
//       {
//         color: "gray",
//         images: "12.jpg",
//       },
//     ],
//   },
//   {
//     id: 4,
//     image: "03.jpg",
//     name: "UV Light Filter",
//     note: "Regular Fit women's Casual Shirt",
//     description:
//       "Utilizes UV light to kill bacteria and viruses, enhancing air quality.",
//     discountPrice: "610.00",
//     price: 526.0,
//     status: "none",
//     stock: "In stock",
//     review: "(410 review)",
//     rating: 1,
//     category: "UV Light Filter",
//     colors: ["red", "gray", "blue"],
//     size: "20x20x1",
//     tags: ["Lee", "Levis", "Hudson"],
//     variants: [
//       {
//         color: "White",
//         images: "13.jpg",
//       },
//       {
//         color: "gray",
//         images: "14.jpg",
//       },
//       {
//         color: "gray",
//         images: "15.jpg",
//       },
//       {
//         color: "gray",
//         images: "16.jpg",
//       },
//     ],
//   },
//   {
//     id: 5,
//     image: "02.jpg",
//     name: "Pleated Air Filter",
//     note: "Silk Cotton Regular Fit T-Shirt",
//     description:
//       "Pleated design increases surface area for better filtration and airflow.",
//     discountPrice: "230.00",
//     price: 206.0,
//     stock: "In stock",
//     ribbonClassName: "ribbon ribbon-success ribbon-right",
//     status: "50%",
//     review: "(120 review)",
//     rating: 5,
//     category: "Pleated Air Filter",
//     colors: ["green", "White", "blue"],
//     size: "20x20x1",
//     tags: ["Diesel", "Spykar", "Denien"],
//     variants: [
//       {
//         color: "White",
//         images: "01.jpg",
//       },
//       {
//         color: "gray",
//         images: "02.jpg",
//       },
//     ],
//   },
// ];

const UserDealsContainer = () => {
  return (
    <>
    {/* <Container fluid className={`product-wrapper`}>
    <div className="product-grid">
      <div className={`product-wrapper-grid list-view`}>
        <Row className="gridRow">
          {ProductApiData &&
            ProductApiData.map((item: ProductItemInterface, index: number) => {
              return (
                <div id="gridId" className={"col-xl-3 col-sm-6 xl-4"} key={index}>
                  <Card>
                    <div className="product-box">
                      <div className="product-img bg-img-cover">
                     
                        <div className="product-details">
                         
                          <Link href={`/ecommerce/product_page`}>
                            <h4>{item.name}</h4>
                          </Link>
                          <p>{item.note}</p>
                          <p>{`Size: ${item.size}`}</p>
                          
                          <div className="detailsButton">
                            <Button
                              type="button"
                              className="btn btn-primary text-white"
                            >
                              {"View Details"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
        </Row>
      </div>
      </div>
      </Container> */}
      UserDealsContainer
    </>
  );
};

export default UserDealsContainer;
