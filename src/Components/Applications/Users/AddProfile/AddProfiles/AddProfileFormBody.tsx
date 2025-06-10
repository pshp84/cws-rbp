import {
  CardBody,
  Col,
  FormGroup,
  Input,
  Label,
  Row,
  CardFooter,
  Button,
} from "reactstrap";
import { Email, EmailAddress, FirstName, LastName, PhoneNumber } from "@/Constant";
import CommonUserFormGroup from "../Common/CommonUserFormGroup";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  addUser,
  dbClient,
  getMembershipPlans,
  getUserMembership,
  userAddDataInterface,
  userRoles,
} from "@/DbClient";
import { toast } from "react-toastify";
import { MemberShipPlans } from "@/Types/Membership";
import { addUserToBrevo } from "@/CommonComponent/brevoContactLists";
import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import { PropertyManagerAPIFormData } from "@/app/api/create-property-manager/route";

export const AddProfileFormBody = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    userRole: userRoles.User,
    userStatus: false,
    userMembership: "",
    phoneNumber: "",
    emailOptIn: false,
    phoneOptIn: false
  });
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [details, setDetails] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const fetchMembershipPlans = async () => {
    try {
      const result = await getMembershipPlans(false);
      if (result) {
        setDetails(result);
      }
    } catch (err) { }
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleRoles = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const addNewUser = async () => {
    setSubmitted(true);
    setIsLoading(true);
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.phoneNumber
    ) {
      setIsLoading(false);
      return;
    } else {

      // property manager add process
      if (formData.userRole == userRoles.PropertyManager) {

        const { data: sessionData } = await dbClient.auth.getSession();
        if (!sessionData || !sessionData.session?.access_token) {
          setSubmitted(false);
          setIsLoading(false);
          toast.error("Admin user error. Unable to add Property manager user! Please contact to support team.");
          return;
        }

        const token = sessionData.session?.access_token;

        try {
          const payload: PropertyManagerAPIFormData = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: Number(formData.phoneNumber),
            emailOptIn: formData.emailOptIn,
            phoneNumberOptIn: formData.phoneOptIn
          }
          if (typeof formData.userStatus === "boolean") payload.userStatus = formData.userStatus;
          const addPropertyManagerData = await rbpApiCall.post(`/create-property-manager`, payload, {
            headers: {
              AuthorizationToken: token,
            },
          });
        } catch (error) {
          console.error("Error while creating Property Manager user", error);
          toast.error("Unable to add Property manager user! Please contact to support team.");
          setSubmitted(false);
          setIsLoading(false);
          return;
        }

        setSubmitted(false);
        toast.success("Property manager user created successfully.");
        router.push("/admin/users");
        setIsLoading(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          userRole: userRoles.User,
          userStatus: false,
          userMembership: "",
          phoneNumber: "",
          emailOptIn: false,
          phoneOptIn: false
        });
        return;
      }
      // EOF property manager add process

      const planId = Number(formData.userMembership);
      const baseUrl =
        formData.userRole === "admin"
          ? `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}sign-in?success=1`
          : `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}sign-up?plan=${planId}`;
      const data: userAddDataInterface = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userStatus: formData.userStatus,
        userRole: formData.userRole as userRoles,
        emailRedirectTo: baseUrl,
        phoneNumber: Number(formData.phoneNumber),
        emailOptIn: formData.emailOptIn,
        phoneNumberOptIn: formData.phoneOptIn
      };
      try {
        const result = await addUser(data);
        if (result) {
          if (formData.userRole === "user") {
            const listId = Number(process.env.NEXT_PUBLIC_BREVO_LIST_IDS);
            const brevoData: any = {
              email: formData.email,
              attributes: {
                FIRSTNAME: formData.firstName,
                LASTNAME: formData.lastName,
                SMS: "",
              },
              listIds: [listId],
              emailBlacklisted: false,
              smsBlacklisted: false,
              listUnsubscribed: null,
            };
            await addUserToBrevo(brevoData);
          }
          toast.success("New user added successfully.");
        }
        setSubmitted(false);
        setIsLoading(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          userRole: userRoles.User,
          userStatus: false,
          userMembership: "",
          phoneNumber: "",
          emailOptIn: false,
          phoneOptIn: false
        });
        router.push("/admin/users");
      } catch (error) {
        console.log(error);
        //toast.error(error);
      }
    }
  };

  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center z-3 top-0 start-0" style={{ backgroundColor: "rgba(255,255,255, 0.8)" }}>
          <div className="custom-loader">
            <LoadingIcon withOverlap={true} />
          </div>
        </div>
      )}
      <CardBody>
        <>
          <Row>
            <Col sm="6" md="6">
              <CommonUserFormGroup
                type="text"
                name="firstName"
                title={FirstName}
                placeholder={FirstName}
                value={formData ? formData.firstName : ""}
                onChange={handleChange}
              />
              {submitted && !formData.firstName && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"First name is required."}
                </div>
              )}
              {formData.firstName &&
                /[^A-Za-z0-9 ]/.test(formData.firstName) && (
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
                value={formData && formData.lastName}
                onChange={handleChange}
                name="lastName"
              />
              {submitted && !formData.lastName && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Last name is required."}
                </div>
              )}
              {formData.lastName &&
                /[^A-Za-z0-9 ]/.test(formData.lastName) && (
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
                type="email"
                title={EmailAddress}
                placeholder={Email}
                value={formData && formData.email}
                onChange={handleChange}
                name="email"
              />
              {!emailRegex.test(formData.email) && formData.email ? (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Please enter a valid email address."}
                </div>
              ) : (
                ""
              )}
              {submitted && !formData.email && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Email is required."}
                </div>
              )}
            </Col>
            <Col sm="6" md="6">
              <CommonUserFormGroup
                type="number"
                title={PhoneNumber}
                placeholder={PhoneNumber}
                value={formData && formData.phoneNumber}
                onChange={handleChange}
                name="phoneNumber"
              />
              {submitted && !formData.phoneNumber && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {PhoneNumber + " is required."}
                </div>
              )}
            </Col>
            <Col sm="6" md="12">
              <CommonUserFormGroup
                type="password"
                title={"Password"}
                placeholder={"******"}
                value={formData.password}
                onChange={handleChange}
                name="password"
              />
              {formData.password && formData.password.length <= 8 && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Password must be at least 8 characters."}
                </div>
              )}
              {submitted && !formData.password && (
                <div style={{ color: "red", marginTop: "-10px" }}>
                  {"Password is required."}
                </div>
              )}
            </Col>
            <Col md="12">
              <FormGroup>
                <Label check>{"User Role"}</Label>
                <Input
                  type="select"
                  className="rounded-2 btn-square"
                  value={formData && formData.userRole}
                  onChange={handleChange}
                  name="userRole"
                >
                  <option value="">--Select--</option>
                  <option value={userRoles.Admin}>{"Admin"}</option>
                  <option value={userRoles.PropertyManager}>{"Property Manager"}</option>
                  <option value={userRoles.User}>{"User"}</option>
                </Input>
              </FormGroup>
            </Col>
            <Col sm="6" md="5">
              <FormGroup check>
                <Label check>
                  <Input
                    type="checkbox"
                    checked={formData && formData.userStatus}
                    onChange={handleRoles}
                    name="userStatus"
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
                    checked={formData && formData.emailOptIn}
                    onChange={handleRoles}
                    name="emailOptIn"
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
                    checked={formData && formData.phoneOptIn}
                    onChange={handleRoles}
                    name="phoneOptIn"
                  />
                  {"Receive SMS updates and promotions."}
                </Label>
              </FormGroup>
            </Col>
            {formData.userRole === "user" && (
              <Col md="12">
                <FormGroup>
                  <Label check>{"User Membership"}</Label>
                  <Input
                    type="select"
                    className="rounded-2 btn-square"
                    name="userMembership"
                    value={formData && formData.userMembership}
                    onChange={handleChange}
                  >
                    <option value="">Select Membership</option>
                    {(details as MemberShipPlans[]).map(
                      (item: MemberShipPlans, index: number) => (
                        <option value={item.plan_id} key={index}>
                          {item.plan_name +
                            "( " +
                            item.plan_amount +
                            " / " +
                            item.plan_frequency +
                            " )"}
                        </option>
                      )
                    )}
                  </Input>
                </FormGroup>
              </Col>
            )}
          </Row>
        </>
      </CardBody>
      <CardFooter className="text-end">
        <Button type="button" onClick={addNewUser} color="primary">
          {"Add User"}
        </Button>

        <Button
          style={{ marginLeft: "5px" }}
          onClick={() => router.push("/admin/users")}
          color="primary"
        >
          {"Cancel"}
        </Button>
      </CardFooter>
    </>
  );
};
