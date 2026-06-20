import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width: SW } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#080A0F',
  surface:    '#111318',
  raised:     '#1C2030',
  border:     '#252B3B',
  borderDim:  '#181D2A',
  accent:     '#FF4B4B',
  accentDim:  'rgba(255,75,75,0.12)',
  accentGlow: 'rgba(255,75,75,0.06)',
  text:       '#E8ECF4',
  textDim:    '#8A93AA',
  textFaint:  '#4B5270',
  white:      '#FFFFFF',
  pulse:      '#FF4B4B',
};

// ─── Content ──────────────────────────────────────────────────────────────────
const LAST_UPDATED = 'June 19, 2026';
const APP_NAME     = 'SOS';
const COMPANY      = 'Kobytech Solutions';
const EMAIL        = 'privacy@kobytech.com';

const SECTIONS = [
  {
    id: '01',
    title: 'Information We Collect',
    icon: 'inventory-2',
    body: [
      {
        subtitle: 'Location Data',
        text: 'When you trigger an SOS alert, we collect your precise GPS coordinates in real time. This data is used exclusively to relay your position to emergency contacts and, where enabled, local emergency services. We do not store historical location trails beyond 24 hours unless you explicitly enable the Location History feature in Settings.',
      },
      {
        subtitle: 'Account Information',
        text: 'When you create an account, we collect your full name, phone number, and email address. This information is used to verify your identity, allow emergency contacts to recognise you, and enable account recovery.',
      },
      {
        subtitle: 'Device & Usage Data',
        text: 'We automatically collect device model, OS version, app version, crash reports, and anonymised feature-usage statistics to improve reliability and performance. This data cannot be used to personally identify you.',
      },
      {
        subtitle: 'Emergency Contacts',
        text: 'You may choose to import contacts from your phone\'s address book. We only access the contacts you explicitly select as emergency contacts and do not scan, store, or analyse the rest of your address book.',
      },
    ],
  },
  {
    id: '02',
    title: 'How We Use Your Information',
    icon: 'settings-applications',
    body: [
      {
        subtitle: 'Core SOS Functionality',
        text: 'Your location and identity data are used solely to dispatch alerts to your chosen emergency contacts and, if you opt in, to verified emergency services (police, ambulance, fire). No alert is sent without your direct action or a configured automated trigger you have enabled.',
      },
      {
        subtitle: 'Service Improvement',
        text: 'Anonymised, aggregated crash and usage data help us identify bugs, optimise alert delivery times, and develop new safety features. This data is never sold or shared with advertisers.',
      },
      {
        subtitle: 'Communications',
        text: 'We may send you critical security notices, app update alerts, and — only if you opt in — safety tips. You can manage notification preferences at any time under Settings › Notifications.',
      },
    ],
  },
  {
    id: '03',
    title: 'Data Sharing & Disclosure',
    icon: 'share',
    body: [
      {
        subtitle: 'We Do Not Sell Your Data',
        text: 'SOS does not sell, rent, trade, or lease your personal information to third parties under any circumstances. Your safety data is not a commercial product.',
      },
      {
        subtitle: 'Emergency Services',
        text: 'With your explicit opt-in, your location and identity may be shared with verified emergency dispatch centres in your region during an active SOS event only.',
      },
      {
        subtitle: 'Service Providers',
        text: 'We engage trusted sub-processors (cloud hosting, SMS delivery, push notifications) under strict data processing agreements that prohibit them from using your data for any purpose other than delivering our service.',
      },
      {
        subtitle: 'Legal Requirements',
        text: 'We may disclose information when required by valid court order, warrant, or applicable law. Where legally permitted, we will notify you before complying with such requests.',
      },
    ],
  },
  {
    id: '04',
    title: 'Data Retention',
    icon: 'schedule',
    body: [
      {
        subtitle: 'Active Accounts',
        text: 'We retain your account data for as long as your account is active. Alert event records (timestamp, duration, contacts notified) are retained for 90 days to help you review past incidents, after which they are automatically deleted.',
      },
      {
        subtitle: 'Account Deletion',
        text: 'When you delete your account, all personal data is purged from our production systems within 30 days and from backup archives within 90 days. Anonymised, non-identifiable statistical records may be retained indefinitely.',
      },
    ],
  },
  {
    id: '05',
    title: 'Your Rights & Choices',
    icon: 'verified-user',
    body: [
      {
        subtitle: 'Access & Portability',
        text: 'You may request a full export of the personal data we hold about you at any time from Settings › Privacy › Download My Data.',
      },
      {
        subtitle: 'Correction & Deletion',
        text: 'You can correct your account information directly in the app. To request deletion of specific data or your entire account, go to Settings › Privacy › Delete Account, or contact us at ' + EMAIL + '.',
      },
      {
        subtitle: 'Opt-Out',
        text: 'You may disable location sharing, emergency service integration, or marketing communications at any time. Disabling core location permissions will limit SOS alert functionality but will not affect your ability to use other app features.',
      },
      {
        subtitle: 'Residents of Specific Regions',
        text: 'If you are located in the EU/EEA (GDPR), California (CCPA), or another jurisdiction with specific privacy regulations, you may have additional rights including the right to object to processing, restrict processing, or lodge a complaint with a supervisory authority.',
      },
    ],
  },
  {
    id: '06',
    title: 'Security',
    icon: 'lock',
    body: [
      {
        subtitle: 'Technical Safeguards',
        text: 'All data in transit is encrypted with TLS 1.3. Data at rest is encrypted using AES-256. SOS alert transmissions use an additional end-to-end encryption layer so that even our infrastructure cannot read the content of your alerts.',
      },
      {
        subtitle: 'Access Controls',
        text: 'Access to personal data is restricted to authorised personnel on a strict need-to-know basis, enforced through role-based access controls, multi-factor authentication, and audit logging.',
      },
      {
        subtitle: 'Incident Response',
        text: 'In the event of a data breach that may affect your rights or freedoms, we will notify affected users and relevant authorities within 72 hours of becoming aware, as required by applicable law.',
      },
    ],
  },
  {
    id: '07',
    title: 'Children\'s Privacy',
    icon: 'child-care',
    body: [
      {
        subtitle: 'Age Restriction',
        text: 'SOS is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us immediately at ' + EMAIL + ' and we will delete the information promptly.',
      },
      {
        subtitle: 'Family Accounts',
        text: 'The SOS Family Plan allows parents or guardians to set up monitored accounts for minors aged 13–17. All data collected under a family account is governed by this policy and the guardian assumes responsibility for consent on behalf of the minor.',
      },
    ],
  },
  {
    id: '08',
    title: 'Changes to This Policy',
    icon: 'update',
    body: [
      {
        subtitle: 'Notification of Changes',
        text: 'We may update this Privacy Policy periodically. When we make material changes, we will notify you via in-app notification at least 14 days before the change takes effect. The updated date at the top of this page always reflects the most recent revision.',
      },
      {
        subtitle: 'Continued Use',
        text: 'Your continued use of SOS after the effective date of a revised policy constitutes your acceptance of the changes. If you do not agree with the updated policy, you may delete your account before the effective date.',
      },
    ],
  },
];

