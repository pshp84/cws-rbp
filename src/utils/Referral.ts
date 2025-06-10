export const ReferralCodeURLParam = 'referral_code';

export const removeReferralCodeParamsFromLS = () => {
    localStorage.removeItem(ReferralCodeURLParam);
}

export const captureReferralCodeParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const ReferralCodeParamsParams = [ReferralCodeURLParam];
    const capturedParams: any = {};

    ReferralCodeParamsParams.forEach(param => {
        if (urlParams.get(param)) {
            capturedParams[param] = urlParams.get(param);
        }
    });

    if (Object.keys(capturedParams).length > 0) {
        removeReferralCodeParamsFromLS();
        localStorage.setItem(ReferralCodeURLParam, JSON.stringify(capturedParams));
    }
}

export const getReferralCode = (): boolean | string => {
    const codeDataLS = localStorage.getItem(ReferralCodeURLParam);
    if (!codeDataLS || codeDataLS === null) return false;
    const codeData = JSON.parse(codeDataLS);
    return codeData?.referral_code || false;
}