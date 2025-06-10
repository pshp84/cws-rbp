import { EditUserDetailsTabContentProp } from "@/Types/UserType";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TabContent,
  TabPane,
  CardBody,
  Card,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  CardFooter,
  Button,
  Spinner,
} from "reactstrap";
import {
  getUserById,
  getUserMeta,
  updateUser,
  updateUserMeta,
} from "@/DbClient";
import { toast } from "react-toastify";
import CommonUserFormGroup from "../Common/CommonUserFormGroup";
import { Email, FirstName, LastName } from "@/Constant";
import { State } from "country-state-city";

export type UserMeta = {
  [key: string]: string | null;
};

const EditUserFormBody: React.FC<EditUserDetailsTabContentProp> = ({
  activeTab,
  userId,
}) => {
  const id = userId;
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userMeta, setUserMeta] = useState<UserMeta>({});
  const [newPassword, setNewPassword] = useState<string>("");
  const [usStates, setUsStates] = useState<any>([]);

  const fetchUserById = async () => {
    const result = await getUserById(id, [
      "first_name",
      "last_name",
      "user_email",
      "user_role",
      "user_status",
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
    } catch (error) {}
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
    setUserMeta((prevMeta: UserMeta) => ({
      ...prevMeta,
      [field]: event.target.value,
    }));
  };

  const updateUserData = async () => {
    const userUpdateData = {
      firstName: user.first_name,
      lastName: user.last_name,
      userStatus: user.user_status,
      userRole: user.user_role,
    };

    try {
      const result = await updateUser(id, userUpdateData);
      if (!result) {
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
      toast.success("User updated successfully.");
      router.push("/admin/users");
    } catch (error) {
      console.error("Error updating user data or metadata", error);
      toast.error("An error occurred while updating user data");
    }
  };

  // const updateUserPassword = async () => {
  //   try {
  //     const { data, error } = await dbClient.auth.updateUser({
  //       password: newPassword,
  //     });
  //     console.log(data)
  //     if ((data.user ?? null) != null) {
  //       toast.success("Password updated successfully......");
  //     } else {
  //       toast.error("Something went wrong.Please try again later!");
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  return (
    <TabContent activeTab={activeTab}>
      <TabPane tabId={1}>
        <>
          <Card style={{ marginTop: "2rem" }}>
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
                </Col>
                <Col md="12">
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
                  {/* <CommonUserFormGroup
                    type="text"
                    title={"State"}
                    placeholder={"State"}
                    name="state"
                    value={userMeta && userMeta?.state ? userMeta?.state : ""}
                    onChange={(e: any) => handleMetaChange(e, "state")}
                  /> */}
             
                    <FormGroup>
                      <Label check>{"State"}</Label>
                      <Input
                        type="select"
                        name="state"
                        className="rounded-2 btn-square"
                        value={
                          userMeta && userMeta?.state ? userMeta?.state : ""
                        }
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
                    value={
                      userMeta && userMeta?.country ? userMeta?.country : ""
                    }
                    onChange={(e: any) => handleMetaChange(e, "country")}
                  />
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
              >
                {"Cancel"}
              </Button>
            </CardFooter>
          </Card>
        </>
      </TabPane>
      <TabPane tabId={2}>
        <Card style={{ marginTop: "2rem" }}>
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
            >
              {"Cancel"}
            </Button>
          </CardFooter>
        </Card>
      </TabPane>
      <TabPane tabId={3}>
        <p className="mb-0 m-t-20"> {"membership"}</p>
      </TabPane>
    </TabContent>
  );
};

export default EditUserFormBody;
