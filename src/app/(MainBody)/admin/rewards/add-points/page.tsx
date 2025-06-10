"use client";

import {
  addRewadPointTransaction,
  getRewadPointUsers,
  getUsers,
  RewardPointsTransactionType,
} from "@/DbClient";
import { UsersList } from "@/Types/Users";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody, CardFooter, CardHeader } from "reactstrap";

const AddRewardPoints = () => {
  const router = useRouter();
  const [users, setUsers] = useState<UsersList[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [point, setPoint] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selected, setSelected] = useState<string>("");

  const fetchUsers = async () => {
    try {
      const result = await getUsers({ limit: -1 });
      if (result && result.data) {
        setUsers(result.data);
      } else {
        setUsers([]);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!point || !selected || !description) {
      return;
    } else {
      const result = await addRewadPointTransaction({
        userID: selected,
        transactionType: "earn" as RewardPointsTransactionType,
        description: description,
        points: Number(point),
      });
      if (result) {
        setSubmitted(false);
        toast.success("Points added successfully.");
        setSelected("");
        setPoint("");
        setDescription("");
        router.push("/admin/rewards")
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <>
      <div className="row mb-5">
        <div className="col-md-8 col-lg-9">
          <Card className="mb-4">
            <CardHeader>Add Points</CardHeader>
            <CardBody>
              <div className="flex-fill mb-3 mt-2">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  // style={{
                  //   border: "1px dashed rgba(106, 113, 133, 0.3)",
                  //   borderRadius: "0.375rem",
                  //   padding: "0.375rem 0.75rem",
                  //   height: "38px",
                  //   width: "100%",
                  //   display: "block",
                  // }}
                  className="form-select rounded ff-sora"
                >
                  <option value={""}>Select User</option>
                  {users.map((user, i) => (
                    <option
                      value={user.user_id}
                      key={i}
                    >{`${user.first_name} ${user.last_name} (${user.user_email})`}</option>
                  ))}
                </select>
                 </div>
              {submitted && !selected && (
                <div style={{ marginTop: "-10px" }} className="text-danger">
                  {"User is required."}
                </div>
              )}
              <div className="flex-fill mb-3 mt-2">
                <label htmlFor="pointsInput">Points*:</label>
                <input
                  type="number"
                  id="pointsInput"
                  className="form-control"
                  required
                  value={point}
                  min={0}
                  onChange={(e) => setPoint(e.target.value)}
                />
              </div>
              {submitted && !point && (
                <div style={{ marginTop: "-10px" }} className="text-danger">
                  {"Point is required."}
                </div>
              )}
              <div className="flex-fill mb-3 mt-2">
                <label htmlFor="typeInput">Type:</label>
                <input
                  type="text"
                  id="typeInput"
                  className="form-control"
                  defaultValue={"Earn"}
                  readOnly
                />
              </div>
              <div className="mb-3 mt-2">
                <label htmlFor="description">Description*:</label>
                <textarea
                  id="description"
                  className="form-control"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              {submitted && !description && (
                <div style={{ marginTop: "-10px" }} className="text-danger">
                  {"Description is required."}
                </div>
              )}
            </CardBody>

            <CardFooter className="d-flex gap-2 align-items-center">
              <div className="ms-auto">
                <button onClick={handleSubmit} className="btn btn-primary me-2">
                  Save
                </button>

              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AddRewardPoints;
