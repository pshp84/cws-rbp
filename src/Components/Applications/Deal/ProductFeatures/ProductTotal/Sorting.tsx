import { Col, Input } from "reactstrap";
import { Featured, HighestPrices, LowestPrices } from "@/Constant";
import { ChangeEvent } from "react";
import { useAppDispatch } from "@/Redux/Hooks";
import { filterSortBy } from "@/Redux/Reducers/FilterSlice";

export const Sorting = () => {
  const ProductShown: string = "Showing Deals 1 - 24 Of 200 Results";
  const dispatch = useAppDispatch();

  const filterSort = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(filterSortBy(event.target.value));
  };

  return (
    <Col md="6" className="text-sm-end">
      <span className="f-w-600 m-r-5">{ProductShown}</span>
     
    </Col>
  );
};
