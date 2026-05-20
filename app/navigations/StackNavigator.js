import { CardStyleInterpolators, createStackNavigator } from '@react-navigation/stack';
import React from "react";
import Maps from '../screens/Maps';
// import OnBoarding from "../../apps/education_app/pages/OnBoarding";
// import Splash from '../pages/Onboarding/Splash';
// import SignIn from "../../apps/education_app/pages/Auth/SignIn";
// import Home from '../../apps/education_app/pages/Home';
// import DrawerNavigation from "../../apps/education_app/pages/DrawerNavigation";
// import AbsenAdmin from "../../apps/education_app/pages/AbsenAdmin";
// import Checkin from "../../apps/education_app/pages/Checkin";
// import Checkout from "../../apps/education_app/pages/Checkout";
// import CreateSalesPOScreen from "../../apps/education_app/pages/components/CreateSalesPOScreen";
// import ProductSelection from "../../apps/education_app/pages/components/ProductSelection";
// import SalesSelectionModal from "../../apps/education_app/pages/components/SalesSelectionModal";
// import EditRak from "../../apps/education_app/pages/EditRak";
// import BillsActive from "../../apps/education_app/pages/ListBills/BillsActive";
// import ListActiveBills from "../../apps/education_app/pages/ListBills/ListActiveBills";
// import PaymentForm from "../../apps/education_app/pages/ListBills/PaymentForm";
// import MappingToko from "../../apps/education_app/pages/MappingToko";
// import SalesOrderForm from "../../apps/education_app/pages/SalesOrderForm";
// import ScanRack from "../../apps/education_app/pages/ScanRack";

const StackComponent = createStackNavigator();

const Pages = (props) => {

  return (
    <>
      
      <StackComponent.Navigator
        // initialRouteName={"Splash"}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: "transparent" },
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <StackComponent.Screen name={"Maps"} component={Maps} />
        {/* <StackComponent.Screen name={"Splash"} component={Splash} /> */}
        {/* <StackComponent.Screen name={"OnBoarding"} component={OnBoarding} /> */}
        {/* <StackComponent.Screen name={"SignIn"} component={SignIn} /> */}
        {/* <StackComponent.Screen name={"Home"} component={Home} /> */}
        {/* <StackComponent.Screen name={"DrawerNavigation"} component={DrawerNavigation} /> */}
        {/*<StackComponent.Screen name={"ScanRack"} component={ScanRack} />
        <StackComponent.Screen name={"EditRak"} component={EditRak} />
        <StackComponent.Screen name={"MappingToko"} component={MappingToko} />
        <StackComponent.Screen name={"SalesOrderForm"} component={SalesOrderForm} />
        <StackComponent.Screen name={"CreateSalesPOScreen"} component={CreateSalesPOScreen} />
        <StackComponent.Screen name={"ListActiveBills"} component={ListActiveBills} />
        <StackComponent.Screen name={"BillsActive"} component={BillsActive} />
        <StackComponent.Screen name={"PaymentForm"} component={PaymentForm} />
        <StackComponent.Screen name={"SalesSelectionModal"} component={SalesSelectionModal} />
        <StackComponent.Screen name={"Checkout"} component={Checkout} />
        <StackComponent.Screen name={"Checkin"} component={Checkin} />
        <StackComponent.Screen name={"ProductSelection"} component={ProductSelection} />
        <StackComponent.Screen name={"AbsenAdmin"} component={AbsenAdmin} /> */}
      </StackComponent.Navigator>
    </>
  );
};
export default Pages;
