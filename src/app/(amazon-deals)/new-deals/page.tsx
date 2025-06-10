import DealsList from "@/Components/Applications/Deal/DealsList";
import { Container } from "reactstrap";

const AmazonDealsPage = () => {
  return <div className="user-deals-page py-4">
    <Container fluid className="product-wrapper">
      <DealsList
        title="Marketplace Offers"
        subTitle="We Know What's Best for You – Handpicked Just for You!"
        dealDetailPath="/new-deals"
      />
    </Container>
  </div>;
}

export default AmazonDealsPage;