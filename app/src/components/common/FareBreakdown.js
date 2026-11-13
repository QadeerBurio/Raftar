import React from 'react';
import { View, Text } from 'react-native';
export const pkr = paisa => `PKR ${(Number(paisa || 0) / 100).toFixed(2)}`;
export default function FareBreakdown({
  receipt,
  pricing,
  driver = false
}) {
  if (!receipt) return null;
  return <View style={{
    padding: 12,
    backgroundColor: '#FFF8DC',
    borderRadius: 10,
    marginVertical: 8
  }}>
    {pricing && <><Text style={{
        color: '#222'
      }}>{pricing.category} · {(pricing.distanceMeters / 1000).toFixed(1)} km · {Math.ceil(pricing.durationSeconds / 60)} min ETA</Text><Text style={{
        color: '#222'
      }}>Busy multiplier {(pricing.multiplierBps / 10000).toFixed(2)}× · {pricing.pricingMode}</Text></>}
    <Text style={{
      color: '#222'
    }}>Transport fare: {pkr(receipt.transportFarePaisa)}</Text>
    <Text style={{
      color: '#222'
    }}>Authorized pickup waiting: {pkr(receipt.waitingPaisa)}</Text>
    <Text style={{
      color: '#222'
    }}>{receipt.serviceFeeLabel || 'Raftar service fee — 3%'}: {pkr(receipt.serviceFeePaisa)}</Text>
    <Text style={{
      color: '#222'
    }}>Approved tolls / parking / airport: {pkr(receipt.passThroughPaisa)}</Text>
    <Text style={{
      color: '#222'
    }}>Driver tip: {pkr(receipt.tipPaisa)}</Text>
    <Text style={{
      color: '#222',
      fontWeight: 'bold'
    }}>Passenger total: {pkr(receipt.passengerTotalPaisa)}</Text>
    {driver && <><Text style={{
        color: '#222'
      }}>Expected driver earnings: {pkr(receipt.driverEntitlementPaisa)}</Text><Text style={{
        color: '#222'
      }}>Separate driver commission: {pkr(receipt.commissionPaisa)}</Text><Text style={{
        color: '#222'
      }}>For cash: collect the full passenger total; {pkr(receipt.platformRevenuePaisa)} is payable to Raftar. Tolls and tips belong to you.</Text></>}
    <Text style={{
      color: '#444',
      fontSize: 11
    }}>Raftar pilot prices. Estimated journey time is included; ordinary traffic adds no journey-minute charge.</Text>
  </View>;
}
