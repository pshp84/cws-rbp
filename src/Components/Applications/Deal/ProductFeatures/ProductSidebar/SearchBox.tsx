import { Col, Form, FormGroup, Input } from "reactstrap";
import { Search } from "@/Constant";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/Redux/Hooks";
import { filterSearchBy } from "@/Redux/Reducers/FilterSlice";
import { getDeals } from "@/DbClient";
import { toast } from "react-toastify";
import { DealData } from "@/Types/Deals";

export const SearchBox = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [deals, setDeals] = useState<DealData[]>([]);
  const dispatch = useAppDispatch();
  
  const handleSearchKeyword = (keyword: string) => {
    setSearchKeyword(keyword);
    dispatch(filterSearchBy(searchKeyword));
  };


  
  const fetchDealsList = async () => {
    try {
      const result = await getDeals();
      if (result && result.data) {
        setDeals(result.data);
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    fetchDealsList();
    // dispatch(fetchProductApiData());
  }, [searchKeyword]);

  return (
    <Col md="9" sm="12">
      <Form>
        <FormGroup className="form-group m-0">
          <Input className="form-control" type="search" placeholder={Search} value={searchKeyword} onChange={(e) => handleSearchKeyword(e.target.value)}/>
          <i className="fa fa-search"></i>
        </FormGroup>
      </Form>
    </Col>
  );
};
