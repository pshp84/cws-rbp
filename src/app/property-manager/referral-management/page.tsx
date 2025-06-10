"use client";

import ReferralActivity from "@/Components/Applications/PropertyManager/ReferralActivity";
import ReferralDetailsBar from "@/Components/Applications/PropertyManager/ReferralDetailsBar";
import { getMembershipPlans, membershipPlansDbFieldsInterface } from "@/DbClient";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PropertyManagerReferralManagement = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isPlansLoading, setIsPlansLoading] = useState<boolean>(true);
    const [statusFilter, setStatusFilter] = useState<boolean | undefined>();
    const [planFilter, setPlanFilter] = useState<number | undefined>();
    const [plans, setPlans] = useState<Array<membershipPlansDbFieldsInterface>>([]);

    const fetchPlans = async () => {
        setIsPlansLoading(true);
        const data = await getMembershipPlans();
        setIsPlansLoading(false);
        if (typeof data === "boolean") {
            setPlans([]);
            toast.error("Something is wrong! unable to find plans. Please contact our support team.");
            return;
        }
        setPlans(data);
    }

    useEffect(() => {
        fetchPlans();
    }, []);

    return <div className="property-manager-referral-management-page user-deals-page">
        <ReferralDetailsBar className="mb-5" title="Referral Management" subTitle="Your referrals are helping more members join. Let's keep the momentum going!" />

        <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
            <h5 className="mb-0 text-dark f-w-500 ff-sora  fs-5">Referral Activity</h5>
            <div className="d-flex gap-2 align-items-center">
                <div>
                    <select
                        className="form-select form-select-sm"
                        disabled={isLoading}
                        onChange={e => {
                            const value = e.target.value;
                            if (!value || value === "") {
                                setPlanFilter(undefined);
                                return;
                            }
                            setPlanFilter(parseInt(value));
                        }}
                    >
                        <option value={``}>{`${isPlansLoading ? `Loading Plans` : `Membership Plan`}`}</option>
                        {(!isPlansLoading && plans.length > 0) &&
                            plans.map((plan, planIndex) => {
                                return <option
                                    value={plan.plan_id as number}
                                    key={`plan-select-${planIndex}-${plan.plan_id}`}
                                >
                                    {plan.plan_name} Plan
                                </option>
                            })
                        }
                    </select>
                </div>
                <div>
                    <select
                        className="form-select form-select-sm"
                        disabled={isLoading}
                        onChange={e => {
                            switch (e.target.value) {
                                case "active":
                                    setStatusFilter(true);
                                    break;
                                case "inactive":
                                    setStatusFilter(false);
                                    break;
                                default:
                                    setStatusFilter(undefined);
                                    break;
                            }
                        }}
                    >
                        <option value="">Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
        </div>

        <ReferralActivity planFilter={planFilter} statusFilter={statusFilter} loadingState={data => setIsLoading(data)} />

    </div>
}

export default PropertyManagerReferralManagement;