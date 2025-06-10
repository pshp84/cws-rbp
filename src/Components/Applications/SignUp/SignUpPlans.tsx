"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { getMembershipPlans } from "@/DbClient";
import { priceFormat } from "@/Helper/commonHelpers";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Card, CardBody, CardHeader } from "reactstrap";

// In-memory cache
const plansCache: { data: Array<any> | null } = { data: null };

interface SignUpPlans {
  onSelectedPlan: (planID: number) => void;
  planId?: number;
}

const SignUpPlans: React.FC<SignUpPlans> = (props) => {
  const { onSelectedPlan , planId } = props;
  const [isLoading, setIsLoading] = useState<boolean>(!plansCache.data);
  const [plansData, setPlansData] = useState<Array<any>>(plansCache.data || []);
  console.log("plansData",plansData)
  const [disabled,setDisabled] = useState<boolean>(false);

  const fetchPlansData = async () => {
    // Avoid fetching if data is already in cache
    if (plansCache.data) {
      setPlansData(plansCache.data);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getMembershipPlans(false);
      if (!data) throw new Error("No data available");

      plansCache.data = data; // Update cache
      setPlansData(data);
    } catch (error) {
      toast.error("Something is wrong! Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansData();
  }, []);

  return (
    <div className="row plan-selection">
      {isLoading && <LoadingIcon text="Loading plans." />}

      {!isLoading &&
        plansData.length > 0 &&
        plansData.map((planData, planIndex) => {
          const isDisabled = planData.plan_id === planId 
          return (
            <div key={`plan-list-data-${planIndex}`} className="col-md-6 mt-2">
            <Card className="h-100 w-100 shadow-none border rounded-3 overflow-hidden mb-4" style={isDisabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
              <CardHeader className="text-center bg-green py-2 rounded-0 border-bottom-0 f-w-500">
                {planData.plan_description}
              </CardHeader>
              <CardBody className="p-5">
                {planData.plan_name === "Yearly" ? (
                  //      <div className="mb-3">
                  //      <h4 className="ff-sora-semibold">{planData.plan_name}</h4> Plan - <span className="text-black">
                  //        {`${priceFormat(planData.plan_amount)}/${planData.plan_frequency.slice(0, -2)} (Save 15%)`}
                  //      </span>
                  //    </div>
                  <h4 className="ff-sora-semibold mb-3">{`${
                    planData.plan_name
                  } Plan - $${
                    planData.plan_amount
                  }/year (Save 15%)`}</h4>
                ) : (
                  <h4 className="ff-sora-semibold mb-3">{`${
                    planData.plan_name
                  } Plan - Only $${
                    planData.plan_amount
                  }/${planData.plan_frequency.slice(0, -2)}`}</h4>
                )}
                {/* <h4 className="ff-sora-semibold mb-3">{`${
                   planData.plan_name
                 } Plan - Only ${priceFormat(
                   planData.plan_amount
                 )}/${planData.plan_frequency.slice(0, -2)}`}</h4> */}
                {/* <div className="price-box d-flex gap-0 align-items-center">
                                    <h2 className="h1 ff-sora-semibold">{priceFormat(planData.plan_amount)}</h2>
                                    <span className="ff-sora-regular">/{planData.plan_frequency}</span>
                                </div>
                                <p className="text-small mb-1 text-secondary">billed once {planData.plan_frequency}</p>
                                <span className="border-bottom d-block mb-4"></span> */}

                {/* <h5 className="mb-3 ff-sora-semibold">Standout Features</h5> */}
                {/* <ul className="list mb-4 text-secondary ff-sora-medium">
                                    <li className="mb-2">• Huge discounts on deals</li>
                                    <li className="mb-2">• Value-packed rewards program</li>
                                    <li className="mb-2">• Free HVAC filter delivery</li>
                                    <li>• Free utility set-up</li>
                                </ul> */}

                {planData.plan_name === "Yearly" ? (
                  //                   <li className="mb-2 text-secondary ff-sora-medium">
                  //                    Get the same amazing benefits<br />
                  //   as the Monthly Plan but save more<br />
                  //   with a discounted price!
                  //                   </li>
                  <>
                   <ul className="my-list">
                    <li className="mb-2 text-secondary ff-sora-medium">
                      Get the same amazing benefits as the Monthly Plan but save more with a discounted price!                     
                    </li>
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="mb-4 text-secondary ff-sora-medium">
                    <ul className="my-list">
                      <li className="mb-2">
                        Huge discounts on deals and services.
                        
                      </li>
                      <li className="mb-2">Value-packed rewards program.
                      </li>
                      <li className="mb-2">Free Credit Building.</li>
                      <li>Free utility setup assistance.</li>
                      </ul>
                    </div>
                  </>
                )}

                <button
                  className="btn btn-outline-primary"
                  onClick={() => onSelectedPlan(planData.plan_id)}
                >
                  Get Started
                </button>
              </CardBody>
            </Card>
          </div>
          )
        })}
    </div>
  );
};

export default SignUpPlans;
