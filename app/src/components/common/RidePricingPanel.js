import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, ScrollView, Text, TextInput, View } from 'react-native';
import api from '../../services/api';
import FareBreakdown, { pkr } from './FareBreakdown';
import CustomPlacesAutocomplete from './CustomPlacesAutocomplete';
export default function RidePricingPanel({
  rideId,
  driver = false,
  embedded = false,
  onChanged
}) {
  const [data, setData] = useState(null),
    [offers, setOffers] = useState([]),
    [open, setOpen] = useState(embedded),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [amount, setAmount] = useState(''),
    [reason, setReason] = useState(''),
    [evidence, setEvidence] = useState(''),
    [chargeType, setChargeType] = useState('toll'),
    [destination, setDestination] = useState(null),
    [extraStop, setExtraStop] = useState(null),
    [kind, setKind] = useState(driver ? 'passThrough' : 'tip');
  const [replacing, setReplacing] = useState(null);
  const lock = useRef(false);
  const refresh = async () => {
    const r = await api.get(`/rides/${rideId}/receipt`);
    setData(r.data);
    if (!driver && r.data.status === 'searching') {
      const o = await api.get(`/rides/${rideId}/offers`);
      setOffers(o.data.offers);
    }
  };
  useEffect(() => {
    let active = true;
    const load = () => {
      if (active) refresh().catch(e => {
        if (active) setError(e.response?.data?.error || e.message);
      });
    };
    load();
    const timer = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [rideId, driver]); // Server snapshots are the source of displayed totals.
  const action = async fn => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await fn();
      await refresh();
      onChanged?.(result?.data?.ride);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const text = {
    color: '#222',
    paddingVertical: 3
  };
  const input = {
    color: '#222',
    borderWidth: 1,
    borderColor: '#AAA',
    padding: 8,
    marginVertical: 4
  };
  const proposal = () => action(async () => {
    if (kind === 'route') {
      if (!destination && !extraStop) throw new Error('Choose the revised destination or additional stop');
      return api.post(`/rides/${rideId}/adjustments`, {
        kind,
        dropoff: destination || data.dropoff,
        stops: extraStop ? [...(data.stops || []), extraStop] : data.stops || []
      });
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new Error('Enter PKR amount with at most two decimals');
    return api.post(`/rides/${rideId}/adjustments`, {
      kind,
      ...(replacing ? {
        replacesAdjustmentId: replacing
      } : {}),
      amountPaisa: Math.round(Number(amount) * 100),
      reason,
      evidence,
      chargeType
    });
  });
  const place = (d, x) => ({
    address: d.description,
    location: {
      type: 'Point',
      coordinates: [x.geometry.location.lng, x.geometry.location.lat]
    }
  });
  return <View pointerEvents="box-none" style={embedded ? {} : {
    position: 'absolute',
    top: 68,
    left: 12,
    right: 12,
    zIndex: 30
  }}><View style={{
      backgroundColor: '#FFF8DC',
      borderRadius: 10,
      padding: 8
    }}><Button title={open ? 'Hide fare & receipt' : 'Fare, offers & receipt'} onPress={() => setOpen(!open)} />{open && <ScrollView style={embedded ? {} : {
        maxHeight: 300
      }} keyboardShouldPersistTaps="handled">
    {error && <Text accessibilityRole="alert" style={{
          color: '#B00020'
        }}>{error}</Text>}{data && <><FareBreakdown receipt={data.receipt} pricing={data.pricing} driver={driver} /><Text style={text}>Trip: {data.status} · Payment: {data.payment?.status || 'pending'}</Text>
    {data.waiting?.arrivedAt && <Text style={text}>Pickup waiting began {new Date(data.waiting.arrivedAt).toLocaleTimeString()}. Free period: {data.pricing.policy.freeWaitingSeconds}s. {data.waiting.endedAt ? 'Waiting ended.' : 'Paid waiting starts after the free period.'}</Text>}
    {!driver && data.status === 'searching' && offers.map(o => <View key={o._id}><Text style={text}>Driver transport offer {pkr(o.amountPaisa)} · expires {new Date(o.expiresAt).toLocaleTimeString()}</Text><FareBreakdown receipt={o.breakdown} /><Button disabled={busy} title="Select this driver and total" onPress={() => action(() => api.post(`/rides/${rideId}/select-offer`, {
              offerId: o._id
            }))} /></View>)}
    {['accepted', 'started'].includes(data.status) && <><Text style={text}>Fare changes require passenger approval.</Text><View style={{
              flexDirection: 'row'
            }}>{[...(driver ? ['passThrough'] : ['tip']), 'route'].map(k => <Button key={k} title={`${kind === k ? '✓ ' : ''}${k === 'passThrough' ? 'Toll / parking / airport' : k}`} onPress={() => {
                setKind(k);
                setReplacing(null);
              }} />)}</View>
      {kind === 'route' ? <><CustomPlacesAutocomplete placeholder="Revised destination" onPress={(d, x) => setDestination(place(d, x))} /><CustomPlacesAutocomplete placeholder="Additional approved stop" onPress={(d, x) => setExtraStop(place(d, x))} /><Text style={text}>{destination?.address || extraStop?.address || 'Select revised address'}</Text></> : <><TextInput style={input} keyboardType="decimal-pad" placeholder="Amount in PKR" value={amount} onChangeText={setAmount} /><TextInput style={input} placeholder="Reason" value={reason} onChangeText={setReason} />{kind === 'passThrough' && <><View style={{
                  flexDirection: 'row'
                }}>{['toll', 'parking', 'airport'].map(t => <Button key={t} title={`${t === chargeType ? '✓ ' : ''}${t}`} onPress={() => setChargeType(t)} />)}</View><TextInput style={input} placeholder="Receipt / evidence reference" value={evidence} onChangeText={setEvidence} /></>}</>}
      <Button disabled={busy} title="Request revised fare / charge" onPress={proposal} /></>}
    {driver && ['accepted', 'started'].includes(data.status) && (data.adjustments || []).filter(a => a.kind === 'passThrough' && a.status === 'approved').map(a => <View key={'revise-' + a.id}><Text style={text}>Approved {a.chargeType}: {pkr(a.amountPaisa)}</Text><Button title="Correct / waive this charge" onPress={() => {
              setKind('passThrough');
              setReplacing(a.id);
              setAmount(String(a.amountPaisa / 100));
              setChargeType(a.chargeType);
            }} /></View>)}
    {replacing && <Button title="Cancel charge correction" onPress={() => setReplacing(null)} />}
    {(data.adjustments || []).filter(a => a.status === 'pending').map(a => <View key={a.id}><Text style={text}>{a.kind}: {a.reason || a.route?.dropoff?.address || ''} {a.amountPaisa ? pkr(a.amountPaisa) : ''}</Text>{a.breakdown && <FareBreakdown receipt={a.breakdown} />}{!driver && <><Button title="Approve disclosed adjustment" disabled={busy} onPress={() => action(() => api.put(`/rides/${rideId}/adjustments/${a.id}`, {
                approved: true
              }))} /><Button title="Reject adjustment" disabled={busy} onPress={() => action(() => api.put(`/rides/${rideId}/adjustments/${a.id}`, {
                approved: false
              }))} /></>}</View>)}
    {data.status === 'completed' && data.payment?.status !== 'paid' && <><Text style={text}>Choose wallet or confirm cash only after the full amount has actually changed hands.</Text>{!driver && <Button disabled={busy || !!data.settlement} title="Pay full disclosed total by wallet" onPress={() => action(() => api.post('/payments/process', {
              rideId,
              paymentMethod: 'wallet'
            }, {
              headers: {
                'Idempotency-Key': `settle-${rideId}`
              }
            }))} />}<Button disabled={busy || data.settlement?.status === 'disputed'} title={driver ? 'Confirm full cash received' : 'Acknowledge full cash paid'} onPress={() => Alert.alert('Confirm cash', `${pkr(data.receipt.passengerTotalPaisa)} ${driver ? 'received from passenger' : 'paid to driver'}?`, [{
              text: 'Cancel'
            }, {
              text: 'Confirm',
              onPress: () => action(() => api.post(`/rides/${rideId}/cash`, {
                amountPaisa: data.receipt.passengerTotalPaisa
              }))
            }])} /><Button disabled={busy || data.settlement?.status === 'disputed'} title="Dispute cash payment" onPress={() => action(() => api.post(`/rides/${rideId}/cash`, {
              amountPaisa: data.receipt.passengerTotalPaisa,
              disputed: true
            }))} /></>}
    {data.settlement?.status === 'settled' && <View><Text style={text}>Refunded: {pkr(data.settlement.refundedPaisa)} | Net passenger payment: {pkr(data.settlement.allocations.passengerTotalPaisa - (data.settlement.refundedPaisa || 0))}</Text><Text style={text}>Net platform fee allocation: {pkr(data.settlement.allocations.platformRevenuePaisa - (data.settlement.refundedAllocations?.platformRevenuePaisa || 0))}</Text></View>}
      {data.settlement && <Text style={text}>Settlement: {data.settlement.status}; driver confirmed: {data.settlement.driverConfirmed ? 'yes' : 'no'}; passenger acknowledged: {data.settlement.passengerAcknowledged ? 'yes' : 'no'}</Text>}
    {(data.cashRefunds || []).map(r => <View key={r._id}><Text style={text}>Cash refund {pkr(r.amountPaisa)}: {r.reason} · {r.status}</Text><Button disabled={busy || r.status === 'disputed'} title={driver ? 'Confirm refund cash returned' : 'Acknowledge refund cash received'} onPress={() => action(() => api.post(`/rides/${rideId}/cash-refund`, {
              refundKey: r.key
            }))} /><Button title="Dispute cash refund" disabled={busy} onPress={() => action(() => api.post(`/rides/${rideId}/cash-refund`, {
              refundKey: r.key,
              disputed: true
            }))} /></View>)}
    </>}<Button title="Refresh" disabled={busy} onPress={() => action(refresh)} />
  </ScrollView>}</View></View>;
}
