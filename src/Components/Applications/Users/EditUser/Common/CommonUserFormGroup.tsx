import { CommonUserFormGroupType } from "@/Types/UserType";
import { useState } from "react";
import { FormGroup, Input, Label } from "reactstrap";

const CommonUserFormGroup: React.FC<CommonUserFormGroupType> = ({
  type,
  title,
  placeholder,
  value,
  row,
  onChange,
  readOnly
}) => {
  return (
    <FormGroup>
      <Label check>{title}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        rows={row}
        autoComplete=""
        onChange={onChange}
        readOnly={readOnly}
      />
    </FormGroup>
  );
};

export default CommonUserFormGroup;
