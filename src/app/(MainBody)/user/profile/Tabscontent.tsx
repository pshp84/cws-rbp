import { TabContent, TabPane } from "reactstrap";
import { TabContentPropsType } from "@/Types/TabType";
import UserMembership from "./membership"
import ChangePassword from "./ChangePassword";
import UserDetails from './UserDetails';
import UpdatePaymentMethod from "./UpdatePaymentMethod";

const UserProfileFormTabContent :React.FC<TabContentPropsType> = ({ activeTab, callbackActive }) => {
    return (
      <TabContent className="dark-field shipping-content" activeTab={activeTab}>
        <TabPane tabId={1}>
          <UserDetails callbackActive={callbackActive} />
        </TabPane>
        <TabPane tabId={2}>
          <ChangePassword callbackActive={callbackActive} />
        </TabPane>
        <TabPane tabId={3}>
            <UserMembership callbackActive={callbackActive} />
        </TabPane>
        <TabPane tabId={4}>
            <UpdatePaymentMethod callbackActive={callbackActive} />
        </TabPane>
      </TabContent>
    );
};
  
export default UserProfileFormTabContent;