// ─── Section component ────────────────────────────────────────────────────────
function PolicySection({ section, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        ps.sectionWrap,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left pulse bar */}
      <View style={ps.pulseBar} />

      <View style={ps.sectionInner}>
        {/* Section header */}
        <View style={ps.sectionHead}>
          <Text style={ps.sectionNum}>{section.id}</Text>
          <View style={ps.iconWrap}>
            <Icon name={section.icon} size={16} color={C.accent} />
          </View>
          <Text style={ps.sectionTitle}>{section.title}</Text>
        </View>

        {/* Body items */}
        {section.body.map((item, i) => (
          <View key={i} style={ps.bodyItem}>
            <View style={ps.subtitleRow}>
              <View style={ps.dot} />
              <Text style={ps.subtitle}>{item.subtitle}</Text>
            </View>
            <Text style={ps.bodyText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function PrivacyPolicy() {
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrolled, setScrolled] = useState(false);

  const headerBg = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: ['rgba(8,10,15,0)', 'rgba(8,10,15,0.98)'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.root}>
      {/* Sticky top bar */}
      <Animated.View style={[s.topBar, { backgroundColor: headerBg }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={s.topBarCenter}>
          {/* SOS logo mark */}
          <View style={s.logoMark}>
            <Text style={s.logoText}>SOS</Text>
          </View>
        </View>
        <View style={s.topBarRight}>
          <View style={s.updatedChip}>
            <View style={s.chipDot} />
            <Text style={s.chipText}>Updated</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <View style={s.hero}>
          {/* Background glow */}
          <View style={s.heroGlow} />

          <View style={s.heroSosWrap}>
            <Text style={s.heroSosLabel}>SOS</Text>
            <View style={s.heroSosDivider} />
            <Text style={s.heroSosTagline}>Emergency Response App</Text>
          </View>

          <Text style={s.heroTitle}>Privacy{'\n'}Policy</Text>

          <View style={s.heroMeta}>
            <View style={s.heroMetaRow}>
              <Icon name="event" size={13} color={C.textFaint} />
              <Text style={s.heroMetaText}>Effective {LAST_UPDATED}</Text>
            </View>
            <View style={s.heroMetaRow}>
              <Icon name="business" size={13} color={C.textFaint} />
              <Text style={s.heroMetaText}>{COMPANY}</Text>
            </View>
          </View>

          <View style={s.heroDivider} />

          <Text style={s.heroIntro}>
            At {COMPANY}, the safety and privacy of SOS users is our highest responsibility. This policy explains exactly what data we collect, why we collect it, and the controls you have over it — in plain language, without ambiguity.
          </Text>
        </View>

        {/* Quick summary cards */}
        <View style={s.summaryRow}>
          {[
            { icon: 'block', label: 'Never sold', sub: 'Your data' },
            { icon: 'lock', label: 'Encrypted', sub: 'End-to-end' },
            { icon: 'delete-forever', label: '90 days', sub: 'Alert records' },
          ].map((card, i) => (
            <View key={i} style={s.summaryCard}>
              <View style={s.summaryIconWrap}>
                <Icon name={card.icon} size={18} color={C.accent} />
              </View>
              <Text style={s.summaryLabel}>{card.label}</Text>
              <Text style={s.summarySub}>{card.sub}</Text>
            </View>
          ))}
        </View>

        {/* Policy sections */}
        <View style={s.sectionsWrap}>
          {SECTIONS.map((section, i) => (
            <PolicySection key={section.id} section={section} index={i} />
          ))}
        </View>

        {/* Contact footer */}
        <View style={s.contactCard}>
          <View style={s.contactIconWrap}>
            <Icon name="contact-support" size={24} color={C.accent} />
          </View>
          <Text style={s.contactTitle}>Questions about your privacy?</Text>
          <Text style={s.contactBody}>
            Our dedicated privacy team is available to help. Reach out any time and we will respond within 5 business days.
          </Text>
          <View style={s.contactEmail}>
            <Icon name="mail-outline" size={14} color={C.accent} />
            <Text style={s.contactEmailText}>{EMAIL}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLogoRow}>
            <View style={s.footerLogo}>
              <Text style={s.footerLogoText}>SOS</Text>
            </View>
            <Text style={s.footerCompany}>{COMPANY}</Text>
          </View>
          <Text style={s.footerCopy}>
            © {new Date().getFullYear()} {COMPANY}. All rights reserved.
          </Text>
          <Text style={s.footerVersion}>Privacy Policy · v3.1</Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Section styles ───────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  sectionWrap: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  pulseBar: {
    width: 2,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginRight: 16,
    opacity: 0.5,
  },
  sectionInner: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionNum: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginRight: 10,
    fontVariant: ['tabular-nums'],
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.1,
  },
  bodyItem: {
    marginBottom: 16,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accent,
    marginRight: 8,
    opacity: 0.7,
  },
  subtitle: {
    color: C.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: C.textDim,
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 12,
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  logoMark: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  topBarRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  updatedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,75,75,0.1)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,75,75,0.2)',
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginRight: 5,
  },
  chipText: {
    color: C.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 48,
  },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'ios' ? 130 : 110,
    paddingHorizontal: 24,
    paddingBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,75,75,0.07)',
  },
  heroSosWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroSosLabel: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
  },
  heroSosDivider: {
    width: 1,
    height: 12,
    backgroundColor: C.border,
    marginHorizontal: 10,
  },
  heroSosTagline: {
    color: C.textFaint,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: C.text,
    fontSize: 46,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroMeta: {
    marginBottom: 24,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroMetaText: {
    color: C.textFaint,
    fontSize: 12,
    marginLeft: 6,
  },
  heroDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 20,
  },
  heroIntro: {
    color: C.textDim,
    fontSize: 15,
    lineHeight: 24,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  summarySub: {
    color: C.textFaint,
    fontSize: 10,
    textAlign: 'center',
  },

  // Sections
  sectionsWrap: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  // Contact card
  contactCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: C.raised,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    alignItems: 'center',
  },
  contactIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,75,75,0.2)',
  },
  contactTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  contactBody: {
    color: C.textDim,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  contactEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentDim,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,75,75,0.2)',
  },
  contactEmailText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 8,
  },
  footerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLogo: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  footerLogoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  footerCompany: {
    color: C.textFaint,
    fontSize: 12,
    fontWeight: '600',
  },
  footerCopy: {
    color: C.textFaint,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerVersion: {
    color: C.border,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
