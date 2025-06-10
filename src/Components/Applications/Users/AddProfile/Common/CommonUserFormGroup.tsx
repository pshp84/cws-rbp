import { CommonUserFormGroupType } from "@/Types/UserType";
import { FormGroup, Input, Label  } from "reactstrap";

const CommonUserFormGroup: React.FC<CommonUserFormGroupType> = ({
  type,
  title,
  placeholder,
  value,
  row,
  onChange,
  name
}) => {
  return (
    <FormGroup>
      <Label check>{title}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        rows={row}
        name={name}
        autoComplete=""
        onChange={onChange}
      />
    </FormGroup>
  );
};

export default CommonUserFormGroup;
