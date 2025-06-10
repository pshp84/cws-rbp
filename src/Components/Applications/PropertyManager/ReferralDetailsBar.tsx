"use client";

import LoadingIcon from "@/CommonComponent/LoadingIcon";
import { addAffiliate, getAffiliateByUserID, getUserById, referralMethod } from "@/DbClient";
import { generateReferralCode, generateReferralLink } from "@/Helper/referrals";
import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";

interface ReferralDetailsBarProps {
    className?: string;
    title?: string;
    subTitle?: string;
}

const ReferralDetailsBar: React.FC<ReferralDetailsBarProps> = ({ className = "", title = "Your Referral Details", subTitle }) => {
    const userID = localStorage.getItem("userId");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [referralCode, setReferralCode] = useState<string | undefined>(() => localStorage.getItem("referralCode") || undefined);

    const getReferralLink = useCallback(() => {
        if (!referralCode) return "";
        return generateReferralLink(referralCode);
    }, [referralCode]);

    const copyReferral = (text: string, type: referralMethod) => {
        navigator.clipboard.writeText(text)
            .then(() => toast.success(`${type} copied to clipboard.`))
            .catch(() => toast.error(`Failed to copy ${type}.`));
    };

    const fetchReferralCode = useCallback(async () => {
        if (!userID || referralCode) return;

        setIsLoading(true);
        try {
            let storedCode = localStorage.getItem("referralCode");
            if (storedCode) {
                setReferralCode(storedCode);
                return;
            }

            const affiliateData = await getAffiliateByUserID(userID);
            if (typeof affiliateData === "boolean") {
                const [userData] = await Promise.all([
                    getUserById(userID, ["first_name", "last_name"])
                ]);

                if (typeof userData === "boolean") return;

                const newReferralCode = await generateReferralCode(userData.first_name, userData.last_name);
                if (!newReferralCode) return;

                setReferralCode(newReferralCode);
                localStorage.setItem("referralCode", newReferralCode);

                await addAffiliate({ referralCode: newReferralCode, userID });
            } else if (affiliateData.referral_code) {
                setReferralCode(affiliateData.referral_code);
                localStorage.setItem("referralCode", affiliateData.referral_code);
            }
        } finally {
            setIsLoading(false);
        }
    }, [userID, referralCode]);

    useEffect(() => {
        fetchReferralCode();
    }, [fetchReferralCode]);

    return (
        <div className={`d-flex justify-content-between align-items-center gap-2 ${className}`}>
            {isLoading && <LoadingIcon />}

            {!isLoading && !referralCode && (
                <div className="alert alert-danger m-0 w-100">
                    Unable to generate your referral code! Please contact support.
                </div>
            )}

            {!isLoading && referralCode && (
                <>
                    <div>
                        <h3 className="mb-0 text-dark f-w-500 ff-sora fs-5">{title}</h3>
                        {subTitle && <p className="mb-0">{subTitle}</p>}
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-1">
                            <label className="m-0 ff-sora-semibold">Link:</label>
                            <div className="input-group input-group-sm">
                                <input type="url" className="form-control" value={getReferralLink()} readOnly disabled />
                                <button
                                    className="btn btn-dark btn-sm ff-sora-regular"
                                    type="button"
                                    style={{ fontSize: "12px" }}
                                    onClick={() => copyReferral(getReferralLink(), referralMethod.Link)}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-1">
                            <label className="m-0 ff-sora-semibold">Code:</label>
                            <div className="input-group input-group-sm">
                                <input type="text" className="form-control" value={referralCode} readOnly disabled />
                                <button
                                    className="btn btn-dark btn-sm ff-sora-regular"
                                    type="button"
                                    style={{ fontSize: "12px" }}
                                    onClick={() => copyReferral(referralCode, referralMethod.Code)}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReferralDetailsBar;