import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  NativeModules,
  Dimensions,
} from 'react-native';

// ─── Network ────────────────────────────────────────────────────────────────
const scriptURL = NativeModules.SourceCode?.scriptURL;
const hostIP = scriptURL ? scriptURL.split('://')[1]?.split(':')[0] : '192.168.137.1';
const API_BASE_URL = `http://${hostIP || '192.168.137.1'}:8001/api/v1`;

// ─── Status bar height (Android fix) ────────────────────────────────────────
// Modern Android punch-hole cameras and notches require 48-52dp clearance.
// Math.max guarantees at least 54dp so headers NEVER collide with clock/battery.
const STATUSBAR_HEIGHT = Platform.OS === 'android'
  ? Math.max(StatusBar.currentHeight || 0, 48) + 6
  : 44;
const { width: SW } = Dimensions.get('window');

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  primary:   '#6B2D8B',
  dark:      '#4A1564',
  light:     '#EDE7F6',
  accent:    '#E91E8C',
  accentBg:  '#FCE4EC',
  bg:        '#F5F3F8',
  card:      '#FFFFFF',
  text:      '#1A1025',
  sub:       '#7B6F8A',
  border:    '#E0D6F0',
  success:   '#2E7D32',
  successBg: '#E8F5E9',
  error:     '#C62828',
  warn:      '#E65100',
  warnBg:    '#FFF3E0',
};

// ─── Reusable: Screen wrapper with dedicated status bar spacer ───────────────
function Screen({ children, style, statusBarBg = C.card, barStyle = 'dark-content' }) {
  return (
    <View style={[{ flex: 1, backgroundColor: C.bg }, style]}>
      <StatusBar barStyle={barStyle} backgroundColor={statusBarBg} translucent={true} />
      {/* Physical spacer pushing all content cleanly below Android status bar & camera notch */}
      <View style={{ height: STATUSBAR_HEIGHT, backgroundColor: statusBarBg, width: '100%' }} />
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
}

// ─── Reusable: Top navbar ────────────────────────────────────────────────────
function NavBar({ title, onBack, backLabel = 'Back', right }) {
  return (
    <View style={s.navBar}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={s.navBack}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.7}
        >
          <Text style={s.navBackArrow}>‹</Text>
          <Text style={s.navBackText}>{backLabel}</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.navSide} />
      )}
      <Text style={s.navTitle} numberOfLines={1}>{title}</Text>
      <View style={s.navSide}>{right || null}</View>
    </View>
  );
}

