"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { formatDate } from "@/Helper/commonHelpers";
import { RewardTransaction } from "@/Types/Rewards";
import { Card } from "reactstrap";

interface PointsRedeemTableProps {
    className?: string;
    isLoading: boolean;
    transactionData: Array<RewardTransaction>;
    displayOrder?: "asc" | "desc";
    changeDisplayOrder?: (displayOrder: "asc" | "desc") => void;
}

const PointsRedeemTable: React.FC<PointsRedeemTableProps> = (props) => {
    const { className, isLoading, transactionData, displayOrder, changeDisplayOrder } = props;
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
                        <th>Description</th>
                        <th className="text-end" style={{ width: "100px" }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading &&
                        <tr>
                            <td colSpan={3}><LoadingIcon /></td>
                        </tr>
                    }
                    {(!isLoading && transactionData.length <= 0) &&
                        <tr>
                            <td colSpan={3} className="text-center">Points are not available!</td>
                        </tr>
                    }
                    {(!isLoading && transactionData.length > 0) &&
                        transactionData.map((data, dataIndex) => {

                            return <tr key={`reedemde-points-tr-${dataIndex}`}>
                                <td>{formatDate(data.created_at)}</td>
                                <td>{data.description}</td>
                                <td className="text-end">-{data.points}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    </Card>
};

export default PointsRedeemTable;