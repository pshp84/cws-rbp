import { useAppSelector } from "@/Redux/Hooks";
import { DealData } from "@/Types/Deals";
import { ProductDetailsProp } from "@/Types/EcommerceType";
import Link from "next/link";

interface Deals {
  item: DealData[];
}

export const ProductDetails: React.FC<Deals> = ({ item }) => {
  // const { symbol } = useAppSelector((state) => state.product);
  return (
    <>
      {item &&
        Array.isArray(item) &&
        item.length > 0 &&
        item.map((el, i) => (
          <div
            style={{ borderRadius: "0px" }}
            className="pDetail product-details"
            key={i}
          >
            <Link href={`/ecommerce/product_page`}>
              <h4>{el.name}</h4>
            </Link>
            <p>{el.small_description}</p>
            <div className="product-price">
              {el.regular_price ? "$" : ""}
              {el.regular_price ? el.regular_price : ""}
              <del className="f-w-700">
                {el.sale_price ? "$" : ""}
                {el.sale_price ? el.sale_price : ""}
              </del>
            </div>
            <div className="mt-2">
              <Link
                href={`/user/deals/details/${el.deal_id}`}
                className="btn btn-primary text-white w-100"
              >
                {"Get Deal"}
              </Link>
            </div>
          </div>
        ))}
    </>
  );
};
