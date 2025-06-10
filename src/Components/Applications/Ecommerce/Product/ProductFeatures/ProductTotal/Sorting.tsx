import { Col, Input } from "reactstrap";
import { Featured, HighestPrices, LowestPrices } from "@/Constant";
import { ChangeEvent } from "react";
import { useAppDispatch } from "@/Redux/Hooks";
import { filterSortBy } from "@/Redux/Reducers/FilterSlice";

export const Sorting = () => {
  const dispatch = useAppDispatch();

  const filterSort = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(filterSortBy(event.target.value));
  };

  return (
    <Col md="6" className="text-sm-end pt-2 col-sm-9 ml-8">
      <div className="select2-drpdwn-product select-options d-inline-block w-full" onChange={filterSort}>
        <Input type="select" className="form-control btn-square shadow-none" name="select">
          <option value="Featured">{Featured}</option>
          <option value="LowestPrices">{LowestPrices}</option>
          <option value="HighestPrices">{HighestPrices}</option>
        </Input>
      </div>
    </Col>
  );
};
