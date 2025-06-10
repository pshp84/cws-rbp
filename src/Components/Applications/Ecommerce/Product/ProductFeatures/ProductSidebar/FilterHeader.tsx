import { Col, Container, Label, Input } from "reactstrap";
import { Filters } from "@/Constant";
import { useAppDispatch } from "@/Redux/Hooks";
import { setSideBarOn } from "@/Redux/Reducers/FilterSlice";
import { useSSR } from "react-i18next";
import { useState } from "react";

export const FilterHeader = () => {
  const dispatch = useAppDispatch();
  const [selectedOption, setSelectedOption] = useState<string>("");

  const handleChange = (event: any) => {
    setSelectedOption(event.target.value);
  };

  return (
    // <CardHeader>
    //   <h4 className="mb-0 f-w-500">
    //     {Filters}
    //     <span className="pull-right" onClick={() => dispatch(setSideBarOn())}>
    //       <i className="fa fa-chevron-down toggle-data fs-6"></i>
    //     </span>
    //   </h4>
    // </CardHeader>
    <Container>
      {/* <Label for="exampleSelect">Select an Option</Label> */}
      <Input
        type="select"
        name="select"
        className="all_Sizes"
        id="exampleSelect"
        value={selectedOption}
        onChange={handleChange}
      >
        <option value="All sizes">{"All sizes"}</option>
        <option value="16x20x1 inches">{"16x20x1 inches"}</option>
        <option value="16x25x1 inches">{"16x25x1 inches"}</option>
        <option value="20x20x1 inches">{"20x20x1 inches"}</option>
      </Input>
    </Container>
    // <Col md="9" sm="12" className="pt-2">
    //   <div className="select2-drpdwn-product select-options d-inline-block all_Sizes">
    //     <Input
    //       type="select"
    //       className="form-control btn-square shadow-none"
    //       name="select"
    //     >
    //       <option value="All sizes">{"All sizes"}</option>
    //       <option value="16x20x1 inches">{"16x20x1 inches"}</option>
    //       <option value="16x25x1 inches">{"16x25x1 inches"}</option>
    //       <option value="20x20x1 inches">{"20x20x1 inches"}</option>
    //     </Input>
    //   </div>
    // </Col>
  );
};
