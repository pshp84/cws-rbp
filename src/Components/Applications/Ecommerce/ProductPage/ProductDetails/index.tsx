import { Card, CardBody, Col, Spinner } from "reactstrap";
import { useAppSelector } from "@/Redux/Hooks";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DealData } from "@/Types/Deals";
import Link from "next/link";
import { addDealReport, ReportType } from "@/DbClient";
import moment from "moment";

interface Deal {
  deal: DealData;
}

const ProductDetails: React.FC<Deal> = ({ deal }) => {
  const { id } = useParams();
  const userId = localStorage.getItem("userId");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [isPromoCodeVisible, setIsPromoCodeVisible] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isFuture, setIsFuture] = useState<boolean>(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deal.deal_action_value);
      setIsCopied(true);
      // setTimeout(() => setIsCopied(false), 50000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const openInNewTab = async (url: string, id: number) => {
    window.open(url, "_blank", "noopener,noreferrer");
    try {
      const viewRecord = await addDealReport({
        userID: userId as string,
        dealID: id,
        reportType: "click" as ReportType.Click,
      });
      if (viewRecord) {
        if (isCopied) {
          setIsClicked(false);
        }
      }
    } catch (error) {}
  };

  const redirectToDealWebsite = async (url: string, id: number) => {
    if (isCopied) {
      window.open(url, "_blank", "noopener,noreferrer");
      try {
        const viewRecord = await addDealReport({
          userID: userId as string,
          dealID: id,
          reportType: "click" as ReportType.Click,
        });
        if (viewRecord) {
          if (isCopied) {
            setIsClicked(false);
          }
        }
      } catch (error) {}
    }
  };

  const clickOnDeal = async (id: number) => {
    if (isPromoCodeVisible) return;
    setIsClicked(true);
    try {
      const viewRecord = await addDealReport({
        userID: userId as string,
        dealID: id,
        reportType: "click" as ReportType.Click,
      });
      if (viewRecord) {
        setIsPromoCodeVisible(true);
      }
    } catch (error) {
    } finally {
      setIsClicked(false);
    }
  };

  useEffect(() => {
    const currentDate = new Date();
    const dealEndDate = deal.end_date ? new Date(deal.end_date) : null;
    const dealStartDate = deal.start_date ? new Date(deal.start_date) : null;
    const setFutureTrue =
      dealStartDate && currentDate < dealStartDate
        ? setIsFuture(true)
        : setIsFuture(false);

    if (!dealEndDate) {
      return;
    }

    if (currentDate > dealEndDate) {
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }
  }, [deal.end_date, deal.start_date]);

  if (!deal) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner style={{ width: "3rem", height: "3rem" }} color="primary" />
      </div>
    );
  }

  return (
    <Col lg="8" sm="8" md={`8`} className="box-col-6 order-xxl-0 order-1">
      <Card className="contentHeight">
        <CardBody>
          {deal && deal ? (
            <>
              <div className="product-page-details">
                <h3 className="f-w-600">{deal.name}</h3>
              </div>
              <div className="product-price">
                {deal.sale_price ? "$" : ""}
                {deal.sale_price ? deal.sale_price : ""}
                <del>
                  {deal.regular_price ? "$" : ""}
                  {deal.regular_price ? deal.regular_price.toFixed(2) : ""}
                </del>
              </div>
              <div></div>
              <p className="">
                {deal.small_description ?
                  deal.small_description : ''}
              </p>
              {isFuture && (
                <div className="minusMargin">
                  <div>{`Starting from: ${
                    deal.start_date
                      ? moment(deal.start_date).format("MM/DD/YYYY")
                      : ""
                  }`}</div>
                </div>
              )}
              {!isFuture && (
                <div className="minusMargin">
                  <div>{`Start Date: ${
                    deal.start_date
                      ? moment(deal.start_date).format("MM/DD/YYYY")
                      : ""
                  }`}</div>
                  <div className="">{`${
                    deal.end_date !== null ? "End Date:" : ""
                  } ${
                    deal.end_date
                      ? moment(deal.end_date).format("MM/DD/YYYY")
                      : ""
                  }`}</div>
                </div>
              )}
            </>
          ) : (
            ""
          )}

          {/* {deal.deal_action_value.trim() !== "" && (
            <div>
              <table className="product-page-width">
                <tbody>
                  <tr>
                    <td>
                      <b>{"Promo Code"} &nbsp;&nbsp;&nbsp;:</b>
                    </td>
                    <td>{deal.deal_action_value}</td>
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
          )} */}
          {isExpired ? (
            <div className="expiredDeal m-t-15 btn-showcase">
              <Link
                className={`${"btn btn-secondary"}`}
                href={"#"}
                onClick={(e) => e.preventDefault()}
                title=""
              >
                {"Deal Expired"}
              </Link>
              <Link
                style={{ float: "right", marginTop: "1rem" }}
                className="mt-2"
                href={`/user/deals`}
                title=""
              >
                {"Back to deals"}
              </Link>
            </div>
          ) : (
            <div className={`button-container m-t-15 btn-showcase dealsButton`}>
              <Link
                href={""}
                className="btn btn-success"
                onClick={() =>
                  openInNewTab(deal.deal_website_url, deal.deal_id)
                }
                title=""
              >
                {"Get Deal"}
              </Link>

              <Link className="mt-2" href={`/user/deals`} title="">
                {"Back to deals"}
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  );
};
export default ProductDetails;
