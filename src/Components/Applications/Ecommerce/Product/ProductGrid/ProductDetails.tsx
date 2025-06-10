import { useAppSelector } from "@/Redux/Hooks";
import { ProductDetailsProp } from "@/Types/EcommerceType";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rating } from "react-simple-star-rating";
import { Button } from "reactstrap";

export const ProductDetails: React.FC<ProductDetailsProp> = ({ item }) => {
  const { symbol } = useAppSelector((state) => state.product);
  const router = useRouter();
  
  return (
    <div className="product-details">
      {/* <Rating fillColor="#ffa800" initialValue={Math.random() * 5} size={17} /> */}
      <Link href={`/ecommerce/product_page`}>
        <h4>{item.name}</h4>
      </Link>
      <p>{item.note}</p>
      <p>{`Size: ${item.size}`}</p>
      {/* <div className="product-price">
        {symbol}
        {item.price}
        <del className="f-w-700">
          {symbol}
          {item.discountPrice}
        </del>
        
      </div> */}
      <div className="detailsButton">
      <Button
          type="button"
          
          onClick={() => router.push(`/ecommerce/product_page`)}
          className="btn btn-primary text-white"
        >
          {"View Details"}
        </Button>
        </div>
    </div>
  );
};
