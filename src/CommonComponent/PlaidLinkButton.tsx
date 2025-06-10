import { createPlaidLinkToken } from "@/Helper/plaidHelper";
import { rbpApiCall } from "@/Helper/rbpApiCallConfig";
import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

interface PlaidLinkButtonComponentProps {
  buttonText: string;
  showIcon?: boolean;
  userID: string;
  cssClasses?: string;
  onSuccess: (accessToken: string) => void;
  onError?: (error: any, metadata: any) => void;
  isLoading?: (loadingStatus: boolean) => void;
  style?: React.CSSProperties;
}

const PlaidLinkButton: React.FC<PlaidLinkButtonComponentProps> = ({
  userID,
  cssClasses,
  buttonText,
  showIcon = true,
  onSuccess,
  onError,
  isLoading,
}) => {
  const [plaidLinkToken, setPlaidLinkToken] = useState();
  const [isOpen, setIsOpen] = useState();

  const plaidLinkOnSuccess = async (public_token: any, metadata: any) => {
    try {
      if (isLoading) isLoading(true);
      const response = await rbpApiCall.post("/plaid/exchange-token", {
        public_token,
      });
      const accessToken = response.data.access_token;
      onSuccess(accessToken);
      if (isLoading) isLoading(false);
    } catch (error) {
      console.error("Error exchanging public token:", error);
      if (onError) onError(error, {});
      if (isLoading) isLoading(false);
    }
  };

  const onErrorHandler = (error: any, metadata: any) => {
    if (isLoading) isLoading(false);    
    if (onError) onError(error, metadata);
  }

  const { open, exit, ready } = usePlaidLink({
    token: plaidLinkToken!,
    onSuccess: plaidLinkOnSuccess,
    onExit: onErrorHandler,
  });

  const generatePlaidLinkToken = async () => {
    if (isLoading) isLoading(true);
    const data = await createPlaidLinkToken(userID);
    if (data) {
      if (isLoading) isLoading(false);
      setPlaidLinkToken(data);
    }
  };

  useEffect(() => {
    generatePlaidLinkToken();
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (isLoading) isLoading(true);
        open();
      }
      }
      className={`${cssClasses} ${(showIcon) ? 'd-flex align-items-center gap-1' : ''}`}
      disabled={!ready}
    >
      {showIcon && <img src={`assets/images/plaid/plaid-logo-light.svg`} alt="Plaid Logo" />}
      {buttonText}</button>
  );
};

export default PlaidLinkButton;
