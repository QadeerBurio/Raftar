// Dev-only gallery of every components/ui component in all states.
// Registered in AppNavigator only when __DEV__ is true.
import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car, Bike, Crown, Wallet, Plus, Phone, Lock, Search, Bell, Menu, Star,
  Users, CalendarClock, Package, Route, Radar, ArrowRight,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme/tokens';
import {
  AppText, Button, Input, RouteInput, Chip, SelectCard, SegmentedControl, BottomSheet,
  Header, EmptyState, IconTile, IconButton, Badge, Logo, Card, OtpInput, InlineMessage,
} from '../../components/ui';

const Section = ({ title, children, colors }) => (
  <View style={styles.section}>
    <Text style={[typography.overline, { color: colors.textSecondary, marginBottom: spacing.l }]}>{title}</Text>
    {children}
  </View>
);

const UiKitScreen = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [chip, setChip] = useState('Now');
  const [tariff, setTariff] = useState('car');
  const [seg, setSeg] = useState('upfront');
  const [surge, setSurge] = useState('off');
  const [otp, setOtp] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="UI kit" subtitle="Dev only. Every components/ui state." rightIcon={Bell} rightLabel="Notifications" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <AppText variant="small" tone="muted">Dark mode (teal dark palette)</AppText>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: colors.primary, false: colors.switchTrackOff }}
            thumbColor={colors.switchThumbOff}
            accessibilityLabel="Toggle dark mode"
          />
        </View>

        <Section title="Typography" colors={colors}>
          <AppText variant="display">Display 30/800</AppText>
          <AppText variant="amount">Rs 1,250</AppText>
          <AppText variant="title">Title 22/800</AppText>
          <AppText variant="cardTitle">Card title 17/700</AppText>
          <AppText variant="body" tone="muted">Body 15/400 with 1.5 line height. Har Safar, Aap Ke Saath.</AppText>
          <AppText variant="small" tone="muted">Small 13/500</AppText>
          <AppText variant="overline" tone="muted">Overline 13/700</AppText>
        </Section>

        <Section title="Logo" colors={colors}>
          <Logo />
          <View style={[styles.tealStrip, { backgroundColor: colors.primary }]}>
            <Logo size={40} onDark />
          </View>
        </Section>

        <Section title="Button" colors={colors}>
          <View style={styles.stack}>
            <Button title="Primary" onPress={() => {}} />
            <Button title="Primary with icon" iconRight={ArrowRight} onPress={() => {}} />
            <Button title="Secondary" variant="secondary" onPress={() => {}} />
            <Button title="Add funds" variant="money" icon={Wallet} onPress={() => {}} />
            <Button title="Disabled" disabled onPress={() => {}} />
            <Button title="Loading" loading onPress={() => {}} />
            <View style={styles.row}>
              <Button title="Small" size="small" onPress={() => {}} />
              <Button title="Small secondary" size="small" variant="secondary" onPress={() => {}} />
            </View>
            <AppText variant="small" tone="muted">Legacy variants outline and danger render as secondary:</AppText>
            <Button title="Legacy outline" variant="outline" onPress={() => {}} />
          </View>
        </Section>

        <Section title="Input" colors={colors}>
          <Input placeholder="Phone number" prefix="+92" icon={Phone} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Input placeholder="Password" icon={Lock} secureTextEntry value={password} onChangeText={setPassword} />
          <Input label="With label and hint" placeholder="Full name" hint="As it appears on your CNIC" />
          <Input label="Error state" placeholder="Email" icon="email" value="not-an-email" error="Enter a valid email address" />
          <Input placeholder="Search places" icon={Search} iconRight={Plus} iconRightLabel="Add stop" onIconPress={() => {}} />
          <Input placeholder="Disabled field" editable={false} />
          <Input placeholder="Notes for the driver" multiline numberOfLines={4} />
        </Section>

        <Section title="OtpInput" colors={colors}>
          <View style={styles.stack}>
            <OtpInput value={otp} onChangeText={setOtp} />
            <OtpInput value="1234" onChangeText={() => {}} />
            <OtpInput value="12" onChangeText={() => {}} error />
          </View>
        </Section>

        <Section title="InlineMessage" colors={colors}>
          <View style={styles.stack}>
            <InlineMessage>Passwords do not match.</InlineMessage>
            <InlineMessage tone="info">Your code expires in 60 seconds.</InlineMessage>
            <InlineMessage tone="success">Documents uploaded.</InlineMessage>
            <InlineMessage tone="pending">Verification pending review.</InlineMessage>
          </View>
        </Section>

        <Section title="RouteInput" colors={colors}>
          <View style={styles.stack}>
            <RouteInput pickupValue="Gulberg III, Lahore" destinationValue="" onPickupPress={() => {}} onDestinationPress={() => {}} />
            <RouteInput pickupValue="Gulberg III, Lahore" destinationValue="Allama Iqbal Airport" onPickupPress={() => {}} onDestinationPress={() => {}} />
            <RouteInput editable onPickupChange={() => {}} onDestinationChange={() => {}} />
          </View>
        </Section>

        <Section title="Chip" colors={colors}>
          <View style={styles.wrap}>
            {['Now', 'Schedule', 'Cash', 'Wallet'].map((c) => (
              <Chip key={c} label={c} selected={chip === c} onPress={() => setChip(c)} />
            ))}
            <Chip label="With icon" icon={Star} onPress={() => {}} />
            <Chip label="Selected icon" icon={Star} selected onPress={() => {}} />
            <Chip label="Disabled" disabled onPress={() => {}} />
          </View>
        </Section>

        <Section title="SelectCard" colors={colors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {[
              { k: 'bike', t: 'Bike', s: '2 min', m: 'Rs 100', i: Bike },
              { k: 'car', t: 'Car', s: '4 min', m: 'Rs 200', i: Car },
              { k: 'lux', t: 'Luxury', s: '8 min', m: 'Rs 450', i: Crown },
            ].map((o) => (
              <SelectCard key={o.k} title={o.t} subtitle={o.s} meta={o.m} icon={o.i} selected={tariff === o.k} onPress={() => setTariff(o.k)} />
            ))}
            <SelectCard title="Disabled" subtitle="Unavailable" meta="Rs 0" icon={Car} disabled />
          </ScrollView>
          <View style={[styles.stack, { marginTop: spacing.l }]}>
            <SelectCard layout="row" title="Row layout" subtitle="Unselected" icon={Users} onPress={() => {}} />
            <SelectCard layout="row" title="Row layout" subtitle="Selected" meta="Rs 250" icon={Users} selected onPress={() => {}} />
          </View>
        </Section>

        <Section title="SegmentedControl" colors={colors}>
          <View style={styles.stack}>
            <SegmentedControl value={seg} onChange={setSeg} options={[{ label: 'Upfront', value: 'upfront' }, { label: 'Offer your fare', value: 'neg' }]} />
            <SegmentedControl value={surge} onChange={setSurge} options={[{ label: 'Off', value: 'off' }, { label: 'Scheduled', value: 'sched' }, { label: 'Live demand', value: 'live' }]} />
          </View>
        </Section>

        <Section title="IconTile / IconButton / Badge" colors={colors}>
          <View style={styles.wrap}>
            <IconTile icon={Car} tint="ride" size="lg" />
            <IconTile icon={Users} tint="carpool" size="lg" />
            <IconTile icon={CalendarClock} tint="monthly" size="lg" />
            <IconTile icon={Package} tint="parcel" size="lg" />
            <IconTile icon={Route} tint="intercity" size="lg" />
            <IconTile icon={Wallet} size="md" />
            <IconTile icon={Wallet} size="sm" />
          </View>
          <View style={[styles.wrap, { marginTop: spacing.l }]}>
            <IconButton icon={Menu} accessibilityLabel="Open menu" onPress={() => {}} />
            <IconButton icon={Bell} shape="round" accessibilityLabel="Notifications" onPress={() => {}} />
            <Badge label="4.9" icon={Star} />
            <Badge label="LEB 1234" tone="cream" />
            <Badge label="Active" tone="success" />
            <Badge label="Teal" tone="teal" />
            <Badge label="Mist" tone="mist" />
          </View>
        </Section>

        <Section title="Card" colors={colors}>
          <View style={styles.stack}>
            <Card><AppText variant="cardTitle">Default card</AppText></Card>
            <Card variant="elevated"><AppText variant="cardTitle">Elevated card</AppText></Card>
            <Card variant="teal">
              <AppText variant="overline" tone="onPrimary">Wallet balance</AppText>
              <AppText variant="amount" tone="onPrimary">Rs 2,450</AppText>
            </Card>
            <Card variant="cream"><AppText variant="cardTitle" color={colors.primary}>Cream card</AppText></Card>
            <Card variant="mist" onPress={() => {}} accessibilityLabel="Pressable mist card"><AppText variant="cardTitle">Mist card (pressable)</AppText></Card>
          </View>
        </Section>

        <Section title="BottomSheet" colors={colors}>
          <View style={[styles.mapFake, { backgroundColor: colors.surface }]}>
            <BottomSheet>
              <AppText variant="title">Where to?</AppText>
              <AppText variant="small" tone="muted" style={{ marginBottom: spacing.l }}>Static sheet surface with grab handle</AppText>
              <Button title="Book Car · Rs 200" onPress={() => {}} />
            </BottomSheet>
          </View>
        </Section>

        <Section title="EmptyState" colors={colors}>
          <Card variant="default" style={{ minHeight: 320 }}>
            <EmptyState icon={Radar} title="No ride requests" description="New requests near you will appear here." buttonText="Refresh" onButtonPress={() => {}} />
          </Card>
          <Card variant="default" style={{ minHeight: 260, marginTop: spacing.l }}>
            <EmptyState title="Without button" description="Default icon and one line of text." />
          </Card>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingBottom: 48 },
  section: { marginTop: spacing.xxl },
  stack: { gap: spacing.l },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.l, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, alignItems: 'center' },
  hRow: { gap: spacing.l, paddingRight: spacing.screen },
  tealStrip: { marginTop: spacing.l, padding: spacing.xl, borderRadius: 20 },
  mapFake: { height: 260, borderRadius: 20, justifyContent: 'flex-end', overflow: 'hidden' },
});

export default UiKitScreen;
