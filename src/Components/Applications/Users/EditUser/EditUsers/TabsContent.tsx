import {
  TabContent,
  TabPane,
  Card,
  CardBody,
  Row,
  Col,
  CardFooter,
  Button,
  Spinner,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import { TabContentPropsType } from "@/Types/TabType";
import CommonUserFormGroup from "../Common/CommonUserFormGroup";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getUserById,
  getUserMeta,
  updateUser,
  updateUserMeta,
} from "@/DbClient";
import { toast } from "react-toastify";
import { Email, FirstName, LastName, PhoneNumber } from "@/Constant";
import UserMembershipDetails from "./UserMembershipDetails";
import { State } from "country-state-city";
import { updateUserToBrevo } from "@/CommonComponent/brevoContactLists";
import LoadingIcon from "@/CommonComponent/LoadingIcon";

export type UserMeta = {
  [key: string]: string | null;
};

const TabsContent: React.FC<TabContentPropsType> = ({
  activeTab,
  callbackActive,
  userId,
}) => {
  const id = userId;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta>({});
  const [newPassword, setNewPassword] = useState<string>("");
  const [usStates, setUsStates] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const fetchUserById = async () => {
    const result = await getUserById(id, [
      "first_name",
      "last_name",
      "user_email",
      "user_role",
      "user_status",
      "phone_number"
    ]);
    if (result) {
      setUser(result);
    } else {
      console.error("Error fetching user.");
    }
  };

  const fetchUserMetaData = async () => {
    try {
      const result = await getUserMeta(id);
      const metaData: UserMeta = {};
      result.forEach((meta: any) => {
        metaData[meta.meta_key] = meta.meta_value;
      });
      setUserMeta(metaData);
    } catch (error) { }
  };

  useEffect(() => {
    const allStates = State.getStatesOfCountry("US");
    setUsStates(allStates);
  }, []);

  useEffect(() => {
    fetchUserById();
    fetchUserMetaData();
  }, [id]);

  if (!user) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
      </div>
    );
  }

  const isCheckbox = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ): event is React.ChangeEvent<HTMLInputElement> => {
    return (event.target as HTMLInputElement).type === "checkbox";
  };

  const handleInputChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    field: string
  ) => {
    if (isCheckbox(event)) {
      setUser((prevUser: any) => ({
        ...prevUser,
        [field]: event.target.checked,
      }));
    } else {
      setUser((prevUser: any) => ({
        ...prevUser,
        [field]: event.target.value,
      }));
    }
  };

  const handleMetaChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    let value = event.target.value;
    if (isCheckbox(event)) {
      value = (event.target.checked) ? "true" : "false";
    }
    setUserMeta((prevMeta: UserMeta) => ({
      ...prevMeta,
      [field]: value,
    }));
  };

  const updateUserData = async () => {
    setIsLoading(true);
    const userUpdateData = {
      firstName: user.first_name,
      lastName: user.last_name,
      userStatus: user.user_status,
      userRole: user.user_role,
      phoneNumber: user.phone_number
    };

    try {
      const result = await updateUser(id, userUpdateData);
      if (!result) {
        setIsLoading(false);
        toast.error("Failed to update user data");
        return;
      }
      for (let metaKey in userMeta) {
        const metaValue = userMeta[metaKey];
        if (metaValue) {
          const metaUpdateResult = await updateUserMeta(id, metaKey, metaValue);
          if (!metaUpdateResult) {
            console.error(`Failed to update ${metaKey}`);
          }
        }
      }
      const listId = Number(process.env.NEXT_PUBLIC_BREVO_LIST_IDS)
      const brevoData: any = {
        email: user.user_email,
        attributes: {
          FIRSTNAME: user.first_name,
          LASTNAME: user.last_name,
          SMS: "",
        },
        listIds: [listId],
        emailBlacklisted: false,
        smsBlacklisted: false,
        listUnsubscribed: null,
      };

      await updateUserToBrevo(brevoData);
      setIsLoading(false);
      toast.success("User updated successfully.");
      router.push("/admin/users");
    } catch (error) {
      setIsLoading(false);
      console.error("Error updating user data or metadata", error);
      toast.error("An error occurred while updating user data");
    }
  };

  return (
    <TabContent className="dark-field shipping-content" activeTab={activeTab}>
      <TabPane tabId={1}>
        <>
          {isLoading && (
            <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
              <div className="custom-loader">
                <LoadingIcon withOverlap={true} />
              </div>
            </div>
          )}
          <CardBody>
            <Row>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={FirstName}
                  placeholder={FirstName}
                  value={user && user.first_name}
                  onChange={(event: any) =>
                    handleInputChange(event, "first_name")
                  }
                />
                {!user.first_name && (
                  <div style={{ color: "red", marginTop: "-10px" }}>
                    {"First name is required."}
                  </div>
                )}
                {user.first_name &&
                  /[^A-Za-z0-9 ]/.test(user.first_name) && (
                    <div
                      style={{ color: "red", marginTop: "-10px" }}
                      className=""
                    >
                      {"Special characters are not allowed."}
                    </div>
                  )}
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={LastName}
                  placeholder={LastName}
                  value={user && user.last_name}
                  onChange={(event: any) =>
                    handleInputChange(event, "last_name")
                  }
                />
                {!user.last_name && (
                  <div style={{ color: "red", marginTop: "-10px" }}>
                    {"Last name is required."}
                  </div>
                )}
                {user.last_name &&
                  /[^A-Za-z0-9 ]/.test(user.last_name) && (
                    <div
                      style={{ color: "red", marginTop: "-10px" }}
                      className=""
                    >
                      {"Special characters are not allowed."}
                    </div>
                  )}
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={Email}
                  placeholder={Email}
                  value={user && user.user_email}
                  readOnly={true}
                />
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="number"
                  title={PhoneNumber}
                  placeholder={PhoneNumber}
                  value={user && user.phone_number}
                  onChange={(event: any) =>
                    handleInputChange(event, "phone_number")
                  }
                />
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={"Street"}
                  placeholder={"Street"}
                  name="street"
                  value={userMeta && userMeta?.street ? userMeta?.street : ""}
                  onChange={(e: any) => handleMetaChange(e, "street")}
                />
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={"Street 2"}
                  placeholder={"Street 2"}
                  name="street2"
                  value={(userMeta && userMeta?.street2) || ""}
                  onChange={(e: any) => handleMetaChange(e, "street2")}
                />
              </Col>
              <Col sm="6" md="6">
                <FormGroup>
                  <Label check>{"State"}</Label>
                  <Input
                    type="select"
                    name="state"
                    className="rounded-2 btn-square"
                    value={userMeta && userMeta?.state ? userMeta?.state : ""}
                    onChange={(e) => handleMetaChange(e, "state")}
                  >
                    <option value="">Select a state</option>
                    {usStates.map((state: any) => (
                      <option key={state.isoCode} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={"City"}
                  placeholder={"City"}
                  name="city"
                  value={userMeta && userMeta?.city ? userMeta?.city : ""}
                  onChange={(e: any) => handleMetaChange(e, "city")}
                />
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={"Zip"}
                  placeholder={"Zip"}
                  name="zip_code"
                  value={
                    userMeta && userMeta?.zip_code ? userMeta?.zip_code : ""
                  }
                  onChange={(e: any) => handleMetaChange(e, "zip_code")}
                />
              </Col>
              <Col sm="6" md="6">
                <CommonUserFormGroup
                  type="text"
                  title={"Country"}
                  placeholder={"Country"}
                  name="country"
                  readOnly
                  value={"US"}
                //onChange={(e: any) => handleMetaChange(e, "country")}
                />
                {/* {submitted && !formData.country && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Country is required"}
                </div>
              )} */}
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label check>{"User Role"}</Label>
                  <Input
                    type="select"
                    className="rounded-2 btn-square"
                    value={user && user.user_role}
                    onChange={(e) => handleInputChange(e, "user_role")}
                  >
                    <option value="">--Select--</option>
                    <option value="admin">{"Admin"}</option>
                    <option value="user">{"User"}</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col sm="6" md="5">
                <FormGroup check>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={user && user.user_status}
                      onChange={(e) => handleInputChange(e, "user_status")}
                    />
                    {"Status"}
                  </Label>
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup check>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={userMeta && userMeta?.email_opt_in === "true" ? true : false}
                      onChange={(e: any) => handleMetaChange(e, "email_opt_in")}
                    />
                    {"Receive email updates and promotions."}
                  </Label>
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup check>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={userMeta && userMeta?.phone_number_opt_in === "true" ? true : false}
                      onChange={(e: any) => handleMetaChange(e, "phone_number_opt_in")}
                    />
                    {"Receive SMS updates and promotions."}
                  </Label>
                </FormGroup>
              </Col>
            </Row>
          </CardBody>
          <CardFooter className="text-end">
            <Button onClick={updateUserData} color="primary">
              {"Update User"}
            </Button>
            <Button
              style={{ marginLeft: "5px" }}
              onClick={() => router.push("/admin/users")}
              color="primary"
              outline
            >
              {"Cancel"}
            </Button>
          </CardFooter>
        </>
      </TabPane>
      <TabPane tabId={2}>
        <>
          <CardBody>
            <Row>
              <Col sm="6" md="12">
                <CommonUserFormGroup
                  type="password"
                  title={"Password"}
                  placeholder={"******"}
                  value={newPassword ? newPassword : ""}
                  onChange={(e) => setNewPassword(e.target.value)}
                  name="password"
                />
              </Col>
            </Row>
          </CardBody>
          <CardFooter className="text-end">
            <Button type="button" color="primary">
              {"Save"}
            </Button>
            <Button
              style={{ marginLeft: "5px" }}
              onClick={() => router.push("/admin/users")}
              color="primary"
              outline
            >
              {"Cancel"}
            </Button>
          </CardFooter>
        </>
      </TabPane>
      {user?.user_role && user?.user_role == "user" &&
        <TabPane tabId={3}>
          <UserMembershipDetails callbackActive={callbackActive} />
        </TabPane>
      }
    </TabContent>
  );
};

export default TabsContent;
