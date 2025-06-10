import { AddToCart, AddToWishList, BuyNow } from "@/Constant";
import { useAppSelector } from "@/Redux/Hooks";
import Link from "next/link";

export const ProductDetailButton = () => {
  

  return (
    <div className="m-t-15 btn-showcase">
      {/* <Link className="btn btn-primary" href={`/ecommerce/cart`} title="">
        <i className="fa fa-shopping-basket me-1"></i>
        {AddToCart}
      </Link> */}
      <Link className="btn btn-success" href={`/user/deals`} title="">
        {/* <i className="fa fa-shopping-cart me-1"></i> */}
        {"Get Deal"}
      </Link>
      <Link style={{float: "right",marginTop:"1rem"}} className="mt-2" href={`/user/deals`} title="">
 
        {"Back to deals"}
      </Link>
      {/* <Link className="btn btn-secondary" href={`/ecommerce/wishlist`}>
        <i className="fa fa-heart me-1"></i>
        {AddToWishList}
      </Link> */}
    </div>
  );
};
