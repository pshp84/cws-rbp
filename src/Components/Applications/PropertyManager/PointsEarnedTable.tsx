"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { referralsDBInterface } from "@/DbClient";
import { formatDate } from "@/Helper/commonHelpers";
import { RewardTransaction } from "@/Types/Rewards";
import { Card } from "reactstrap";

interface PointsEarnedTableProps {
    className?: string;
    isLoading: boolean;
    transactionData: Array<RewardTransaction>;
    details?: "minimum" | "maximum";
    displayOrder?: "asc" | "desc";
    changeDisplayOrder?: (displayOrder: "asc" | "desc") => void;
}

const PointsEarnedTable: React.FC<PointsEarnedTableProps> = (props) => {
    const { className, isLoading, transactionData, details = "maximum", displayOrder, changeDisplayOrder } = props;
    return <Card className={`overflow-hidden ${className || ""}`}>
        <div className="table-responsive">
            <table className="table">
                <thead className="ff-sora table-color">
                    <tr>
                        <th style={{ width: "125px" }}>Date &nbsp;
                            {displayOrder && changeDisplayOrder &&
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        changeDisplayOrder(displayOrder == "asc" ? "desc" : "asc");
                                    }}
                                >
                                    <i className={`fa fa-sort-${displayOrder}`}></i>
                                </a>
                            }
                        </th>
                        <th>Member Name</th>
                        {details === "maximum" &&
                            <>
                                <th>Membership Plan</th>
                                <th>Signup Date</th>
                                <th>Description</th>
                            </>
                        }
                        <th className="text-end" style={{ width: "100px" }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading &&
                        <tr>
                            <td colSpan={details === "maximum" ? 6 : 3}><LoadingIcon /></td>
                        </tr>
                    }
                    {(!isLoading && transactionData.length <= 0) &&
                        <tr>
                            <td colSpan={details === "maximum" ? 6 : 3} className="text-center">Points are not available!</td>
                        </tr>
                    }
                    {(!isLoading && transactionData.length > 0) &&
                        transactionData.map((data, dataIndex) => {
                            let memberName: string = "-";
                            let membershipPlan: string = "-";
                            let signupDate: string | Date = "-";
                            const { reference_data: referralDataStr } = data;
                            if (referralDataStr) {
                                const referralData: referralsDBInterface = JSON.parse(referralDataStr.toString());
                                const { users, membership_plans: planData, created_at: memberSignupDate } = referralData;
                                memberName = (users?.first_name && users.last_name) ? `${users?.first_name} ${users.last_name}` : memberName;
                                membershipPlan = (planData?.plan_name) ? planData?.plan_name : membershipPlan;
                                signupDate = (memberSignupDate) ? formatDate(memberSignupDate) : signupDate;
                            }

                            return <tr key={`earn-points-tr-${dataIndex}`}>
                                <td>{formatDate(data.created_at)}</td>
                                <td>{memberName}</td>
                                {details === "maximum" &&
                                    <>
                                        <td>{membershipPlan}</td>
                                        <td>{signupDate}</td>
                                        <td>{data.description}</td>
                                    </>
                                }
                                <td className="text-end">{data.points}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    </Card>
};

export default PointsEarnedTable;