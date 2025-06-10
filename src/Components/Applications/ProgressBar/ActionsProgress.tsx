import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { FaCircleExclamation } from "react-icons/fa6";

interface ActionsProgressProps {
  progressWidth: number;
  percentWidth: number;
}
const ActionsProgress: React.FC<ActionsProgressProps> = ({ progressWidth, percentWidth }) => {
  const router = useRouter();

  return (
    <div className="progress-main">
      <div className="mb-3">
        <div className="d-flex gap-2 align-items-center">
          <div><FaCircleExclamation size={40} fill="#F1C21B" /></div>
          <div className="w-100">
            <div className="d-flex gap-2 justify-content-start align-items-center">
              <div className="ff-sora-bold text-dark">{percentWidth}%</div>
              <div className="w-100">
                <p style={{ color: "#6F6F6F", fontSize: "10px" }} className="ff-sora-medium text-secondary m-0"
                >Few pending actions remaining</p>
              </div>
              <div className="w-100 text-end">
                <Link href={`/dashboard`} className="btn btn-outline-primary btn-sm">Complete Now</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="progress my-3 progress-align">
        <div
          className="progress-bar bg-warning progress-bg"
          role="progressbar"
          style={{ width: `${progressWidth}%`, height: "8px" }}
          aria-valuenow={80}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

export default ActionsProgress;
