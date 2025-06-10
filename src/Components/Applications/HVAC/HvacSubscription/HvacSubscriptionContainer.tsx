import {
  getAttributes,
  getAttributeValues,
  getUserById,
  getUserMeta,
  SelectedAttribute,
  updateUserMeta,
} from "@/DbClient";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Button,
  Spinner,
  CardHeader,
} from "reactstrap";
import { State } from "country-state-city";
import {
  hvacFilterCheckout,
  HvacFilterSubscriptionInterface,
} from "@/Helper/hvacFilters";
import { toast } from "react-toastify";

type HvacAttribute = {
  attribute_id: number;
  attribute_name: string;
};

type HvacAttributeValues = {
  attribute_id: number;
  attribute_value_id: number;
  attribute_value: string;
};

type UserMeta = {
  [key: string]: string;
};

const HvacSubscriptionContainer = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [singleData, setSingleData] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
  });
  const [attributeData, setAttributeData] = useState<HvacAttribute[]>([]);
  const [attributesValues, setAttributesValues] = useState<
    HvacAttributeValues[]
  >([]);
  const [selectedValues, setSelectedValues] = useState<{
    [key: number]: number;
  }>({});
  const getUserId = localStorage.getItem("userId");
  const [userMeta, setUserMeta] = useState<UserMeta>({});
  const [values, setValues] = useState<any>();
  const [usStates, setUsStates] = useState<any>([]);
  const [users, setUsers] = useState<any>();
  const userId = localStorage.getItem("userId");

  const fetchUserAttributes = async () => {
    let mergedAttributs: HvacAttributeValues[] = [];
    try {
      const attributes = await getAttributes();
      if (attributes && Array.isArray(attributes)) {
        setAttributeData(attributes);
      }
      if (attributes && Array.isArray(attributes)) {
        for (let attribute of attributes) {
          const { attribute_id, attribute_name } = attribute;
          const attributeValues = await getAttributeValues(attribute_id);
          if (attributeValues && Array.isArray(attributeValues)) {
            mergedAttributs = [...mergedAttributs, ...attributeValues];
            setAttributesValues(mergedAttributs);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUserMeta = async () => {
    try {
      const data = await getUserMeta(getUserId as string);
      const result = await getUserMeta(
        getUserId as string,
        "banquest_payment_method_data"
      );
      const metaData: UserMeta = {};
      data.forEach((meta: any) => {
        metaData[meta.meta_key] = meta.meta_value;
      });
      setUserMeta(metaData);
      if (result && result[0]) {
        //setShowSpinner(false)
        setValues(JSON.parse(result[0].meta_value));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUserById = async () => {
    try {
      const data = await getUserById(userId as string);
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const allStates = State.getStatesOfCountry("US");
    setUsStates(allStates);
  }, []);

  useEffect(() => {
    fetchUserAttributes();
    fetchUserMeta();
    fetchUserById();
  }, [userId]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setSingleData({
      ...singleData,
      [e.target.name]: value,
    });
  };

  const handleAttributeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    attributeId: number
  ) => {
    const { value } = e.target;
    setSelectedValues((prev) => ({
      ...prev,
      [attributeId]: Number(value),
    }));
  };

  const handleAddNewAddressClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleSubmitSubscription = async () => {
    try {
      const selectedAttributes: SelectedAttribute[] = Object.entries(
        selectedValues
      ).map(([attributeID, attributeValueID]) => ({
        attributeID: parseInt(attributeID),
        attributeValueID: attributeValueID,
      }));
      const hvacFilterData: HvacFilterSubscriptionInterface = {
        productID: 25,
        userID: userId as string,
        selectedAttributes: selectedAttributes,
        address: {
          firstName: users && users.first_name,
          lastName: users && users.last_name,
          street: userMeta && userMeta.street,
          city: userMeta && userMeta.city,
          state: userMeta && userMeta.state,
          zipCode: userMeta && userMeta.zip_code,
          country: userMeta && userMeta.country,
        },
      };
      const data = await hvacFilterCheckout(hvacFilterData);
      if (data) {
        toast.success("You have subscribed successfully");
      } else {
        console.log("Subscription failed")
        toast.error("Product is out of stock")
      }
    } catch (error) {
      console.log(error);
    }
  };

  const isPremiumSelected = () => {
    const selected = Object.values(selectedValues);

    return selected.includes(127) || selected.includes(126);
  };

  const handleAddressBlurEvent = async () => {
    try {
      Promise.all([
        updateUserMeta(getUserId as string, "city", singleData.city),
        updateUserMeta(getUserId as string, "state", singleData.state),
        updateUserMeta(getUserId as string, "street", singleData.street),
        updateUserMeta(getUserId as string, "zip_code", singleData.zip),
      ]).finally(() => {
        console.log("Meta updated");
        fetchUserMeta();
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (!attributeData || !attributesValues || !users) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
      </div>
    );
  }

  return (
    <>
      <Col  xl="8">
        <Form onSubmit={(event) => event.preventDefault()}>
          <Card>
            <CardHeader>
            <h4 className={""}>{"HVAC Filter Subscription"}</h4>
              <span>
                {
                  "Choose your free quarterly filter or upgrade for premium options"
                }
              </span>
            </CardHeader>
            <CardBody>
             
              <>
                <Row style={{ marginTop: "1rem" }}>
                  <Col md="12">
                    <FormGroup>
                      {attributeData.map((el, i) => (
                        <React.Fragment key={i}>
                          <Label
                            style={i > 0 ? { marginTop: "10px" } : {}}
                            check
                          >
                            {el.attribute_name}
                          </Label>
                          <Input
                            type="select"
                            className="rounded-2 btn-square"
                            name={`selected_${el.attribute_id}`}
                            value={selectedValues[el.attribute_id] || ""}
                            onChange={(e: any) =>
                              handleAttributeChange(e, el.attribute_id)
                            }
                          >
                            <option value=""></option>
                            {attributesValues.map((option, i) => {
                              return (
                                <React.Fragment key={i}>
                                  {option.attribute_id === el.attribute_id && (
                                    <>
                                      <option
                                        value={option.attribute_value_id}
                                        key={i}
                                      >
                                        {option.attribute_value}
                                      </option>
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </Input>
                        </React.Fragment>
                      ))}
                    </FormGroup>
                  </Col>
                  {isPremiumSelected() ? (
                    <>
                      <Col md="12">
                        <Card
                          style={{
                            borderRadius: "0.375rem",
                            border: "1px solid #e0e0e0",
                            backgroundColor: "#FFFBEB",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                            marginBottom: "20px",
                          }}
                        >
                          <CardBody>
                            <div className="d-flex align-items-center space-x-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: "#FBBF24" }}
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                              </svg>

                              <p
                                style={{
                                  fontSize: "0.875rem",
                                  color: "#D97706",
                                  marginLeft: "5px",
                                }}
                              >
                                You've selected a premium option. Additional
                                charges will apply.
                              </p>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </>
                  ) : (
                    ""
                  )}
                  <Col md="12">
                    <Label>{"Shipping Address"}</Label>
                    <Card
                      style={{
                        padding: "1rem",
                        border: "1px solid #d3d3d3",
                        borderRadius: "8px",
                      }}
                    >
                      <Col md="12">
                        <div className="d-flex align-items-center space-x-2">
                          <Input
                            type="radio"
                            name="address"
                            checked={true}
                            id="existing-address"
                            aria-label="Existing Address"
                          />
                          <Label
                            style={{ margin: "10px" }}
                            for="existing-address"
                            className="text-sm font-medium"
                          >
                            {userMeta &&
                              `${`${userMeta && userMeta.street} ${
                                userMeta && userMeta.city
                              } , ${userMeta && userMeta.state} , ${
                                userMeta && userMeta.zip_code
                              }`}`}
                          </Label>
                        </div>
                      </Col>
                    </Card>
                  </Col>

                  <Col md="12">
                    <Button
                        
                      type="button"
                      color="primary"                onClick={handleAddNewAddressClick}
                         >
                     
                      Add New Address
                    </Button>
                  </Col>
                  {isOpen && (
                    <Col md="12">
                      <FormGroup style={{ marginTop: "1rem" }}>
                        <Input
                          type="text"
                          className="rounded"
                          name="street"
                          style={{
                            border: "1px solid rgba(106, 113, 133, 0.3)",
                            marginTop: "1rem",
                          }}
                          placeholder="Street Address"
                          value={singleData.street}
                          onChange={handleChange}
                          onBlur={handleAddressBlurEvent}
                        />
                        <Input
                          type="text"
                          className="rounded"
                          name="city"
                          style={{
                            border: "1px solid rgba(106, 113, 133, 0.3),",
                            marginTop: "1rem",
                          }}
                          placeholder="City"
                          value={singleData.city}
                          onChange={handleChange}
                          onBlur={handleAddressBlurEvent}
                        />
                        <Input
                          type="select"
                          className="rounded"
                          name="state"
                          style={{
                            border: "1px solid rgba(106, 113, 133, 0.3)",
                            marginTop: "1rem",
                          }}
                          placeholder="State"
                          value={singleData.state}
                          onChange={handleChange}
                          onBlur={handleAddressBlurEvent}
                        >
                          <option>{"Select a state"}</option>
                          {usStates.map((state: any) => (
                            <option key={state.isoCode} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                        </Input>
                        <Input
                          type="text"
                          className="rounded"
                          name="zip"
                          style={{
                            border: "1px solid rgba(106, 113, 133, 0.3)",
                            marginTop: "1rem",
                          }}
                          placeholder="ZIP Code"
                          value={singleData.zip}
                          onChange={handleChange}
                          onBlur={handleAddressBlurEvent}
                        />
                      </FormGroup>
                    </Col>
                  )}

                  <Col md="12" style={{ marginTop: "0.8rem" }}>
                    <Label>{"Payment method info"}</Label>
                    <Card
                      style={{
                        padding: "1rem",
                        border: "1px solid #d3d3d3",
                        borderRadius: "8px",
                      }}
                    >
                      <Col md="12">
                        <div className="d-flex align-items-center space-x-2">
                          <Input
                            type="radio"
                            name="payment"
                            value="existing"
                            checked
                            id="existing-payment"
                            aria-label="Existing Payment"
                          />
                          <Label
                            style={{ margin: "10px" }}
                            for="existing-payment"
                            className="text-sm font-medium"
                          >
                            <span>{`Card Type: ${
                              values && values.card_type
                            }`}</span>
                            <br />
                            <span>{`Expiry Date: ${
                              values &&
                              values.expiry_month &&
                              values.expiry_year
                                ? `${String(values.expiry_month).padStart(
                                    2,
                                    "0"
                                  )}/${String(values.expiry_year)}`
                                : "N/A"
                            }`}</span>
                            <br />
                            <span>{`Card: ........${
                              values && values.last4
                            }`}</span>
                          </Label>
                        </div>
                      </Col>
                    </Card>
                  </Col>
                  <Col md="12" className="d-flex justify-content-end">
                    <Button
                      style={{ zIndex: 100000 }}
                      type="button"
                      color="primary"
                      onClick={handleSubmitSubscription}
                    >
                      Subscribe
                    </Button>
                  </Col>
                </Row>
              </>
            </CardBody>
          </Card>
        </Form>
      </Col>
    </>
  );
};

export default HvacSubscriptionContainer;
