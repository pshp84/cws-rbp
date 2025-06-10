import { useState } from "react";

export const ProductTable = () => {
  const [isCopied, setIsCopied] = useState(false);

  const promoCode = "xyz";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };
  return (
    <>
      <div>
        <table className="product-page-width">
          <tbody>
            <tr>
              <td>
                <b>{"Promo Code"} &nbsp;&nbsp;&nbsp;:</b>
              </td>
              <td>{promoCode}</td>
              <i
                onClick={copyToClipboard}
                className={
                  isCopied
                    ? "fa fa-check-circle me-1"
                    : "fa fa-regular fa-copy me-1"
                }
                style={{
                  marginLeft: "10px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              ></i>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};