// ─── Reusable: Primary button ────────────────────────────────────────────────
function Btn({ label, onPress, disabled, loading, style, outline, color }) {
  const bg = outline ? 'transparent' : (color || C.primary);
  const border = outline ? C.primary : 'transparent';
  const textColor = outline ? C.primary : '#fff';
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg, borderWidth: 2, borderColor: border, opacity: disabled ? 0.45 : 1 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[s.btnText, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

// ─── Reusable: Labelled input ─────────────────────────────────────────────────
function Field({ label, multiline, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={s.fieldLabel}>{label}</Text> : null}
      <TextInput
        style={[s.input, multiline && { height: 90, textAlignVertical: 'top' }]}
        multiline={multiline}
        placeholderTextColor={C.sub}
        {...props}
      />
    </View>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const SKILL_CATEGORIES = [
  { id: 'cooking',   emoji: '🍛', label: 'Cooking & Food',       skills: ['Tiffin Service','Baking & Cakes','Pickles & Preserves','Catering','Street Food','Health Juices'] },
  { id: 'tailoring', emoji: '👗', label: 'Tailoring & Fashion',   skills: ['Blouse Stitching','Dress Design','Alterations','Embroidery','Kids Clothing','Bridal Wear'] },
  { id: 'crafts',    emoji: '🏺', label: 'Crafts & Handmade',     skills: ['Terracotta Jewelry','Handmade Candles','Macrame','Pottery','Handloom Weaving','Eco Products'] },
  { id: 'beauty',    emoji: '💄', label: 'Beauty & Wellness',      skills: ['Bridal Makeup','Mehendi/Henna','Hair Styling','Skincare','Yoga/Fitness','Herbal Remedies'] },
  { id: 'tutoring',  emoji: '📚', label: 'Tutoring & Education',   skills: ['School Subjects','Music Lessons','Dance Classes','Language Coaching','Spoken English','Coding for Kids'] },
  { id: 'art',       emoji: '🎨', label: 'Art & Creativity',       skills: ['Painting','Digital Art','Greeting Cards','Rangoli Design','Calligraphy','Photography'] },
];
const EXP_LEVELS = [
  { value: 'beginner',     emoji: '🌱', label: 'Beginner',      desc: 'Just getting started' },
  { value: 'intermediate', emoji: '⭐', label: 'Intermediate',  desc: '1–3 years of practice' },
  { value: 'experienced',  emoji: '🏆', label: 'Experienced',   desc: '3+ years, well practiced' },
];
const HOURS_OPT = [5, 10, 15, 20, 30, 40];
const BIZ_CATS  = SKILL_CATEGORIES.map(c => c.label);

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen]       = useState('splash');
  const [role,   setRole]         = useState('entrepreneur');
  const [user,   setUser]         = useState(null);
  const [token,  setToken]        = useState(null);
  const [skillResults, setSkillResults] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => setScreen('onboarding'), 2500);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const go = (s) => setScreen(s);
  const logout = () => { setToken(null); setUser(null); go('welcome'); };

  if (screen === 'splash')      return <SplashScreen />;
  if (screen === 'onboarding')  return <OnboardingScreen onDone={() => go('welcome')} />;
  if (screen === 'welcome')     return <WelcomeScreen onRole={r => { setRole(r); go('register'); }} onLogin={() => go('login')} />;
  if (screen === 'login')       return <LoginScreen    onSuccess={(tk, u) => { setToken(tk); setUser(u); setRole(u.role || 'entrepreneur'); go('home'); }} onRegister={() => go('register')} />;
  if (screen === 'register')    return <RegisterScreen initialRole={role} onSuccess={(tk, u) => { setToken(tk); setUser(u); setRole(u.role); go(u.role === 'entrepreneur' ? 'profileSetup' : 'home'); }} onLogin={() => go('login')} />;
  if (screen === 'profileSetup')return <ProfileSetupScreen token={token} onDone={() => go('home')} />;
  if (screen === 'skillDisc')   return <SkillDiscScreen token={token} onBack={() => go('home')} onResults={r => { setSkillResults(r); go('skillRes'); }} />;
  if (screen === 'skillRes')    return <SkillResScreen results={skillResults} token={token} onBack={() => go('skillDisc')} onHome={() => go('home')} />;
  if (screen === 'bizProfile')  return <BizProfileScreen token={token} onBack={() => go('home')} />;
  if (screen === 'pricing')     return <PricingScreen   token={token} onBack={() => go('home')} />;
  if (screen === 'marketingAi') return <MarketingAiScreen token={token} onBack={() => go('home')} />;
  if (screen === 'productDetails') return <ProductDetailsScreen product={selectedProduct} onBack={() => go('home')} onOrderOnline={p => go('placeOrder')} />;
  if (screen === 'myListings')  return <MyListingsScreen token={token} onBack={() => go('home')} onAdd={() => go('addProduct')} onSelect={p => { setSelectedProduct(p); go('productDetails'); }} />;
  if (screen === 'addProduct')  return <AddProductScreen token={token} onBack={() => go('myListings')} onSuccess={() => go('myListings')} />;
  if (screen === 'placeOrder')  return <PlaceOrderScreen product={selectedProduct} token={token} onBack={() => go('productDetails')} onSuccess={ord => { setSelectedOrder(ord); go('orderChat'); }} />;
  if (screen === 'orderChat')   return <OrderChatScreen order={selectedOrder} token={token} userRole={role} onBack={() => go('myOrders')} onPayUPI={() => go('upiPayment')} onReview={() => go('writeReview')} onSafety={() => go('safety')} />;
  if (screen === 'myOrders')    return <MyOrdersScreen token={token} userRole={role} onBack={() => go('home')} onSelectOrder={ord => { setSelectedOrder(ord); go('orderChat'); }} />;
  if (screen === 'upiPayment')  return <UPIPaymentScreen order={selectedOrder} token={token} onBack={() => go('orderChat')} onSuccess={() => go('orderChat')} />;
  if (screen === 'writeReview') return <WriteReviewScreen order={selectedOrder} token={token} onBack={() => go('orderChat')} onSuccess={() => go('myOrders')} />;
  if (screen === 'safety')      return <SafetyScreen token={token} onBack={() => go('home')} />;

  return (
    <HomeScreen
      role={role}
      user={user}
      onNavigate={go}
      onLogout={logout}
      onSelectProduct={(p) => { setSelectedProduct(p); go('productDetails'); }}
    />
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SPLASH
// ════════════════════════════════════════════════════════════════════════════
function SplashScreen() {
  return (
    <View style={s.splash}>
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      <View style={s.splashLogo}><Text style={s.splashLogoText}>BH</Text></View>
      <Text style={s.splashTitle}>BuildHer</Text>
      <Text style={s.splashSub}>Empowering Women Entrepreneurs</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 32 }} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════════════════════════════════════════
function OnboardingScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const slides = [
    { emoji: '💡', title: 'Discover Your Skills', desc: 'AI helps you find business ideas based on what you love doing.' },
    { emoji: '🏪', title: 'Build Your Business', desc: 'Create a profile, price your products fairly, and reach customers.' },
    { emoji: '📈', title: 'Grow With Confidence', desc: 'Get marketing help and manage orders safely from your phone.' },
  ];
  const item = slides[slide];
  return (
    <Screen statusBarBg={C.bg} barStyle="dark-content">
      <View style={{ alignItems: 'flex-end', padding: 20 }}>
        <TouchableOpacity onPress={onDone}><Text style={s.link}>Skip</Text></TouchableOpacity>
      </View>
      <View style={s.onboardCenter}>
        <View style={s.onboardCircle}><Text style={{ fontSize: 52 }}>{item.emoji}</Text></View>
        <Text style={s.onboardTitle}>{item.title}</Text>
        <Text style={s.onboardDesc}>{item.desc}</Text>
        <View style={s.dots}>
          {slides.map((_, i) => <View key={i} style={[s.dot, i === slide && s.dotActive]} />)}
        </View>
      </View>
      <View style={{ padding: 24 }}>
        {slide < 2
          ? <Btn label="Next →" onPress={() => setSlide(slide + 1)} />
          : <Btn label="Get Started" onPress={onDone} color={C.accent} />}
      </View>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WELCOME
// ════════════════════════════════════════════════════════════════════════════
function WelcomeScreen({ onRole, onLogin }) {
  return (
    <Screen statusBarBg={C.primary} barStyle="light-content">
      <View style={s.welcomeHero}>
        <Text style={s.welcomeTitle}>Welcome to{'\n'}BuildHer 🌸</Text>
        <Text style={s.welcomeSub}>Your complete platform for women entrepreneurship in India</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={s.sectionTitle}>Choose your journey</Text>
        <TouchableOpacity style={s.roleCard} onPress={() => onRole('entrepreneur')} activeOpacity={0.85}>
          <View style={[s.roleIcon, { backgroundColor: C.light }]}><Text style={{ fontSize: 28 }}>🚀</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.roleTitle}>I am an Entrepreneur</Text>
            <Text style={s.roleSub}>Discover skills, launch a business, find customers</Text>
          </View>
          <Text style={{ fontSize: 20, color: C.primary }}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.roleCard} onPress={() => onRole('customer')} activeOpacity={0.85}>
          <View style={[s.roleIcon, { backgroundColor: C.accentBg }]}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.roleTitle}>I am a Customer</Text>
            <Text style={s.roleSub}>Explore products from women entrepreneurs near you</Text>
          </View>
          <Text style={{ fontSize: 20, color: C.primary }}>›</Text>
        </TouchableOpacity>
        <View style={s.row}>
          <Text style={s.sub}>Already have an account? </Text>
          <TouchableOpacity onPress={onLogin}><Text style={s.link}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════════════════════
function RegisterScreen({ initialRole, onSuccess, onLogin }) {
  const [role, setRole]     = useState(initialRole);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [phone, setPhone]   = useState('');
  const [pass, setPass]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name || !email || !pass) { Alert.alert('Required', 'Fill in name, email & password.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: name, email: email.trim(), password: pass, role, phone }) });
      const d = await r.json(); setLoading(false);
      if (r.ok) onSuccess(d.access_token, d); else Alert.alert('Error', d.detail || 'Registration failed');
    } catch { setLoading(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.'); }
  };

  return (
    <Screen>
      <NavBar title="Create Account" />
      <ScrollView contentContainerStyle={s.form}>
        <View style={s.toggle}>
          {['entrepreneur', 'customer'].map(r => (
            <TouchableOpacity key={r} style={[s.toggleItem, role === r && s.toggleItemActive]} onPress={() => setRole(r)}>
              <Text style={[s.toggleText, role === r && s.toggleTextActive]}>{r === 'entrepreneur' ? '🚀 Entrepreneur' : '🛍️ Customer'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field label="Full Name *" placeholder="e.g. Priya Sharma" value={name} onChangeText={setName} />
        <Field label="Email Address *" placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Field label="Phone (Optional)" placeholder="+91 98765 43210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Field label="Password *" placeholder="Min. 6 characters" secureTextEntry value={pass} onChangeText={setPass} />
        <Btn label="Create Account" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
        <View style={[s.row, { marginTop: 20 }]}>
          <Text style={s.sub}>Already have an account? </Text>
          <TouchableOpacity onPress={onLogin}><Text style={s.link}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onSuccess, onRegister }) {
  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !pass) { Alert.alert('Required', 'Enter email and password.'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password: pass }) });
      const d = await r.json(); setLoading(false);
      if (r.ok) onSuccess(d.access_token, d); else Alert.alert('Login Failed', d.detail || 'Invalid credentials');
    } catch { setLoading(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.'); }
  };

  return (
    <Screen>
      <NavBar title="Sign In" />
      <ScrollView contentContainerStyle={s.form}>
        <Text style={s.formHero}>Welcome back! 👋</Text>
        <Text style={[s.sub, { marginBottom: 24 }]}>Sign in to your BuildHer account</Text>
        <Field label="Email Address" placeholder="name@email.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Field label="Password" placeholder="••••••••" secureTextEntry value={pass} onChangeText={setPass} />
        <Btn label="Sign In" onPress={submit} loading={loading} style={{ marginTop: 8 }} />
        <View style={[s.row, { marginTop: 20 }]}>
          <Text style={s.sub}>Don't have an account? </Text>
          <TouchableOpacity onPress={onRegister}><Text style={s.link}>Register</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PROFILE SETUP
// ════════════════════════════════════════════════════════════════════════════
function ProfileSetupScreen({ token, onDone }) {
  const [bizName, setBizName]   = useState('');
  const [cat, setCat]           = useState('');
  const [bio, setBio]           = useState('');
  const [loading, setLoading]   = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/auth/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ business_name: bizName, business_category: cat, bio }) });
    } catch {}
    setLoading(false); onDone();
  };

  return (
    <Screen>
      <NavBar title="Set Up Business" />
      <ScrollView contentContainerStyle={s.form}>
        <Text style={s.formHero}>Let's build your profile 🏪</Text>
        <Text style={[s.sub, { marginBottom: 24 }]}>Help customers discover you</Text>
        <Field label="Business Name" placeholder="e.g. Priya's Kitchen" value={bizName} onChangeText={setBizName} />
        <Text style={s.fieldLabel}>Category</Text>
        <View style={s.chipWrap}>
          {BIZ_CATS.map(c => (
            <TouchableOpacity key={c} style={[s.chip, cat === c && s.chipActive]} onPress={() => setCat(c)}>
              <Text style={[s.chipText, cat === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field label="Short Bio" placeholder="What do you make or offer?" multiline value={bio} onChangeText={setBio} />
        <Btn label={loading ? '' : 'Complete Setup'} loading={loading} onPress={save} style={{ marginTop: 8 }} />
        <Btn label="Skip for now" onPress={onDone} outline style={{ marginTop: 12 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════════════════════════════════════
function HomeScreen({ role, user, onNavigate, onLogout, onSelectProduct }) {
  const isE = role === 'entrepreneur';
  const [products, setProducts]       = useState([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const eActions = [
    { emoji: '💡', title: 'Skill Discovery', sub: 'Find your best business idea', screen: 'skillDisc', color: '#7B1FA2' },
    { emoji: '🚀', title: 'Business Profile', sub: 'Build your brand online', screen: 'bizProfile', color: '#1565C0' },
    { emoji: '🧮', title: 'Pricing Calculator', sub: 'Price your products fairly', screen: 'pricing', color: '#2E7D32' },
    { emoji: '📢', title: 'Marketing AI', sub: 'Create social media posts', screen: 'marketingAi', color: '#E65100' },
    { emoji: '🏪', title: 'My Products', sub: 'Manage marketplace items', screen: 'myListings', color: '#D81B60' },
  ];

  const marketCategories = [
    'All',
    'Cooking & Food',
    'Tailoring & Fashion',
    'Crafts & Handmade',
    'Beauty & Wellness',
    'Tutoring & Education',
    'Art & Creativity',
  ];

  // Fetch marketplace products for customers (or entrepreneurs previewing)
  useEffect(() => {
    fetchProducts();
  }, [selectedCat]);

  const fetchProducts = async () => {
    setLoadingProds(true);
    try {
      const catParam = selectedCat !== 'All' ? `?category=${encodeURIComponent(selectedCat)}` : '';
      const r = await fetch(`${API_BASE_URL}/marketplace/products${catParam}`);
      if (r.ok) {
        const d = await r.json();
        setProducts(d);
      }
    } catch {}
    setLoadingProds(false);
  };

  const filteredProducts = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.business_name.toLowerCase().includes(q) ||
      p.location_city.toLowerCase().includes(q)
    );
  });

  return (
    <Screen style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <View style={s.homeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.homeGreeting}>Hello, {user?.full_name?.split(' ')[0] || (isE ? 'Entrepreneur' : 'Customer')} 👋</Text>
          <Text style={s.homeRole}>{isE ? '👩‍💼 Entrepreneur Dashboard' : '🛍️ Customer Marketplace'}</Text>
        </View>
        <View style={[s.row, { gap: 6 }]}>
          <TouchableOpacity style={s.safetyHeaderBtn} onPress={() => onNavigate('safety')}>
            <Text style={s.safetyHeaderText}>🛡️ Safety</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ordersHeaderBtn} onPress={() => onNavigate('myOrders')}>
            <Text style={s.ordersHeaderText}>📦 Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {isE ? (
          <>
            {/* Hero banner */}
            <View style={s.heroBanner}>
              <Text style={s.heroTitle}>Grow with AI 🌟</Text>
              <Text style={s.heroSub}>Discover skills, calculate prices, and sell in your community</Text>
            </View>

            <Text style={[s.sectionTitle, { paddingHorizontal: 20, marginTop: 24 }]}>Quick Actions</Text>
            <View style={s.actionGrid}>
              {eActions.map(a => (
                <TouchableOpacity
                  key={a.title}
                  style={[s.actionCard, !a.screen && { opacity: 0.5 }]}
                  onPress={() => a.screen && onNavigate(a.screen)}
                  activeOpacity={a.screen ? 0.8 : 1}
                >
                  <View style={[s.actionIcon, { backgroundColor: a.color + '18' }]}>
                    <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
                  </View>
                  <Text style={s.actionTitle}>{a.title}</Text>
                  <Text style={s.actionSub}>{a.sub}</Text>
                  {a.screen
                    ? <Text style={[s.actionTag, { color: a.color }]}>Open →</Text>
                    : <Text style={s.actionTagSoon}>Coming soon</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          /* Customer Marketplace Experience */
          <>
            <View style={[s.heroBanner, { backgroundColor: C.accent }]}>
              <Text style={s.heroTitle}>Support Women Artisans 💜</Text>
              <Text style={s.heroSub}>Discover authentic food, tailoring, crafts & services made with love</Text>
            </View>

            {/* Search Bar */}
            <View style={s.searchContainer}>
              <TextInput
                style={s.searchInput}
                placeholder="🔍 Search homemade food, crafts, tailoring..."
                placeholderTextColor={C.sub}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Category filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, marginVertical: 10 }}
            >
              {marketCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, selectedCat === cat && s.chipActive]}
                  onPress={() => setSelectedCat(cat)}
                >
                  <Text style={[s.chipText, selectedCat === cat && s.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
              <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                <Text style={s.sectionTitle}>Featured Micro-Businesses ({filteredProducts.length})</Text>
                <TouchableOpacity onPress={fetchProducts}>
                  <Text style={s.link}>Refresh ↺</Text>
                </TouchableOpacity>
              </View>

              {loadingProds ? (
                <View style={s.center}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={[s.sub, { marginTop: 8 }]}>Loading local products...</Text>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={[s.center, { paddingVertical: 40 }]}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🛍️</Text>
                  <Text style={[s.fieldLabel, { textAlign: 'center' }]}>No products found</Text>
                  <Text style={[s.sub, { textAlign: 'center' }]}>Try searching with another keyword or category</Text>
                </View>
              ) : (
                filteredProducts.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={s.marketCard}
                    onPress={() => onSelectProduct && onSelectProduct(p)}
                    activeOpacity={0.85}
                  >
                    <View style={s.marketCardEmoji}>
                      <Text style={{ fontSize: 36 }}>{p.image_emoji || '📦'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[s.row, { justifyContent: 'space-between' }]}>
                        <Text style={s.marketCardCat}>{p.category}</Text>
                        <Text style={s.marketCardRating}>⭐ {p.rating} ({p.review_count})</Text>
                      </View>
                      <Text style={s.marketCardTitle} numberOfLines={2}>{p.title}</Text>
                      <Text style={s.marketCardBiz} numberOfLines={1}>By {p.business_name} • 📍 {p.location_city}</Text>
                      <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }]}>
                        <Text style={s.marketCardPrice}>Rs. {p.price.toFixed(0)} <Text style={{ fontSize: 11, color: C.sub, fontWeight: 'normal' }}>/{p.unit}</Text></Text>
                        <Text style={s.marketCardViewBtn}>Details ›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SKILL DISCOVERY (Phase 3)
// ════════════════════════════════════════════════════════════════════════════
function SkillDiscScreen({ token, onBack, onResults }) {
  const [step, setStep]       = useState(1);
  const [cat,  setCat]        = useState(null);
  const [skills, setSkills]   = useState([]);
  const [exp,  setExp]        = useState(null);
  const [hrs,  setHrs]        = useState(10);
  const [loading, setLoading] = useState(false);

  const toggleSkill = sk => setSkills(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);

  const analyze = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/skills/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ primary_category: cat.label, skills_selected: skills, experience_level: exp, available_hours_per_week: hrs, language: 'en' }),
      });
      const d = await r.json(); setLoading(false);
      if (r.ok) onResults(d); else Alert.alert('Error', d.detail || 'Please try again.');
    } catch { setLoading(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot.'); }
  };

  const stepMeta = [
    { n: 1, label: 'Category' },
    { n: 2, label: 'Skills' },
    { n: 3, label: 'Experience' },
    { n: 4, label: 'Hours' },
  ];

  return (
    <Screen>
      <NavBar
        title="Skill Discovery"
        onBack={step === 1 ? onBack : () => setStep(step - 1)}
        backLabel={step === 1 ? 'Home' : 'Back'}
      />

      {/* Step indicator */}
      <View style={s.stepRow}>
        {stepMeta.map(m => (
          <View key={m.n} style={s.stepItem}>
            <View style={[s.stepCircle, m.n < step && s.stepDone, m.n === step && s.stepActive]}>
              <Text style={[s.stepNum, (m.n <= step) && { color: '#fff' }]}>
                {m.n < step ? '✓' : m.n}
              </Text>
            </View>
            <Text style={[s.stepLabel, m.n === step && { color: C.primary, fontWeight: '700' }]}>{m.label}</Text>
          </View>
        ))}
      </View>
      {/* Progress line */}
      <View style={s.progBg}>
        <View style={[s.progFill, { width: `${((step - 1) / 3) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>

        {/* ── Step 1: Category ── */}
        {step === 1 && <>
          <Text style={s.stepTitle}>What do you love doing?</Text>
          <Text style={s.stepSub}>Choose the area that best matches your skills</Text>
          {SKILL_CATEGORIES.map(item => {
            const sel = cat?.id === item.id;
            return (
              <TouchableOpacity key={item.id} style={[s.bigCard, sel && s.bigCardSel]} onPress={() => setCat(item)} activeOpacity={0.8}>
                <Text style={s.bigCardEmoji}>{item.emoji}</Text>
                <Text style={[s.bigCardLabel, sel && { color: '#fff' }]}>{item.label}</Text>
                {sel && <Text style={s.bigCardCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          <Btn label="Next: Select Skills →" onPress={() => setStep(2)} disabled={!cat} style={{ marginTop: 16 }} />
        </>}

        {/* ── Step 2: Skills ── */}
        {step === 2 && <>
          <View style={s.badgeRow}>
            <Text style={s.badge}>{cat?.emoji} {cat?.label}</Text>
          </View>
          <Text style={s.stepTitle}>Pick your skills</Text>
          <Text style={s.stepSub}>Select all you have or want to develop — tap to toggle</Text>
          <View style={s.chipWrap}>
            {cat?.skills.map(sk => {
              const sel = skills.includes(sk);
              return (
                <TouchableOpacity key={sk} style={[s.skillChip, sel && s.skillChipSel]} onPress={() => toggleSkill(sk)} activeOpacity={0.75}>
                  <Text style={[s.skillChipText, sel && s.skillChipTextSel]}>{sel ? '✓ ' : ''}{sk}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {skills.length > 0 && (
            <View style={s.selBanner}>
              <Text style={s.selBannerText}>✓ {skills.length} skill{skills.length > 1 ? 's' : ''} selected</Text>
            </View>
          )}
          <Btn label="Next: Experience →" onPress={() => setStep(3)} disabled={skills.length === 0} style={{ marginTop: 12 }} />
        </>}

        {/* ── Step 3: Experience ── */}
        {step === 3 && <>
          <Text style={s.stepTitle}>Your experience level</Text>
          <Text style={s.stepSub}>This helps us give the most accurate advice</Text>
          {EXP_LEVELS.map(lvl => {
            const sel = exp === lvl.value;
            return (
              <TouchableOpacity key={lvl.value} style={[s.expCard, sel && s.expCardSel]} onPress={() => setExp(lvl.value)} activeOpacity={0.8}>
                <Text style={{ fontSize: 28, marginRight: 14 }}>{lvl.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.expLabel, sel && { color: '#fff' }]}>{lvl.label}</Text>
                  <Text style={[s.expDesc,  sel && { color: 'rgba(255,255,255,0.8)' }]}>{lvl.desc}</Text>
                </View>
                {sel && <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
          <Btn label="Next: Time Available →" onPress={() => setStep(4)} disabled={!exp} style={{ marginTop: 16 }} />
        </>}

        {/* ── Step 4: Hours + summary ── */}
        {step === 4 && <>
          <Text style={s.stepTitle}>Hours available per week</Text>
          <Text style={s.stepSub}>How much time can you give to your business?</Text>
          <View style={s.hrsRow}>
            {HOURS_OPT.map(h => {
              const sel = hrs === h;
              return (
                <TouchableOpacity key={h} style={[s.hrsChip, sel && s.hrsChipSel]} onPress={() => setHrs(h)} activeOpacity={0.8}>
                  <Text style={[s.hrsNum, sel && { color: '#fff' }]}>{h}</Text>
                  <Text style={[s.hrsSub, sel && { color: 'rgba(255,255,255,0.8)' }]}>hrs</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Summary */}
          <View style={s.summaryCard}>
            <Text style={s.summaryHead}>📋 Your Profile Summary</Text>
            {[['Category', cat?.label], ['Skills', skills.join(', ')], ['Experience', exp], ['Available', `${hrs} hrs / week`]].map(([k, v]) => (
              <View key={k} style={s.summaryRow}>
                <Text style={s.summaryKey}>{k}</Text>
                <Text style={s.summaryVal}>{v}</Text>
              </View>
            ))}
          </View>

          <Btn label={loading ? '' : '✨ Analyze My Skills'} loading={loading} onPress={analyze} color={C.accent} style={{ marginTop: 4 }} />
        </>}

      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SKILL RESULTS (Phase 3)
// ════════════════════════════════════════════════════════════════════════════
function SkillResScreen({ results, token, onBack, onHome }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  if (!results) return null;

  const save = async () => {
    if (!token) { Alert.alert('Login Required', 'Please log in to save your skills.'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/skills/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ primary_category: results.primary_category || '', skills_selected: results.identified_strengths || [], analysis_result: results }),
      });
      setSaving(false);
      if (r.ok) { setSaved(true); Alert.alert('Saved!', 'Your skills have been saved to your profile.'); }
      else Alert.alert('Error', 'Could not save. Please try again.');
    } catch { setSaving(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot.'); }
  };

  return (
    <Screen>
      <NavBar title="Your Results" onBack={onBack} backLabel="Edit"
        right={<TouchableOpacity onPress={onHome}><Text style={s.link}>Home</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {results.is_demo_mode && (
          <View style={s.demoBanner}>
            <Text style={s.demoBannerText}>Demo Mode — Add an OpenAI key for personalized AI analysis</Text>
          </View>
        )}

        {/* Summary */}
        <View style={s.resSummary}>
          <Text style={s.resSummaryTitle}>✨ Your Skill Summary</Text>
          <Text style={s.resSummaryText}>{results.skill_summary}</Text>
        </View>

        {/* Strengths */}
        {results.identified_strengths?.length > 0 && (
          <View style={s.resSection}>
            <Text style={s.resSectionTitle}>💪 Your Strengths</Text>
            {results.identified_strengths.map((str, i) => (
              <View key={i} style={s.bulletRow}>
                <View style={s.bullet} />
                <Text style={s.bulletText}>{str}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Opportunities */}
        {results.recommended_opportunities?.map((opp, i) => (
          <View key={i} style={s.oppCard}>
            <View style={s.oppTop}>
              <Text style={s.oppTitle}>{opp.title}</Text>
              {opp.monthly_income_potential && <View style={s.incBadge}><Text style={s.incBadgeText}>{opp.monthly_income_potential}</Text></View>}
            </View>
            <Text style={s.oppDesc}>{opp.description}</Text>
            {opp.startup_cost && <Text style={s.oppMeta}>Startup cost: {opp.startup_cost}</Text>}
            {opp.steps?.length > 0 && <>
              <Text style={s.oppStepsHead}>Steps to start:</Text>
              {opp.steps.map((st, j) => <Text key={j} style={s.oppStep}>{j + 1}. {st}</Text>)}
            </>}
          </View>
        ))}

        <View style={s.disclaimer}><Text style={s.disclaimerText}>* Estimates are educational guidelines and do not guarantee profits or business success.</Text></View>

        {saved
          ? <View style={[s.btn, { backgroundColor: C.success, marginBottom: 12 }]}><Text style={[s.btnText, { color: '#fff' }]}>✓ Skills Saved!</Text></View>
          : <Btn label={saving ? '' : '💾 Save My Skills'} loading={saving} onPress={save} style={{ marginBottom: 12 }} />}
        <Btn label="Back to Dashboard" onPress={onHome} outline />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS PROFILE (Phase 4)
// ════════════════════════════════════════════════════════════════════════════
function BizProfileScreen({ token, onBack }) {
  const [bizName, setBizName]     = useState('');
  const [tagline, setTagline]     = useState('');
  const [desc,    setDesc]        = useState('');
  const [cat,     setCat]         = useState('');
  const [city,    setCity]        = useState('');
  const [state,   setState]       = useState('');
  const [wa,      setWa]          = useState('');
  const [insta,   setInsta]       = useState('');
  const [yrs,     setYrs]         = useState('');
  const [custom,  setCustom]      = useState(false);
  const [deliver, setDeliver]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [saving,  setSaving]      = useState(false);
  const [pct,     setPct]         = useState(0);
  const [saved,   setSaved]       = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE_URL}/business/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          setBizName(d.business_name || ''); setTagline(d.tagline || ''); setDesc(d.description || '');
          setCat(d.category || ''); setCity(d.location_city || ''); setState(d.location_state || '');
          setWa(d.whatsapp_number || ''); setInsta(d.instagram_handle || '');
          setYrs(d.years_in_business ? String(d.years_in_business) : '');
          setCustom(d.accepts_custom_orders || false); setDeliver(d.delivery_available || false);
          setPct(d.profile_completeness || 0);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!bizName) { Alert.alert('Required', 'Please enter your business name.'); return; }
    setSaving(true); setSaved(false);
    try {
      const r = await fetch(`${API_BASE_URL}/business/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ business_name: bizName, tagline: tagline || null, description: desc || null, category: cat || null, location_city: city || null, location_state: state || null, whatsapp_number: wa || null, instagram_handle: insta || null, years_in_business: yrs ? parseInt(yrs) : null, accepts_custom_orders: custom, delivery_available: deliver }),
      });
      const d = await r.json(); setSaving(false);
      if (r.ok) { setPct(d.profile_completeness || 0); setSaved(true); Alert.alert('Saved!', 'Business profile updated.'); }
      else Alert.alert('Error', d.detail || 'Could not save.');
    } catch { setSaving(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot.'); }
  };

  if (loading) return <Screen><NavBar title="Business Profile" onBack={onBack} /><View style={s.center}><ActivityIndicator size="large" color={C.primary} /><Text style={[s.sub, { marginTop: 12 }]}>Loading profile...</Text></View></Screen>;

  return (
    <Screen>
      <NavBar title="Business Profile" onBack={onBack} backLabel="Home" />
      <ScrollView contentContainerStyle={s.form}>
        {/* Completeness */}
        <View style={s.pctCard}>
          <View style={s.row}>
            <Text style={s.fieldLabel}>Profile Completeness</Text>
            <Text style={[s.fieldLabel, { color: C.accent }]}>{pct}%</Text>
          </View>
          <View style={s.progBg}>
            <View style={[s.progFill, { width: `${pct}%` }]} />
          </View>
          {pct < 100 && <Text style={[s.sub, { marginTop: 6, fontSize: 11 }]}>Complete your profile to attract more customers!</Text>}
        </View>

        <Field label="Business Name *" placeholder="e.g. Priya's Kitchen" value={bizName} onChangeText={setBizName} />
        <Field label="Tagline" placeholder="e.g. Homemade with love, delivered fresh" value={tagline} onChangeText={setTagline} />
        <Field label="About Your Business" placeholder="Describe what you offer..." multiline value={desc} onChangeText={setDesc} />

        <Text style={s.fieldLabel}>Category</Text>
        <View style={s.chipWrap}>
          {BIZ_CATS.map(c => (
            <TouchableOpacity key={c} style={[s.chip, cat === c && s.chipActive]} onPress={() => setCat(c)}>
              <Text style={[s.chipText, cat === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.row2}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="City" placeholder="e.g. Jaipur" value={city} onChangeText={setCity} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="State" placeholder="e.g. Rajasthan" value={state} onChangeText={setState} />
          </View>
        </View>

        <Field label="WhatsApp Number" placeholder="+91 98765 43210" keyboardType="phone-pad" value={wa} onChangeText={setWa} />
        <Field label="Instagram Handle" placeholder="@yourhandle" autoCapitalize="none" value={insta} onChangeText={setInsta} />
        <Field label="Years in Business" placeholder="e.g. 2" keyboardType="numeric" value={yrs} onChangeText={setYrs} />

        {/* Toggles */}
        {[['Accepts Custom Orders', 'Customers can request personalised items', custom, setCustom],
          ['Delivery Available', 'You deliver to customer locations', deliver, setDeliver]].map(([lbl, desc, val, setter]) => (
          <View key={lbl} style={s.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.toggleRowLabel}>{lbl}</Text>
              <Text style={s.toggleRowDesc}>{desc}</Text>
            </View>
            <TouchableOpacity style={[s.pill, val && s.pillActive]} onPress={() => setter(!val)}>
              <Text style={[s.pillText, val && s.pillTextActive]}>{val ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Btn label={saving ? '' : (saved ? '✓ Saved!' : '💾 Save Profile')} loading={saving} onPress={save} style={{ marginTop: 20 }} />
        <Btn label="Back to Dashboard" onPress={onBack} outline style={{ marginTop: 12, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PRICING CALCULATOR (Phase 4)
// ════════════════════════════════════════════════════════════════════════════
function PricingScreen({ token, onBack }) {
  const [name,    setName]    = useState('');
  const [cat,     setCat]     = useState('Cooking & Food');
  const [matCost, setMatCost] = useState('');
  const [hrs,     setHrs]     = useState('');
  const [wage,    setWage]    = useState('50');
  const [overhead,setOverhead]= useState('10');
  const [profit,  setProfit]  = useState('30');
  const [pack,    setPack]    = useState('0');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const calc = async () => {
    if (!name || !matCost || !hrs) { Alert.alert('Required', 'Fill in product name, material cost and time.'); return; }
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${API_BASE_URL}/business/pricing-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_name: name, category: cat, material_cost: parseFloat(matCost) || 0, time_hours: parseFloat(hrs) || 1, hourly_wage: parseFloat(wage) || 50, overhead_percent: parseFloat(overhead) || 10, desired_profit_percent: parseFloat(profit) || 30, packaging_cost: parseFloat(pack) || 0, delivery_cost: 0 }),
      });
      const d = await r.json(); setLoading(false);
      if (r.ok) setResult(d); else Alert.alert('Error', d.detail || 'Calculation failed.');
    } catch { setLoading(false); Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot.'); }
  };

  const planColor = { Minimum: C.sub, Recommended: C.primary, Premium: C.accent };

  return (
    <Screen>
      <NavBar title="Pricing Calculator" onBack={onBack} backLabel="Home" />
      <ScrollView contentContainerStyle={s.form}>
        <Text style={s.formHero}>🧮 Price Your Product</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>Enter your costs — we'll calculate a fair price with profit</Text>

        <Field label="Product / Service Name *" placeholder="e.g. Tiffin Box (lunch)" value={name} onChangeText={setName} />

        <Text style={s.fieldLabel}>Category</Text>
        <View style={s.chipWrap}>
          {BIZ_CATS.map(c => (
            <TouchableOpacity key={c} style={[s.chip, cat === c && s.chipActive]} onPress={() => setCat(c)}>
              <Text style={[s.chipText, cat === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.row2}>
          <View style={{ flex: 1, marginRight: 8 }}><Field label="Material Cost (Rs.) *" placeholder="80" keyboardType="numeric" value={matCost} onChangeText={setMatCost} /></View>
          <View style={{ flex: 1 }}><Field label="Time to Make (hrs) *" placeholder="1.5" keyboardType="numeric" value={hrs} onChangeText={setHrs} /></View>
        </View>
        <View style={s.row2}>
          <View style={{ flex: 1, marginRight: 8 }}><Field label="Your Hourly Wage (Rs.)" placeholder="50" keyboardType="numeric" value={wage} onChangeText={setWage} /></View>
          <View style={{ flex: 1 }}><Field label="Packaging Cost (Rs.)" placeholder="0" keyboardType="numeric" value={pack} onChangeText={setPack} /></View>
        </View>
        <View style={s.row2}>
          <View style={{ flex: 1, marginRight: 8 }}><Field label="Overhead %" placeholder="10" keyboardType="numeric" value={overhead} onChangeText={setOverhead} /></View>
          <View style={{ flex: 1 }}><Field label="Profit Target %" placeholder="30" keyboardType="numeric" value={profit} onChangeText={setProfit} /></View>
        </View>

        <Btn label={loading ? '' : '🧮 Calculate Price'} loading={loading} onPress={calc} />

        {result && <>
          {/* Cost breakdown */}
          <View style={[s.resSection, { marginTop: 28 }]}>
            <Text style={s.resSectionTitle}>📊 Cost Breakdown</Text>
            {Object.entries(result.cost_breakdown).map(([k, v]) => (
              <View key={k} style={s.costRow}>
                <Text style={s.costKey}>{k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                <Text style={s.costVal}>Rs. {v.toFixed(2)}</Text>
              </View>
            ))}
            <View style={[s.costRow, { borderTopWidth: 2, borderTopColor: C.primary, marginTop: 4, paddingTop: 10, borderBottomWidth: 0 }]}>
              <Text style={[s.costKey, { fontWeight: 'bold', color: C.text, fontSize: 14 }]}>Total Cost</Text>
              <Text style={[s.costVal, { fontWeight: 'bold', color: C.primary, fontSize: 14 }]}>Rs. {result.total_cost.toFixed(2)}</Text>
            </View>
          </View>

          {/* Price plans */}
          <Text style={[s.resSectionTitle, { marginTop: 8 }]}>💰 Suggested Prices</Text>
          {result.price_plans.map(plan => (
            <View key={plan.label} style={[s.planCard, plan.label === 'Recommended' && s.planCardHL]}>
              <View style={s.row}>
                <Text style={[s.planLabel, { color: planColor[plan.label] }]}>{plan.label === 'Recommended' ? '⭐ ' : ''}{plan.label}</Text>
                <Text style={[s.planPrice, { color: planColor[plan.label] }]}>Rs. {plan.price.toFixed(0)}</Text>
              </View>
              <Text style={s.planDesc}>{plan.description}</Text>
            </View>
          ))}

          {/* Profit box */}
          <View style={s.profitBox}>
            <Text style={s.profitTitle}>At Recommended Price</Text>
            <View style={[s.row, { justifyContent: 'space-around', marginTop: 10 }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.profitStat}>Rs. {result.profit_at_recommended.toFixed(0)}</Text>
                <Text style={s.profitLbl}>Profit / unit</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={s.profitStat}>{result.profit_margin_percent}%</Text>
                <Text style={s.profitLbl}>Margin</Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          {result.tips?.length > 0 && (
            <View style={s.tipsBox}>
              <Text style={s.tipsTitle}>💡 Pricing Tips</Text>
              {result.tips.map((tip, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={[s.bullet, { backgroundColor: C.warn }]} />
                  <Text style={s.bulletText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.disclaimer}><Text style={s.disclaimerText}>* Estimates are educational guidelines and do not guarantee profits or business success.</Text></View>
        </>}

        <Btn label="Back to Dashboard" onPress={onBack} outline style={{ marginTop: 12, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MARKETING AI (Phase 5)
// ════════════════════════════════════════════════════════════════════════════
function MarketingAiScreen({ token, onBack }) {
  const [tab, setTab]         = useState('generator');
  const [product, setProduct] = useState('');
  const [bizName, setBizName] = useState('');
  const [platform, setPlatform] = useState('whatsapp');
  const [tone, setTone]       = useState('friendly');
  const [lang, setLang]       = useState('hinglish');
  const [offer, setOffer]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTmpl, setLoadingTmpl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (tab === 'templates' && templates.length === 0) {
      loadTemplates();
    }
  }, [tab]);

  const loadTemplates = async () => {
    setLoadingTmpl(true);
    try {
      const r = await fetch(`${API_BASE_URL}/marketing/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        setTemplates(d);
      }
    } catch {}
    setLoadingTmpl(false);
  };

  const generate = async () => {
    if (!product.trim()) {
      Alert.alert('Required', 'Please enter a product or service name to promote.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${API_BASE_URL}/marketing/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_service: product.trim(),
          business_name: bizName.trim() || undefined,
          platform,
          tone,
          offer_details: offer.trim() || undefined,
          language: lang,
        }),
      });
      const d = await r.json();
      setLoading(false);
      if (r.ok) {
        setResult(d);
      } else {
        Alert.alert('Error', d.detail || 'Could not generate copy.');
      }
    } catch {
      setLoading(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  const copyText = (content, key) => {
    setCopiedKey(key);
    Alert.alert(
      'Ready to Paste! 📋',
      'The message text has been copied. You can now paste it into WhatsApp or Instagram!'
    );
    setTimeout(() => setCopiedKey(null), 3500);
  };

  const platforms = [
    { id: 'whatsapp', label: '💬 WhatsApp' },
    { id: 'instagram', label: '📸 Instagram' },
    { id: 'facebook', label: '📘 Facebook' },
  ];

  const tones = [
    { id: 'friendly', label: '😊 Friendly' },
    { id: 'festive', label: '🪔 Festive' },
    { id: 'promotional', label: '🏷️ Discount' },
    { id: 'professional', label: '💼 Professional' },
  ];

  const languages = [
    { id: 'hinglish', label: 'Hinglish' },
    { id: 'en', label: 'English' },
    { id: 'hi', label: 'हिंदी (Hindi)' },
  ];

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Marketing AI" onBack={onBack} backLabel="Home" />

      {/* Tab Switcher */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabItem, tab === 'generator' && s.tabItemActive]}
          onPress={() => setTab('generator')}
        >
          <Text style={[s.tabText, tab === 'generator' && s.tabTextActive]}>✨ AI Generator</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabItem, tab === 'templates' && s.tabItemActive]}
          onPress={() => setTab('templates')}
        >
          <Text style={[s.tabText, tab === 'templates' && s.tabTextActive]}>📋 Ready Templates</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.form}>
        {tab === 'generator' ? (
          <>
            <Text style={s.formHero}>AI Marketing Assistant 📢</Text>
            <Text style={[s.sub, { marginBottom: 18 }]}>
              Create instant captions, WhatsApp broadcasts & status updates with emojis and hashtags.
            </Text>

            <Field
              label="Product or Service to Promote *"
              placeholder="e.g. Handmade Terracotta Diyas / Lunch Tiffin"
              value={product}
              onChangeText={setProduct}
            />

            <Field
              label="Business Name (Optional)"
              placeholder="e.g. Priya's Crafts / Sharma Tiffins"
              value={bizName}
              onChangeText={setBizName}
            />

            {/* Platform Selector */}
            <Text style={s.fieldLabel}>Target Platform</Text>
            <View style={s.chipWrap}>
              {platforms.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.chip, platform === p.id && s.chipActive]}
                  onPress={() => setPlatform(p.id)}
                >
                  <Text style={[s.chipText, platform === p.id && s.chipTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tone Selector */}
            <Text style={s.fieldLabel}>Tone of Message</Text>
            <View style={s.chipWrap}>
              {tones.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.chip, tone === t.id && s.chipActive]}
                  onPress={() => setTone(t.id)}
                >
                  <Text style={[s.chipText, tone === t.id && s.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Language Selector */}
            <Text style={s.fieldLabel}>Language</Text>
            <View style={s.chipWrap}>
              {languages.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={[s.chip, lang === l.id && s.chipActive]}
                  onPress={() => setLang(l.id)}
                >
                  <Text style={[s.chipText, lang === l.id && s.chipTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Special Offer or Discount (Optional)"
              placeholder="e.g. Flat 20% off for Diwali / Free delivery this week"
              value={offer}
              onChangeText={setOffer}
            />

            <Btn
              label={loading ? '' : '✨ Generate Posts'}
              loading={loading}
              onPress={generate}
              color={C.accent}
              style={{ marginTop: 6 }}
            />

            {/* Generated Results */}
            {result && (
              <View style={{ marginTop: 24 }}>
                <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                  <Text style={s.sectionTitle}>Generated Copies</Text>
                  {result.is_demo_mode && (
                    <Text style={[s.sub, { fontSize: 11, fontStyle: 'italic' }]}>Demo Mode</Text>
                  )}
                </View>

                {result.options.map((opt, i) => (
                  <View key={i} style={s.postCard}>
                    <View style={s.postCardHeader}>
                      <Text style={s.postCardTitle}>Option {i + 1}: {opt.title}</Text>
                      <TouchableOpacity
                        style={[s.copyBtn, copiedKey === i && s.copyBtnActive]}
                        onPress={() => copyText(opt.content, i)}
                      >
                        <Text style={[s.copyBtnText, copiedKey === i && { color: '#fff' }]}>
                          {copiedKey === i ? '✓ Copied' : '📋 Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={s.postContent}>{opt.content}</Text>

                    {opt.call_to_action ? (
                      <View style={s.ctaBox}>
                        <Text style={s.ctaText}>👉 {opt.call_to_action}</Text>
                      </View>
                    ) : null}

                    {opt.hashtags && opt.hashtags.length > 0 && (
                      <View style={[s.chipWrap, { marginTop: 10, marginBottom: 0 }]}>
                        {opt.hashtags.map((tag, tIdx) => (
                          <View key={tIdx} style={s.tagPill}>
                            <Text style={s.tagPillText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                {/* Posting Tips */}
                {result.posting_tips?.length > 0 && (
                  <View style={s.tipsBox}>
                    <Text style={s.tipsTitle}>💡 Smart Posting Tips</Text>
                    {result.posting_tips.map((tip, idx) => (
                      <View key={idx} style={s.bulletRow}>
                        <View style={[s.bullet, { backgroundColor: C.warn }]} />
                        <Text style={s.bulletText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          /* Ready Templates Tab */
          <>
            <Text style={s.formHero}>Ready-to-Use Templates 📋</Text>
            <Text style={[s.sub, { marginBottom: 18 }]}>
              Quick copy-paste templates crafted for Indian festive seasons, weekend discounts, and launches.
            </Text>

            {loadingTmpl ? (
              <View style={s.center}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={[s.sub, { marginTop: 8 }]}>Loading templates...</Text>
              </View>
            ) : (
              templates.map((tmpl) => (
                <View key={tmpl.id} style={s.postCard}>
                  <View style={s.postCardHeader}>
                    <Text style={s.postCardTitle}>{tmpl.title}</Text>
                    <TouchableOpacity
                      style={[s.copyBtn, copiedKey === tmpl.id && s.copyBtnActive]}
                      onPress={() => copyText(tmpl.template_text, tmpl.id)}
                    >
                      <Text style={[s.copyBtnText, copiedKey === tmpl.id && { color: '#fff' }]}>
                        {copiedKey === tmpl.id ? '✓ Copied' : '📋 Copy'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.postContent}>{tmpl.template_text}</Text>
                  {tmpl.suggested_tags?.length > 0 && (
                    <View style={[s.chipWrap, { marginTop: 10, marginBottom: 0 }]}>
                      {tmpl.suggested_tags.map((tag, tIdx) => (
                        <View key={tIdx} style={s.tagPill}>
                          <Text style={s.tagPillText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <Btn label="Back to Dashboard" onPress={onBack} outline style={{ marginTop: 16, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUCT DETAILS (Phase 6)
// ════════════════════════════════════════════════════════════════════════════
function ProductDetailsScreen({ product, onBack, onOrderOnline }) {
  if (!product) return null;

  const orderWhatsApp = () => {
    const msg = `Namaste ${product.entrepreneur_name}! I saw "${product.title}" on BuildHer and would like to place an order. Is it currently available?`;
    Alert.alert(
      'Order via WhatsApp 💬',
      `Opening WhatsApp chat with ${product.entrepreneur_name} (${product.whatsapp_number || '+91 98765 43210'}):\n\n"${msg}"`,
      [
        { text: 'Copy Message', onPress: () => Alert.alert('Copied!', 'Message text copied to clipboard.') },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Product Details" onBack={onBack} backLabel="Back" />
      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        {/* Product Hero */}
        <View style={s.detailHero}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>{product.image_emoji || '📦'}</Text>
        </View>

        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }]}>
          <View style={s.badgeRow}>
            <Text style={s.badge}>{product.category}</Text>
          </View>
          <Text style={s.marketCardRating}>⭐ {product.rating} ({product.review_count} reviews)</Text>
        </View>

        <Text style={s.detailTitle}>{product.title}</Text>

        <View style={s.detailPriceBox}>
          <Text style={s.detailPrice}>Rs. {product.price.toFixed(0)}</Text>
          <Text style={s.detailUnit}>/ {product.unit}</Text>
          {product.accepts_custom && (
            <View style={s.customPill}>
              <Text style={s.customPillText}>✓ Custom Orders Accepted</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[s.fieldLabel, { marginTop: 16 }]}>Description</Text>
        <Text style={s.detailDesc}>{product.description}</Text>

        {/* Entrepreneur Profile Card */}
        <View style={s.makerCard}>
          <View style={s.makerIcon}>
            <Text style={{ fontSize: 24 }}>👩‍💼</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.makerBiz}>{product.business_name}</Text>
            <Text style={s.makerName}>By {product.entrepreneur_name} • 📍 {product.location_city}</Text>
            <Text style={s.makerBadge}>🛡️ Verified Woman Artisan</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Btn
          label="🛍️ Place In-App Order (COD / UPI)"
          onPress={() => onOrderOnline && onOrderOnline(product)}
          color={C.primary}
          style={{ marginTop: 20 }}
        />
        <Btn
          label="💬 Order via WhatsApp"
          onPress={orderWhatsApp}
          color="#25D366"
          style={{ marginTop: 10 }}
        />
        <Btn
          label="Back to Marketplace"
          onPress={onBack}
          outline
          style={{ marginTop: 10, marginBottom: 32 }}
        />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MY LISTINGS (Phase 6 - Entrepreneur)
// ════════════════════════════════════════════════════════════════════════════
function MyListingsScreen({ token, onBack, onAdd, onSelect }) {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadMyListings();
  }, []);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/marketplace/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        setItems(d);
      }
    } catch {}
    setLoading(false);
  };

  const removeProduct = (id, title) => {
    Alert.alert(
      'Remove Product',
      `Are you sure you want to remove "${title}" from the marketplace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              const r = await fetch(`${API_BASE_URL}/marketplace/products/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (r.ok || r.status === 204) {
                setItems(prev => prev.filter(x => x.id !== id));
                Alert.alert('Removed', 'Product removed successfully.');
              }
            } catch {}
            setDeletingId(null);
          },
        },
      ]
    );
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="My Marketplace Items" onBack={onBack} backLabel="Home" />
      <ScrollView contentContainerStyle={s.form}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }]}>
          <View>
            <Text style={s.formHero}>Your Products 🏪</Text>
            <Text style={s.sub}>{items.length} listed in community marketplace</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={onAdd}>
            <Text style={s.addBtnText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={[s.sub, { marginTop: 8 }]}>Loading your products...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={[s.center, { paddingVertical: 40 }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
            <Text style={[s.fieldLabel, { textAlign: 'center' }]}>No items listed yet</Text>
            <Text style={[s.sub, { textAlign: 'center', marginBottom: 20 }]}>
              List your handmade products, food, or services to start getting customer orders!
            </Text>
            <Btn label="+ Add Your First Product" onPress={onAdd} color={C.accent} style={{ paddingHorizontal: 24 }} />
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={s.myListingCard}>
              <View style={[s.row, { alignItems: 'flex-start' }]}>
                <View style={s.marketCardEmoji}>
                  <Text style={{ fontSize: 32 }}>{item.image_emoji || '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.marketCardCat}>{item.category}</Text>
                  <Text style={s.marketCardTitle}>{item.title}</Text>
                  <Text style={s.marketCardPrice}>Rs. {item.price.toFixed(0)} <Text style={{ fontSize: 11, color: C.sub }}>/{item.unit}</Text></Text>
                </View>
              </View>

              <View style={[s.row, { justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10 }]}>
                <TouchableOpacity
                  style={[s.listingActionBtn, { marginRight: 8 }]}
                  onPress={() => onSelect && onSelect(item)}
                >
                  <Text style={s.listingActionText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.listingActionBtn, { backgroundColor: '#FFEBEE' }]}
                  onPress={() => removeProduct(item.id, item.title)}
                  disabled={deletingId === item.id}
                >
                  <Text style={[s.listingActionText, { color: C.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Btn label="Back to Dashboard" onPress={onBack} outline style={{ marginTop: 20, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ADD PRODUCT (Phase 6 - Entrepreneur)
// ════════════════════════════════════════════════════════════════════════════
function AddProductScreen({ token, onBack, onSuccess }) {
  const [title, setTitle]   = useState('');
  const [cat, setCat]       = useState('Cooking & Food');
  const [price, setPrice]   = useState('');
  const [unit, setUnit]     = useState('per piece');
  const [desc, setDesc]     = useState('');
  const [city, setCity]     = useState('Jaipur');
  const [custom, setCustom] = useState(true);
  const [emoji, setEmoji]   = useState('🍛');
  const [saving, setSaving] = useState(false);

  const emojiOptions = ['🍛', '👗', '🏺', '💄', '📚', '🎨', '🧁', '🧵', '🌿', '🎁', '📦'];
  const units = ['per piece', 'per kg', 'per meal', 'per stitching', 'per set', 'per hour', 'per month'];

  const saveProduct = async () => {
    if (!title.trim() || !price || !desc.trim()) {
      Alert.alert('Required', 'Please fill in title, price, and description.');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE_URL}/marketplace/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          category: cat,
          price: parseFloat(price) || 0,
          unit,
          description: desc.trim(),
          location_city: city.trim() || 'Jaipur',
          accepts_custom: custom,
          image_emoji: emoji,
        }),
      });
      const d = await r.json();
      setSaving(false);
      if (r.ok) {
        Alert.alert('Published! 🎉', 'Your product is now live on the BuildHer Marketplace!');
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', d.detail || 'Could not publish product.');
      }
    } catch {
      setSaving(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Add Marketplace Item" onBack={onBack} backLabel="Cancel" />
      <ScrollView contentContainerStyle={s.form}>
        <Text style={s.formHero}>List on Marketplace 🛍️</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>Reach thousands of local buyers in your city</Text>

        {/* Emoji Selector */}
        <Text style={s.fieldLabel}>Product Icon</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginBottom: 16 }}>
          {emojiOptions.map(em => (
            <TouchableOpacity
              key={em}
              style={[s.emojiChip, emoji === em && s.emojiChipActive]}
              onPress={() => setEmoji(em)}
            >
              <Text style={{ fontSize: 24 }}>{em}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Field label="Product / Service Title *" placeholder="e.g. Handmade Terracotta Jewelry Set" value={title} onChangeText={setTitle} />

        <Text style={s.fieldLabel}>Category</Text>
        <View style={s.chipWrap}>
          {BIZ_CATS.map(c => (
            <TouchableOpacity key={c} style={[s.chip, cat === c && s.chipActive]} onPress={() => setCat(c)}>
              <Text style={[s.chipText, cat === c && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.row2}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Price (Rs.) *" placeholder="250" keyboardType="numeric" value={price} onChangeText={setPrice} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="City" placeholder="Jaipur" value={city} onChangeText={setCity} />
          </View>
        </View>

        <Text style={s.fieldLabel}>Unit / Pricing Model</Text>
        <View style={s.chipWrap}>
          {units.map(u => (
            <TouchableOpacity key={u} style={[s.chip, unit === u && s.chipActive]} onPress={() => setUnit(u)}>
              <Text style={[s.chipText, unit === u && s.chipTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Description *" placeholder="Describe ingredients, materials, sizing, special features..." multiline value={desc} onChangeText={setDesc} />

        {/* Custom Order Toggle */}
        <View style={s.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleRowLabel}>Accept Custom Orders</Text>
            <Text style={s.toggleRowDesc}>Allow customers to request personalized variations</Text>
          </View>
          <TouchableOpacity style={[s.pill, custom && s.pillActive]} onPress={() => setCustom(!custom)}>
            <Text style={[s.pillText, custom && s.pillTextActive]}>{custom ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        </View>

        <Btn
          label={saving ? '' : '🚀 Publish Product'}
          loading={saving}
          onPress={saveProduct}
          color={C.accent}
          style={{ marginTop: 20 }}
        />
        <Btn label="Cancel" onPress={onBack} outline style={{ marginTop: 10, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PLACE ORDER (Phase 7 - Customer)
// ════════════════════════════════════════════════════════════════════════════
function PlaceOrderScreen({ product, token, onBack, onSuccess }) {
  if (!product) return null;
  const [qty, setQty]             = useState(1);
  const [address, setAddress]     = useState('');
  const [phone, setPhone]         = useState('');
  const [notes, setNotes]         = useState('');
  const [payMethod, setPayMethod] = useState('cod');
  const [placing, setPlacing]     = useState(false);

  const subtotal = product.price * qty;
  const grandTotal = subtotal;

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please enter your delivery address and contact phone number.');
      return;
    }
    setPlacing(true);
    try {
      const r = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: qty,
          delivery_address: address.trim(),
          contact_phone: phone.trim(),
          special_instructions: notes.trim() || undefined,
          payment_method: payMethod,
        }),
      });
      const d = await r.json();
      setPlacing(false);
      if (r.ok) {
        Alert.alert('Order Placed! 🎉', `Order #${d.id} placed with ${d.business_name}.`);
        onSuccess && onSuccess(d);
      } else {
        Alert.alert('Error', d.detail || 'Could not place order.');
      }
    } catch {
      setPlacing(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Place Order" onBack={onBack} backLabel="Cancel" />
      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        {/* Product Snippet */}
        <View style={s.orderSnippet}>
          <View style={s.marketCardEmoji}>
            <Text style={{ fontSize: 32 }}>{product.image_emoji || '📦'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.marketCardCat}>{product.category}</Text>
            <Text style={s.marketCardTitle}>{product.title}</Text>
            <Text style={s.marketCardBiz}>From {product.business_name} • 📍 {product.location_city}</Text>
            <Text style={[s.marketCardPrice, { marginTop: 4 }]}>Rs. {product.price.toFixed(0)} <Text style={{ fontSize: 11, color: C.sub }}>/{product.unit}</Text></Text>
          </View>
        </View>

        {/* Quantity selector */}
        <Text style={[s.fieldLabel, { marginTop: 18 }]}>Quantity</Text>
        <View style={s.qtyRow}>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
          >
            <Text style={s.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.qtyVal}>{qty}</Text>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => setQty(qty + 1)}
          >
            <Text style={s.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={[s.sub, { marginLeft: 16 }]}>Total items: {qty}</Text>
        </View>

        {/* Delivery Details */}
        <Text style={[s.fieldLabel, { marginTop: 18 }]}>Delivery Address *</Text>
        <TextInput
          style={[s.input, { height: 75, textAlignVertical: 'top' }]}
          placeholder="House/Flat No., Building, Street, Area, City"
          placeholderTextColor={C.sub}
          multiline
          value={address}
          onChangeText={setAddress}
        />

        <Field
          label="Contact Phone Number *"
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Field
          label="Special Instructions (Optional)"
          placeholder="e.g. Less spicy / Call before delivering / Gift wrap"
          value={notes}
          onChangeText={setNotes}
        />

        {/* Payment Method */}
        <Text style={s.fieldLabel}>Payment Method</Text>
        <View style={s.row}>
          <TouchableOpacity
            style={[s.toggleItem, payMethod === 'cod' && s.toggleItemActive, { marginRight: 8, borderWidth: 1, borderColor: C.border }]}
            onPress={() => setPayMethod('cod')}
          >
            <Text style={[s.toggleText, payMethod === 'cod' && s.toggleTextActive]}>💵 Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.toggleItem, payMethod === 'upi' && s.toggleItemActive, { borderWidth: 1, borderColor: C.border }]}
            onPress={() => setPayMethod('upi')}
          >
            <Text style={[s.toggleText, payMethod === 'upi' && s.toggleTextActive]}>📱 Pay with UPI</Text>
          </TouchableOpacity>
        </View>

        {/* Bill Breakdown */}
        <View style={s.billCard}>
          <Text style={s.summaryHead}>💰 Bill Summary</Text>
          <View style={s.billRow}>
            <Text style={s.billKey}>Item Total ({qty}x)</Text>
            <Text style={s.billVal}>Rs. {subtotal.toFixed(0)}</Text>
          </View>
          <View style={s.billRow}>
            <Text style={s.billKey}>Delivery Fee</Text>
            <Text style={[s.billVal, { color: C.success }]}>FREE (Local Maker)</Text>
          </View>
          <View style={[s.billRow, s.billRowTotal]}>
            <Text style={[s.billKey, { fontWeight: 'bold', color: C.text, fontSize: 16 }]}>Grand Total</Text>
            <Text style={[s.billVal, { fontWeight: 'bold', color: C.primary, fontSize: 20 }]}>Rs. {grandTotal.toFixed(0)}</Text>
          </View>
        </View>

        <Btn
          label={placing ? '' : `Confirm Order • Rs. ${grandTotal.toFixed(0)}`}
          loading={placing}
          onPress={handlePlaceOrder}
          color={C.accent}
          style={{ marginTop: 12 }}
        />
        <Btn label="Cancel" onPress={onBack} outline style={{ marginTop: 10, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ORDER CHAT & DETAILS (Phase 7 - Buyer / Seller Communication)
// ════════════════════════════════════════════════════════════════════════════
function OrderChatScreen({ order, token, userRole, onBack, onPayUPI, onReview, onSafety }) {
  if (!order) return null;
  const isEntrepreneur = userRole === 'entrepreneur';
  const [orderDetails, setOrderDetails] = useState(order);
  const [messages, setMessages]         = useState(order.messages || []);
  const [newText, setNewText]           = useState('');
  const [sending, setSending]           = useState(false);
  const [updating, setUpdating]         = useState(false);

  useEffect(() => {
    refreshOrder();
    const interval = setInterval(refreshOrder, 8000);
    return () => clearInterval(interval);
  }, []);

  const refreshOrder = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        setOrderDetails(d);
        setMessages(d.messages || []);
      }
    } catch {}
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend || newText).trim();
    if (!text) return;
    setSending(true);
    try {
      const r = await fetch(`${API_BASE_URL}/orders/${order.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      if (r.ok) {
        const msg = await r.json();
        setMessages(prev => [...prev, msg]);
        setNewText('');
      }
    } catch {}
    setSending(false);
  };

  const updateStatus = async (statusKey) => {
    setUpdating(true);
    try {
      const r = await fetch(`${API_BASE_URL}/orders/${order.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: statusKey }),
      });
      if (r.ok) {
        const updated = await r.json();
        setOrderDetails(updated);
        Alert.alert('Status Updated', `Order is now marked as "${statusKey}".`);
      }
    } catch {}
    setUpdating(false);
  };

  const statusColors = {
    pending:     { bg: '#FFF8E1', text: '#F57C00', label: '🟡 Pending' },
    accepted:    { bg: '#E3F2FD', text: '#1976D2', label: '🔵 Accepted' },
    in_progress: { bg: '#F3E5F5', text: '#7B1FA2', label: '🟣 In Progress' },
    completed:   { bg: '#E8F5E9', text: '#2E7D32', label: '🟢 Completed' },
    cancelled:   { bg: '#FFEBEE', text: '#C62828', label: '🔴 Cancelled' },
  };

  const currentStatus = statusColors[orderDetails.status] || statusColors.pending;

  const quickChips = isEntrepreneur
    ? [
        'Namaste! Order is confirmed.',
        'Preparing it fresh right now!',
        'Out for delivery soon.',
        'Delivered! Thank you 🙏',
      ]
    : [
        'Hi, is this order ready?',
        'Please deliver by evening.',
        'Where can I pay via UPI?',
        'Thank you so much! Loved it ❤️',
      ];

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar
        title={`Order #${order.id.slice(-6)}`}
        onBack={onBack}
        backLabel="Orders"
        right={
          <TouchableOpacity onPress={() => onSafety && onSafety()} style={{ padding: 4 }}>
            <Text style={{ fontSize: 13, color: C.primary, fontWeight: '700' }}>🛡️ Safety</Text>
          </TouchableOpacity>
        }
      />

      {/* Order Status Banner */}
      <View style={s.chatBanner}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={s.chatBannerTitle} numberOfLines={1}>{orderDetails.product_title}</Text>
          <View style={[s.statusPill, { backgroundColor: currentStatus.bg }]}>
            <Text style={[s.statusPillText, { color: currentStatus.text }]}>{currentStatus.label}</Text>
          </View>
        </View>

        <View style={[s.row, { justifyContent: 'space-between', marginTop: 4 }]}>
          <Text style={s.chatBannerSub}>
            {isEntrepreneur ? `Buyer: ${orderDetails.customer_name}` : `Maker: ${orderDetails.business_name}`}
          </Text>
          <Text style={s.chatBannerTotal}>Rs. {orderDetails.total_amount.toFixed(0)} ({orderDetails.payment_method.toUpperCase()})</Text>
        </View>

        {/* Customer UPI payment button if UPI order */}
        {!isEntrepreneur && orderDetails.payment_method === 'upi' && !orderDetails.payment_verified && (
          <TouchableOpacity style={s.upiPayBannerBtn} onPress={() => onPayUPI && onPayUPI(orderDetails)}>
            <Text style={s.upiPayBannerText}>📱 Pay via UPI QR • Rs. {orderDetails.total_amount.toFixed(0)} ›</Text>
          </TouchableOpacity>
        )}

        {/* Customer review button if completed */}
        {!isEntrepreneur && orderDetails.status === 'completed' && (
          <TouchableOpacity style={s.reviewBannerBtn} onPress={() => onReview && onReview(orderDetails)}>
            <Text style={s.reviewBannerText}>⭐ Rate & Review Artisan ›</Text>
          </TouchableOpacity>
        )}

        {/* Status Actions for Entrepreneur */}
        {isEntrepreneur && orderDetails.status !== 'completed' && orderDetails.status !== 'cancelled' && (
          <View style={s.statusActionRow}>
            {orderDetails.status === 'pending' && (
              <TouchableOpacity
                style={[s.statusActionBtn, { backgroundColor: '#1976D2' }]}
                onPress={() => updateStatus('accepted')}
                disabled={updating}
              >
                <Text style={s.statusActionText}>✓ Accept</Text>
              </TouchableOpacity>
            )}
            {orderDetails.status === 'accepted' && (
              <TouchableOpacity
                style={[s.statusActionBtn, { backgroundColor: '#7B1FA2' }]}
                onPress={() => updateStatus('in_progress')}
                disabled={updating}
              >
                <Text style={s.statusActionText}>⚙️ Start Making</Text>
              </TouchableOpacity>
            )}
            {orderDetails.status === 'in_progress' && (
              <TouchableOpacity
                style={[s.statusActionBtn, { backgroundColor: '#2E7D32' }]}
                onPress={() => updateStatus('completed')}
                disabled={updating}
              >
                <Text style={s.statusActionText}>✓ Mark Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Message List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m, idx) => {
          const isMe = (isEntrepreneur && m.sender_role === 'entrepreneur') || (!isEntrepreneur && m.sender_role === 'customer');
          return (
            <View
              key={m.id || idx}
              style={[
                s.chatBubbleContainer,
                isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
              ]}
            >
              <Text style={s.chatSenderName}>{isMe ? 'You' : m.sender_name}</Text>
              <View style={[s.chatBubble, isMe ? s.chatBubbleMe : s.chatBubbleOther]}>
                <Text style={[s.chatBubbleText, isMe && { color: '#fff' }]}>{m.message}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Quick Reply Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.bg }}
      >
        {quickChips.map((chip, i) => (
          <TouchableOpacity
            key={i}
            style={s.quickChip}
            onPress={() => sendMessage(chip)}
          >
            <Text style={s.quickChipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Message Input Bar */}
      <View style={s.chatInputBar}>
        <TextInput
          style={s.chatInput}
          placeholder="Type message..."
          placeholderTextColor={C.sub}
          value={newText}
          onChangeText={setNewText}
        />
        <TouchableOpacity
          style={[s.chatSendBtn, !newText.trim() && { opacity: 0.5 }]}
          onPress={() => sendMessage()}
          disabled={!newText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={s.chatSendText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MY ORDERS (Phase 7 - Customer & Entrepreneur)
// ════════════════════════════════════════════════════════════════════════════
function MyOrdersScreen({ token, userRole, onBack, onSelectOrder }) {
  const isE = userRole === 'entrepreneur';
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const d = await r.json();
        setOrders(d);
      }
    } catch {}
    setLoading(false);
  };

  const statusBadges = {
    pending:     { bg: '#FFF8E1', text: '#F57C00', label: 'Pending' },
    accepted:    { bg: '#E3F2FD', text: '#1976D2', label: 'Accepted' },
    in_progress: { bg: '#F3E5F5', text: '#7B1FA2', label: 'In Progress' },
    completed:   { bg: '#E8F5E9', text: '#2E7D32', label: 'Completed' },
    cancelled:   { bg: '#FFEBEE', text: '#C62828', label: 'Cancelled' },
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title={isE ? 'Orders Received' : 'My Orders'} onBack={onBack} backLabel="Home" />
      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }]}>
          <View>
            <Text style={s.formHero}>{isE ? 'Client Orders 📦' : 'Your Purchases 🛍️'}</Text>
            <Text style={s.sub}>{orders.length} orders total</Text>
          </View>
          <TouchableOpacity onPress={fetchOrders}>
            <Text style={s.link}>Refresh ↺</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={[s.sub, { marginTop: 8 }]}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={[s.center, { paddingVertical: 40 }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
            <Text style={[s.fieldLabel, { textAlign: 'center' }]}>No orders yet</Text>
            <Text style={[s.sub, { textAlign: 'center' }]}>
              {isE
                ? 'Orders placed by local buyers will appear here for you to accept and fulfill.'
                : 'Explore the marketplace and support women artisans by placing your first order!'}
            </Text>
          </View>
        ) : (
          orders.map(ord => {
            const st = statusBadges[ord.status] || statusBadges.pending;
            return (
              <TouchableOpacity
                key={ord.id}
                style={s.orderItemCard}
                onPress={() => onSelectOrder && onSelectOrder(ord)}
                activeOpacity={0.85}
              >
                <View style={[s.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
                  <Text style={s.orderItemId}>#{ord.id.slice(-6)}</Text>
                  <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                    <Text style={[s.statusPillText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>

                <Text style={s.orderItemTitle}>{ord.product_title}</Text>
                <Text style={s.orderItemParty}>
                  {isE ? `Buyer: ${ord.customer_name}` : `From: ${ord.business_name}`}
                </Text>

                <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }]}>
                  <Text style={s.orderItemTotal}>
                    Rs. {ord.total_amount.toFixed(0)} <Text style={{ fontSize: 11, color: C.sub }}>({ord.quantity} items)</Text>
                  </Text>
                  <Text style={s.orderChatBtn}>💬 View & Chat ›</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <Btn label="Back to Home" onPress={onBack} outline style={{ marginTop: 20, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// UPI PAYMENT (Phase 8 - Payments & Safety)
// ════════════════════════════════════════════════════════════════════════════
function UPIPaymentScreen({ order, token, onBack, onSuccess }) {
  if (!order) return null;
  const [upiData, setUpiData]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [utr, setUtr]             = useState('');
  const [verifying, setVerifying] = useState(false);
  const [paid, setPaid]           = useState(false);

  useEffect(() => {
    generateUPI();
  }, []);

  const generateUPI = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/payments/generate-upi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order_id: order.id }),
      });
      if (r.ok) {
        const d = await r.json();
        setUpiData(d);
      }
    } catch {}
    setLoading(false);
  };

  const verifyPayment = async () => {
    if (!utr.trim()) {
      Alert.alert('Required', 'Please enter the 12-digit UPI UTR reference number from your banking/UPI app.');
      return;
    }
    setVerifying(true);
    try {
      const r = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          transaction_ref: upiData?.transaction_ref || 'BH-TX',
          utr_number: utr.trim(),
        }),
      });
      const d = await r.json();
      setVerifying(false);
      if (r.ok && d.is_verified) {
        setPaid(true);
        Alert.alert('Payment Confirmed! 🎉', 'Your payment has been recorded. The seller has been notified.');
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', d.message || 'Verification failed.');
      }
    } catch {
      setVerifying(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  const copyUpiLink = () => {
    Alert.alert(
      'Pay via UPI App',
      `UPI ID: ${upiData?.payee_vpa}\nAmount: Rs. ${upiData?.amount}\nPayee: ${upiData?.payee_name}\n\nOpen Google Pay, PhonePe, or Paytm and transfer Rs. ${upiData?.amount} to the UPI ID above.`
    );
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="UPI Payment" onBack={onBack} backLabel="Cancel" />
      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        <Text style={s.formHero}>Scan & Pay via UPI 📱</Text>
        <Text style={[s.sub, { marginBottom: 16 }]}>Pay directly to the woman artisan's verified UPI account</Text>

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={[s.sub, { marginTop: 8 }]}>Generating UPI QR Code...</Text>
          </View>
        ) : (
          <>
            {/* Visual QR Card */}
            <View style={s.upiCard}>
              <View style={s.upiHeaderRow}>
                <Text style={s.upiPayeeName}>{upiData?.payee_name || order.business_name}</Text>
                <Text style={s.upiVerifiedBadge}>🛡️ Verified Artisan</Text>
              </View>

              <Text style={s.upiVpaText}>UPI ID: {upiData?.payee_vpa || 'artisan.buildher@okhdfcbank'}</Text>

              {/* Simulated QR Pattern Box */}
              <View style={s.qrBox}>
                <View style={s.qrCornerTL} />
                <View style={s.qrCornerTR} />
                <View style={s.qrCornerBL} />
                <View style={s.qrCenterIcon}>
                  <Text style={{ fontSize: 44 }}>📲</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.primary, marginTop: 4 }}>BHIM UPI</Text>
                </View>
              </View>

              <Text style={s.upiAmountBig}>Rs. {order.total_amount.toFixed(0)}</Text>
              <Text style={s.upiSubText}>Supported on all UPI apps in India</Text>

              {/* Supported apps icons */}
              <View style={[s.row, { justifyContent: 'center', gap: 10, marginTop: 12 }]}>
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                  <View key={app} style={s.upiAppBadge}>
                    <Text style={s.upiAppText}>{app}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Pay Button */}
            <Btn
              label="📱 Open UPI App / Copy UPI ID"
              onPress={copyUpiLink}
              color={C.primary}
              style={{ marginTop: 14 }}
            />

            {/* UTR Verification Box */}
            <View style={s.utrCard}>
              <Text style={s.fieldLabel}>Enter 12-Digit UTR / Ref No.</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. 324156789012"
                keyboardType="numeric"
                maxLength={12}
                value={utr}
                onChangeText={setUtr}
              />
              <Btn
                label={verifying ? '' : (paid ? '✓ Payment Verified' : 'Confirm Payment')}
                loading={verifying}
                onPress={verifyPayment}
                disabled={paid || !utr.trim()}
                color={paid ? C.success : C.accent}
                style={{ marginTop: 10 }}
              />
            </View>

            {/* Golden Safety Warning */}
            <View style={s.goldenSafetyCard}>
              <Text style={s.goldenSafetyTitle}>⚠️ Critical Safety Rule</Text>
              <Text style={s.goldenSafetyText}>
                You NEVER need to enter your UPI PIN to RECEIVE money. UPI PIN is strictly used when SENDING money. If someone asks for your PIN to send you payment, it is a scam.
              </Text>
            </View>
          </>
        )}

        <Btn label="Back to Order" onPress={onBack} outline style={{ marginTop: 8, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WRITE REVIEW (Phase 8 - Reviews & Ratings)
// ════════════════════════════════════════════════════════════════════════════
function WriteReviewScreen({ order, token, onBack, onSuccess }) {
  if (!order) return null;
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Required', 'Please write a brief comment about your experience.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/payments/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: order.product_id,
          order_id: order.id,
          rating,
          comment: comment.trim(),
        }),
      });
      const d = await r.json();
      setSubmitting(false);
      if (r.ok) {
        Alert.alert('Thank You! 💖', 'Your review helps support local women entrepreneurs and build community trust.');
        onSuccess && onSuccess();
      } else {
        Alert.alert('Error', d.detail || 'Could not submit review.');
      }
    } catch {
      setSubmitting(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Review Artisan" onBack={onBack} backLabel="Cancel" />
      <ScrollView contentContainerStyle={s.form}>
        <Text style={s.formHero}>Rate Your Experience ⭐</Text>
        <Text style={[s.sub, { marginBottom: 18 }]}>
          Your feedback encourages {order.entrepreneur_name} ({order.business_name}) and helps future buyers.
        </Text>

        <View style={s.reviewProductCard}>
          <Text style={s.reviewProductTitle}>{order.product_title}</Text>
          <Text style={s.reviewProductBiz}>Made by {order.business_name} • Order #{order.id.slice(-6)}</Text>
        </View>

        {/* 5-Star Rating Selector */}
        <Text style={[s.fieldLabel, { textAlign: 'center', marginTop: 14 }]}>Your Rating</Text>
        <View style={[s.row, { justifyContent: 'center', gap: 12, marginVertical: 12 }]}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={s.starTouch}
            >
              <Text style={{ fontSize: 36, color: star <= rating ? '#FFB300' : '#D1C4E9' }}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ textAlign: 'center', color: C.sub, fontSize: 13, marginBottom: 16 }}>
          {rating === 5 ? 'Excellent quality! 🌟' : rating === 4 ? 'Very Good! 👍' : rating === 3 ? 'Good' : 'Needs Improvement'}
        </Text>

        <Field
          label="Your Review *"
          placeholder="Share details about the quality, taste, fitting, packaging, or customer service..."
          multiline
          value={comment}
          onChangeText={setComment}
        />

        <Btn
          label={submitting ? '' : 'Submit Review 💖'}
          loading={submitting}
          onPress={submitReview}
          color={C.accent}
          style={{ marginTop: 12 }}
        />
        <Btn label="Cancel" onPress={onBack} outline style={{ marginTop: 10, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WOMEN SAFETY & TRUST CENTER (Phase 8 - Safety)
// ════════════════════════════════════════════════════════════════════════════
function SafetyScreen({ token, onBack }) {
  const [tab, setTab]           = useState('guidelines'); // 'guidelines' | 'report'
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [repUser, setRepUser]   = useState('');
  const [issueType, setIssueType] = useState('harassment');
  const [details, setDetails]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/payments/safety/guidelines`);
      if (r.ok) {
        const d = await r.json();
        setGuidelines(d);
      }
    } catch {}
    setLoading(false);
  };

  const submitReport = async () => {
    if (!repUser.trim() || !details.trim()) {
      Alert.alert('Required', 'Please enter who you are reporting and details of the incident.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE_URL}/payments/safety/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_user: repUser.trim(),
          issue_type: issueType,
          details: details.trim(),
        }),
      });
      const d = await r.json();
      setSubmitting(false);
      if (r.ok) {
        Alert.alert(
          'Report Received 🛡️',
          'Your report has been logged confidentially. Our Trust & Safety team will review and take necessary action within 2 hours.'
        );
        setRepUser('');
        setDetails('');
        setTab('guidelines');
      }
    } catch {
      setSubmitting(false);
      Alert.alert('Connection Error', 'Check your Wi-Fi / Hotspot connection.');
    }
  };

  const issueTypes = [
    { id: 'harassment', label: 'Harassment / Rude Behavior' },
    { id: 'payment_fraud', label: 'Payment Fraud / Fake UPI Slip' },
    { id: 'inappropriate_behavior', label: 'Inappropriate Inquiries' },
    { id: 'other', label: 'Other Concern' },
  ];

  return (
    <Screen statusBarBg={C.card} barStyle="dark-content">
      <NavBar title="Safety & Trust Center" onBack={onBack} backLabel="Home" />

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabItem, tab === 'guidelines' && s.tabItemActive]}
          onPress={() => setTab('guidelines')}
        >
          <Text style={[s.tabText, tab === 'guidelines' && s.tabTextActive]}>🛡️ Safety Practices</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabItem, tab === 'report' && s.tabItemActive]}
          onPress={() => setTab('report')}
        >
          <Text style={[s.tabText, tab === 'report' && s.tabTextActive]}>🚨 Report Issue</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.form} showsVerticalScrollIndicator={false}>
        {tab === 'guidelines' ? (
          <>
            {/* Emergency Helpline Banner */}
            <View style={s.helplineBanner}>
              <Text style={s.helplineTitle}>🚨 24/7 Women Helplines (India)</Text>
              <View style={[s.row, { justifyContent: 'space-between', marginTop: 8 }]}>
                <View style={s.helplinePill}>
                  <Text style={s.helplineNum}>112</Text>
                  <Text style={s.helplineLabel}>Emergency</Text>
                </View>
                <View style={s.helplinePill}>
                  <Text style={s.helplineNum}>1091</Text>
                  <Text style={s.helplineLabel}>Women SOS</Text>
                </View>
                <View style={s.helplinePill}>
                  <Text style={s.helplineNum}>1930</Text>
                  <Text style={s.helplineLabel}>Cyber Crime</Text>
                </View>
              </View>
            </View>

            <Text style={[s.formHero, { marginTop: 14 }]}>Entrepreneur Safety Guide 🌸</Text>
            <Text style={[s.sub, { marginBottom: 16 }]}>
              Built specifically for women micro-entrepreneurs running home businesses and local services.
            </Text>

            {loading ? (
              <View style={s.center}>
                <ActivityIndicator size="small" color={C.primary} />
              </View>
            ) : (
              guidelines.map((g, idx) => (
                <View key={idx} style={s.safetyCard}>
                  <View style={[s.row, { alignItems: 'center', marginBottom: 8 }]}>
                    <Text style={{ fontSize: 26, marginRight: 10 }}>{g.icon}</Text>
                    <Text style={s.safetyCardTitle}>{g.title}</Text>
                  </View>
                  <Text style={s.safetyCardDesc}>{g.description}</Text>
                  <View style={{ marginTop: 10 }}>
                    {g.bullet_points.map((pt, pIdx) => (
                      <View key={pIdx} style={s.bulletRow}>
                        <View style={[s.bullet, { backgroundColor: C.primary }]} />
                        <Text style={s.bulletText}>{pt}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          /* Report Form */
          <>
            <Text style={s.formHero}>Confidential Safety Report 🚨</Text>
            <Text style={[s.sub, { marginBottom: 18 }]}>
              Reports are handled strictly by female safety officers. Your identity remains 100% confidential.
            </Text>

            <Field
              label="Person or Phone Number Being Reported *"
              placeholder="e.g. Buyer name / +91 98765 43210"
              value={repUser}
              onChangeText={setRepUser}
            />

            <Text style={s.fieldLabel}>Nature of Issue</Text>
            <View style={{ marginBottom: 14 }}>
              {issueTypes.map(it => (
                <TouchableOpacity
                  key={it.id}
                  style={[s.issueTypeItem, issueType === it.id && s.issueTypeItemActive]}
                  onPress={() => setIssueType(it.id)}
                >
                  <Text style={[s.issueTypeText, issueType === it.id && s.issueTypeTextActive]}>
                    {issueType === it.id ? '● ' : '○ '}{it.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Field
              label="Describe What Happened *"
              placeholder="Provide as much detail as possible (date, messages sent, what occurred)..."
              multiline
              value={details}
              onChangeText={setDetails}
            />

            <Btn
              label={submitting ? '' : 'Submit Confidential Report 🛡️'}
              loading={submitting}
              onPress={submitReport}
              color={C.error}
              style={{ marginTop: 10 }}
            />
          </>
        )}

        <Btn label="Back to Home" onPress={onBack} outline style={{ marginTop: 16, marginBottom: 32 }} />
      </ScrollView>
    </Screen>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  // ── Splash ──
  splash: { flex: 1, backgroundColor: C.dark, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  splashLogoText: { fontSize: 42, fontWeight: 'bold', color: '#fff' },
  splashTitle: { fontSize: 34, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  splashSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6 },

  // ── NavBar ──
  navBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 12,
  },
  navBack: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    paddingVertical: 10,
    paddingRight: 8,
  },
  navBackArrow: {
    color: C.primary,
    fontSize: 26,
    fontWeight: '400',
    lineHeight: 26,
    marginRight: 4,
    marginTop: -2,
  },
  navBackText: {
    color: C.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 'bold',
    color: C.text,
  },
  navSide: {
    minWidth: 80,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },

  // ── Button ──
  btn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginVertical: 2 },
  btnText: { fontSize: 16, fontWeight: '700' },

  // ── Input ──
  input: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 13, fontSize: 15, color: C.text },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },

  // ── Form / layout ──
  form: { padding: 20, paddingBottom: 40 },
  formHero: { fontSize: 24, fontWeight: 'bold', color: C.primary, marginBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  row2: { flexDirection: 'row' },

  // ── Typography ──
  sub: { fontSize: 14, color: C.sub, lineHeight: 20 },
  link: { fontSize: 14, color: C.primary, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: C.text, marginBottom: 14 },

  // ── Chips ──
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 14 },
  chip: { backgroundColor: C.light, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  // ── Toggle (register role) ──
  toggle: { flexDirection: 'row', backgroundColor: C.light, borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleItemActive: { backgroundColor: C.primary },
  toggleText: { color: C.primary, fontWeight: '700', fontSize: 14 },
  toggleTextActive: { color: '#fff' },

  // ── Onboarding ──
  onboardCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  onboardCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.light, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  onboardTitle: { fontSize: 26, fontWeight: 'bold', color: C.text, textAlign: 'center', marginBottom: 12 },
  onboardDesc: { fontSize: 15, color: C.sub, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', marginTop: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border, marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: C.accent },

  // ── Welcome ──
  welcomeHero: { backgroundColor: C.primary, padding: 28, paddingTop: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  welcomeTitle: { fontSize: 30, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  welcomeSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  roleCard: { backgroundColor: C.card, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: C.border, elevation: 1 },
  roleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  roleTitle: { fontSize: 16, fontWeight: 'bold', color: C.text, marginBottom: 3 },
  roleSub: { fontSize: 12, color: C.sub, lineHeight: 18 },

  // ── Home ──
  homeHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  homeGreeting: { fontSize: 20, fontWeight: 'bold', color: C.text },
  homeRole: { fontSize: 12, color: C.primary, marginTop: 2, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#FFEBEE', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  logoutText: { color: C.error, fontWeight: '700', fontSize: 13 },
  heroBanner: { backgroundColor: C.primary, margin: 20, borderRadius: 18, padding: 22 },
  heroTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 },
  actionCard: { width: (SW - 44) / 2, backgroundColor: C.card, borderRadius: 16, padding: 16, margin: 5, borderWidth: 1, borderColor: C.border, elevation: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: C.text, marginBottom: 3 },
  actionSub: { fontSize: 11, color: C.sub, lineHeight: 16, marginBottom: 8 },
  actionTag: { fontSize: 12, fontWeight: '700' },
  actionTagSoon: { fontSize: 11, color: C.sub, fontStyle: 'italic' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14 },
  catCard: { width: (SW - 44) / 3, backgroundColor: C.card, borderRadius: 14, padding: 16, margin: 5, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  catLabel: { fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'center' },

  // ── Skill Discovery ──
  stepRow: { flexDirection: 'row', backgroundColor: C.card, paddingVertical: 12, paddingHorizontal: 10, justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: C.border },
  stepItem: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.light, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepActive: { backgroundColor: C.accent },
  stepDone: { backgroundColor: C.success },
  stepNum: { fontSize: 12, fontWeight: '700', color: C.primary },
  stepLabel: { fontSize: 10, color: C.sub, fontWeight: '500' },
  progBg: { height: 5, backgroundColor: C.light },
  progFill: { height: 5, backgroundColor: C.accent },
  stepContent: { padding: 20, paddingBottom: 64 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: C.text, marginBottom: 6 },
  stepSub: { fontSize: 14, color: C.sub, lineHeight: 20, marginBottom: 20 },
  bigCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: C.border, elevation: 1 },
  bigCardSel: { backgroundColor: C.primary, borderColor: C.primary, elevation: 4 },
  bigCardEmoji: { fontSize: 28, marginRight: 16 },
  bigCardLabel: { fontSize: 16, fontWeight: '600', color: C.text, flex: 1 },
  bigCardCheck: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  badgeRow: { flexDirection: 'row', marginBottom: 10 },
  badge: { backgroundColor: C.light, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, color: C.primary, fontWeight: '700', fontSize: 14, overflow: 'hidden' },
  skillChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 2, borderColor: C.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, marginBottom: 10, elevation: 1 },
  skillChipSel: { backgroundColor: C.primary, borderColor: C.primary, elevation: 3 },
  skillChipText: { fontSize: 14, fontWeight: '600', color: C.text },
  skillChipTextSel: { color: '#fff' },
  selBanner: { backgroundColor: C.successBg, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#A5D6A7' },
  selBannerText: { color: C.success, fontWeight: '700', fontSize: 14 },
  expCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: C.border, elevation: 1 },
  expCardSel: { backgroundColor: C.primary, borderColor: C.primary, elevation: 4 },
  expLabel: { fontSize: 17, fontWeight: 'bold', color: C.text },
  expDesc: { fontSize: 13, color: C.sub, marginTop: 3 },
  hrsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  hrsChip: { alignItems: 'center', backgroundColor: C.card, borderWidth: 2, borderColor: C.border, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginRight: 10, marginBottom: 10, minWidth: 76, elevation: 1 },
  hrsChipSel: { backgroundColor: C.accent, borderColor: C.accent, elevation: 4 },
  hrsNum: { fontSize: 20, fontWeight: 'bold', color: C.primary },
  hrsSub: { fontSize: 11, color: C.sub, marginTop: 2 },
  summaryCard: { backgroundColor: C.card, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: C.border, elevation: 2, marginBottom: 20 },
  summaryHead: { fontSize: 15, fontWeight: 'bold', color: C.primary, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0EBF8' },
  summaryKey: { fontSize: 13, color: C.sub, fontWeight: '500' },
  summaryVal: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },

  // ── Results ──
  demoBanner: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FFE082' },
  demoBannerText: { fontSize: 12, color: '#795548', textAlign: 'center', lineHeight: 18 },
  resSummary: { backgroundColor: C.primary, borderRadius: 16, padding: 20, marginBottom: 20 },
  resSummaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  resSummaryText: { fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 22 },
  resSection: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  resSectionTitle: { fontSize: 16, fontWeight: 'bold', color: C.text, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginTop: 6, marginRight: 10 },
  bulletText: { fontSize: 14, color: C.text, flex: 1, lineHeight: 22 },
  oppCard: { backgroundColor: C.card, borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border, elevation: 1 },
  oppTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  oppTitle: { fontSize: 15, fontWeight: 'bold', color: C.primary, flex: 1, marginRight: 8 },
  incBadge: { backgroundColor: C.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  incBadgeText: { fontSize: 11, color: C.success, fontWeight: '700' },
  oppDesc: { fontSize: 13, color: C.sub, lineHeight: 20, marginBottom: 8 },
  oppMeta: { fontSize: 12, color: C.text, fontWeight: '600', marginBottom: 10 },
  oppStepsHead: { fontSize: 13, fontWeight: 'bold', color: C.text, marginBottom: 6 },
  oppStep: { fontSize: 12, color: C.sub, lineHeight: 20, marginBottom: 2 },
  disclaimer: { backgroundColor: C.warnBg, borderRadius: 10, padding: 12, marginBottom: 16 },
  disclaimerText: { fontSize: 11, color: C.warn, lineHeight: 16, fontStyle: 'italic' },

  // ── Business Profile ──
  pctCard: { backgroundColor: C.light, borderRadius: 12, padding: 16, marginBottom: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  toggleRowLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  toggleRowDesc: { fontSize: 12, color: C.sub, marginTop: 2 },
  pill: { backgroundColor: C.light, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  pillActive: { backgroundColor: C.primary },
  pillText: { fontSize: 13, fontWeight: '700', color: C.primary },
  pillTextActive: { color: '#fff' },

  // ── Pricing ──
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  costKey: { fontSize: 13, color: C.sub },
  costVal: { fontSize: 13, color: C.text, fontWeight: '500' },
  planCard: { backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  planCardHL: { borderColor: C.primary, borderWidth: 2, backgroundColor: C.light },
  planLabel: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  planPrice: { fontSize: 20, fontWeight: 'bold' },
  planDesc: { fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 18 },
  profitBox: { backgroundColor: C.successBg, borderRadius: 12, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: '#A5D6A7' },
  profitTitle: { fontSize: 14, fontWeight: 'bold', color: C.success, textAlign: 'center' },
  profitStat: { fontSize: 22, fontWeight: 'bold', color: C.success },
  profitLbl: { fontSize: 11, color: C.sub, marginTop: 2 },
  tipsBox: { backgroundColor: C.warnBg, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FFCC80' },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: C.warn, marginBottom: 10 },

  // ── Marketing AI (Phase 5) ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.light,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: C.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
  tabTextActive: {
    color: '#fff',
  },
  postCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  postCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: C.primary,
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    backgroundColor: C.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copyBtnActive: {
    backgroundColor: C.success,
  },
  copyBtnText: {
    color: C.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  postContent: {
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
    backgroundColor: '#FAF8FC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFEBF5',
  },
  ctaBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: C.accentBg,
    borderRadius: 8,
  },
  ctaText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  tagPill: {
    backgroundColor: '#F0EBF8',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 6,
  },
  tagPillText: {
    color: C.primary,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Marketplace (Phase 6) ──
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    color: C.text,
  },
  marketCard: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  marketCardEmoji: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  marketCardCat: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  marketCardRating: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  marketCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.text,
    marginTop: 2,
    lineHeight: 20,
  },
  marketCardBiz: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  marketCardPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.primary,
  },
  marketCardViewBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: C.accent,
  },
  detailHero: {
    backgroundColor: C.light,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: C.text,
    marginTop: 8,
    marginBottom: 10,
    lineHeight: 28,
  },
  detailPriceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: C.primary,
  },
  detailUnit: {
    fontSize: 13,
    color: C.sub,
    marginLeft: 4,
    fontWeight: '600',
  },
  customPill: {
    backgroundColor: C.successBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  customPillText: {
    fontSize: 10,
    color: C.success,
    fontWeight: '700',
  },
  detailDesc: {
    fontSize: 14,
    color: C.text,
    lineHeight: 22,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  makerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#D1C4E9',
  },
  makerIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  makerBiz: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.text,
  },
  makerName: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  makerBadge: {
    fontSize: 11,
    color: C.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: C.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  myListingCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  listingActionBtn: {
    backgroundColor: C.light,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  listingActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  emojiChipActive: {
    borderColor: C.primary,
    backgroundColor: C.light,
    borderWidth: 2,
  },

  // ── Orders & Chat (Phase 7) ──
  ordersHeaderBtn: {
    backgroundColor: '#F3EEF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  ordersHeaderText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  orderSnippet: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C.primary,
  },
  qtyVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.text,
    paddingHorizontal: 20,
  },
  billCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    padding: 16,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  billRowTotal: {
    borderTopWidth: 1.5,
    borderTopColor: C.border,
    marginTop: 6,
    paddingTop: 10,
  },
  billKey: {
    fontSize: 13,
    color: C.sub,
  },
  billVal: {
    fontSize: 14,
    color: C.text,
    fontWeight: '600',
  },
  chatBanner: {
    backgroundColor: C.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  chatBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.text,
    flex: 1,
    marginRight: 8,
  },
  chatBannerSub: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  chatBannerTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.primary,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  statusActionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  chatBubbleContainer: {
    marginBottom: 10,
  },
  chatSenderName: {
    fontSize: 11,
    color: C.sub,
    marginBottom: 3,
    marginHorizontal: 4,
  },
  chatBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleMe: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 2,
  },
  chatBubbleOther: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 2,
  },
  chatBubbleText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  quickChip: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickChipText: {
    fontSize: 12,
    color: C.primary,
    fontWeight: '600',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FAF8FC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    marginRight: 8,
  },
  chatSendBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chatSendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  orderItemCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  orderItemId: {
    fontSize: 13,
    fontWeight: 'bold',
    color: C.sub,
  },
  orderItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.text,
    marginBottom: 2,
  },
  orderItemParty: {
    fontSize: 12,
    color: C.sub,
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.primary,
  },
  orderChatBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: C.accent,
  },

  // ── Phase 8: Safety & Payments ──
  safetyHeaderBtn: {
    backgroundColor: C.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  safetyHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  upiPayBannerBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  upiPayBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBannerBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  reviewBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  upiCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginBottom: 16,
  },
  upiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  upiPayeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: C.text,
  },
  upiVerifiedBadge: {
    fontSize: 12,
    color: C.success,
    fontWeight: '700',
    backgroundColor: C.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upiVpaText: {
    fontSize: 13,
    color: C.sub,
    marginBottom: 16,
    fontWeight: '500',
  },
  qrBox: {
    width: 200,
    height: 200,
    backgroundColor: '#FAF8FC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: C.primary,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: C.primary,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: C.primary,
  },
  qrCenterIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiAmountBig: {
    fontSize: 28,
    fontWeight: 'bold',
    color: C.primary,
    marginTop: 8,
  },
  upiSubText: {
    fontSize: 12,
    color: C.sub,
    marginTop: 2,
  },
  upiAppBadge: {
    backgroundColor: C.light,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.primary,
  },
  utrCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  goldenSafetyCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
    marginBottom: 16,
  },
  goldenSafetyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B78103',
    marginBottom: 6,
  },
  goldenSafetyText: {
    fontSize: 13,
    color: '#5D4037',
    lineHeight: 18,
  },
  reviewProductCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  reviewProductTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.text,
  },
  reviewProductBiz: {
    fontSize: 12,
    color: C.sub,
    marginTop: 4,
  },
  starTouch: {
    padding: 6,
  },
  helplineBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 16,
  },
  helplineTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.error,
    marginBottom: 4,
  },
  helplinePill: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  helplineNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: C.error,
  },
  helplineLabel: {
    fontSize: 11,
    color: C.sub,
    marginTop: 2,
  },
  safetyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 1,
  },
  safetyCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: C.text,
    flex: 1,
  },
  safetyCardDesc: {
    fontSize: 13,
    color: C.sub,
    lineHeight: 18,
  },
  issueTypeItem: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  issueTypeItemActive: {
    borderColor: C.error,
    backgroundColor: '#FFEBEE',
  },
  issueTypeText: {
    fontSize: 13,
    color: C.text,
    fontWeight: '500',
  },
  issueTypeTextActive: {
    color: C.error,
    fontWeight: 'bold',
  },
});
