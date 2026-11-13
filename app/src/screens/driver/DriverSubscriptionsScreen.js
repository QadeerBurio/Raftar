import React from 'react';
import DriverSubscriptionRequestsScreen from './DriverSubscriptionRequestsScreen';

const DriverSubscriptionsScreen = (props) => {
  return (
    <DriverSubscriptionRequestsScreen
      {...props}
      route={{
        ...props.route,
        params: {
          ...props.route?.params,
          initialTab: 'ACCEPTED'
        }
      }}
    />
  );
};

export default DriverSubscriptionsScreen;
