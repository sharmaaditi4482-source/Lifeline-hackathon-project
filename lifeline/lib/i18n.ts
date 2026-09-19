export type Language = "en" | "hi";

export const translations = {
  en: {
    // Top Nav & Brand
    brand_name: "LIFELINE",
    brand_subtitle: "ENGINE",
    nav_how_it_works: "How It Works",
    nav_matching_engine: "Matching Engine",
    nav_safety: "Safety Check",
    nav_analytics: "Analytics",
    nav_for_donors: "For Donors",
    nav_about_us: "About Us",
    login_btn: "Login",
    logout_btn: "Logout",

    // Hero Section
    hero_badge: "Real-Time Emergency Transfusion Network",
    hero_title_part1: "Every Second Counts When",
    hero_title_part2: "Blood is Needed.",
    hero_description: "LifeLine connects hospitals, donors, and blood banks through live tracking when every second matters.",
    hero_cta_emergency: "Find Blood Match →",
    hero_cta_donor: "Volunteer as Donor",
    hero_cta_bank: "Manage Blood Bank",
    hero_trust_secure: "Secure & Verified",
    hero_trust_realtime: "Real-time Matching",
    hero_trust_save: "Save More Lives",

    // Live Ticker & Stats
    ticker_live: "LIVE UPDATES",
    ticker_view_all: "View All →",
    stat_units_matched: "Units Matched Today",
    stat_active_donors: "Active Donors",
    stat_hospitals_connected: "Hospitals Connected",
    stat_avg_response: "Avg Response Time",

    // How It Works
    hiw_title: "How LifeLine Works",
    hiw_sub: "From SOS alert to transfusion delivery in 3 deterministic steps.",
    hiw_step1_title: "1. Hospital SOS Alert",
    hiw_step1_desc: "Emergency desks raise urgent blood requests specifying ABO/Rh group, units, and clinical urgency.",
    hiw_step2_title: "2. 4-Vector Smart Match",
    hiw_step2_desc: "Scoring engine ranks volunteer donors and bank reserves using Urgency, Haversine Proximity, Expiry, and Reliability.",
    hiw_step3_title: "3. First-Confirmed Lock",
    hiw_step3_desc: "First confirmed donor or reserve is securely locked, auto-releasing secondary candidates back into the pool.",

    // Matching Engine Sandbox
    me_title: "Deterministic 4-Factor Matching Engine",
    me_sub: "Experience the real-time scoring algorithm that powers LifeLine.",
    me_formula_label: "Scoring Formula:",

    // Safety Matrix
    safety_title: "Zero-Tolerance ABO/Rh Biological Safety",
    safety_sub: "Universal donor rules and medical safety gates evaluated instantly before scoring.",

    // Donor Portal & Registration Form
    donor_portal_title: "Volunteer Donor Network",
    donor_portal_sub: "Join Delhi-NCR's verified blood network. Save lives during critical shortages.",
    donor_name_label: "Full Name *",
    donor_name_ph: "e.g. Dr. Ananya Verma",
    donor_phone_label: "Mobile Number (WhatsApp/SMS) *",
    donor_phone_ph: "+91 98765 43210",
    donor_blood_group_label: "Blood Group *",
    donor_location_label: "Location / City *",
    donor_location_ph: "e.g. Safdarjung Enclave, Delhi",
    donor_last_donation_label: "Last Donation Date (for 90-day cooldown)",
    donor_submit_btn: "Register as Active Donor →",
    donor_lives_saved: "Lives Saved",
    donor_verified: "Verified Donor",
    donor_cooldown_active: "Cooldown Active",
    donor_eligible: "Eligible to Donate",

    // Hospital Dashboard & Matching
    hospital_dash_title: "Hospital Command Desk",
    hospital_dash_sub: "Raise emergency blood requests with multi-factor matching, or manage facility reserve inventory.",
    tab_request: "🩸 Emergency Matching",
    tab_inventory: "🏥 Blood Inventory",
    hosp_name_label: "Hospital / Facility Name",
    hosp_blood_group_label: "Blood Group Needed *",
    hosp_units_label: "Units Required",
    hosp_urgency_label: "Urgency Tier",
    hosp_urgency_critical: "CRITICAL (< 30 min)",
    hosp_urgency_high: "HIGH (< 2 hours)",
    hosp_urgency_medium: "MEDIUM (< 6 hours)",
    hosp_find_matches_btn: "Find Best Matches →",
    hosp_notify_btn: "📱 Notify Matched Donors",
    hosp_confirm_lock: "Confirm & Lock",
    hosp_locked_badge: "Locked ✓",
    hosp_mark_completed: "Mark Completed ✓",
    hosp_verify_donor: "Verify Donor ✅",
    hosp_completed_badge: "Completed (🩸 +1 Life Saved)",

    // Predictive Shortage
    shortage_title: "Predictive 7-Day Shortage Alert",
    shortage_sub: "Calculated from real 7-day emergency request velocity vs. live reserves",
  },
  hi: {
    // Top Nav & Brand
    brand_name: "लाइफ़लाइन",
    brand_subtitle: "इंजन",
    nav_how_it_works: "यह कैसे काम करता है",
    nav_matching_engine: "मैचिंग इंजन",
    nav_safety: "सुरक्षा जांच",
    nav_analytics: "एनालिटिक्स",
    nav_for_donors: "रक्तदाताओं के लिए",
    nav_about_us: "हमारे बारे में",
    login_btn: "लॉग इन",
    logout_btn: "लॉग आउट",

    // Hero Section
    hero_badge: "रीयल-टाइम आपातकालीन रक्त संचार नेटवर्क",
    hero_title_part1: "जब रक्त की आवश्यकता हो,",
    hero_title_part2: "हर सेकंड कीमती है।",
    hero_description: "लाइफ़लाइन आपातकालीन स्थिति में अस्पतालों, रक्तदाताओं और ब्लड बैंकों को लाइव ट्रैकिंग से तुरंत जोड़ता है।",
    hero_cta_emergency: "रक्त मैच खोजें →",
    hero_cta_donor: "रक्तदाता पंजीकरण",
    hero_cta_bank: "ब्लड बैंक प्रबंधन",
    hero_trust_secure: "सुरक्षित एवं सत्यापित",
    hero_trust_realtime: "रीयल-टाइम मैचिंग",
    hero_trust_save: "अधिक जीवन बचाएं",

    // Live Ticker & Stats
    ticker_live: "लाइव अपडेट्स",
    ticker_view_all: "सभी देखें →",
    stat_units_matched: "आज मैच की गई यूनिट्स",
    stat_active_donors: "सक्रिय रक्तदाता",
    stat_hospitals_connected: "जुड़े हुए अस्पताल",
    stat_avg_response: "औसत प्रतिक्रिया समय",

    // How It Works
    hiw_title: "लाइफ़लाइन कैसे काम करता है",
    hiw_sub: "SOS अलर्ट से लेकर रक्त आपूर्ति तक मात्र 3 पारदर्शी चरणों में।",
    hiw_step1_title: "1. अस्पताल SOS अलर्ट",
    hiw_step1_desc: "अस्पताल आपातकालीन रक्त समूह, आवश्यक यूनिट और गंभीरता स्तर के साथ तत्काल अनुरोध दर्ज करते हैं।",
    hiw_step2_title: "2. 4-फैक्टर स्मार्ट मैचिंग",
    hiw_step2_desc: "मैचिंग इंजन गंभीरता, निकटता दूरी, समाप्ति तिथि और विश्वसनीयता के आधार पर सर्वश्रेष्ठ विकल्प चुनता है।",
    hiw_step3_title: "3. पुष्टि एवं तुरंत लॉक",
    hiw_step3_desc: "प्रथम पुष्टि होते ही रक्त सुरक्षित रूप से लॉक हो जाता है और शेष उम्मीदवार पुनः उपलब्ध हो जाते हैं।",

    // Matching Engine Sandbox
    me_title: "4-फैक्टर स्मार्ट मैचिंग इंजन",
    me_sub: "लाइफ़लाइन को संचालित करने वाले रीयल-टाइम स्कोरिंग एल्गोरिदम का अनुभव करें।",
    me_formula_label: "स्कोरिंग सूत्र:",

    // Safety Matrix
    safety_title: "ABO/Rh जैविक सुरक्षा जांच",
    safety_sub: "सार्वभौमिक रक्तदाता नियम और 90-दिवसीय चिकित्सीय सुरक्षा मैचिंग से पहले जांची जाती है।",

    // Donor Portal & Registration Form
    donor_portal_title: "स्वयंसेवी रक्तदाता नेटवर्क",
    donor_portal_sub: "दिल्ली-एनसीआर के सत्यापित रक्त नेटवर्क से जुड़ें। आपातकाल में जीवन बचाएं।",
    donor_name_label: "पूरा नाम *",
    donor_name_ph: "जैसे डॉ. अनन्या वर्मा",
    donor_phone_label: "मोबाइल नंबर (व्हाट्सएप/एसएमएस) *",
    donor_phone_ph: "+91 98765 43210",
    donor_blood_group_label: "रक्त समूह (Blood Group) *",
    donor_location_label: "स्थान / शहर *",
    donor_location_ph: "जैसे सफदरजंग एन्क्लेव, दिल्ली",
    donor_last_donation_label: "अंतिम रक्तदान तिथि (90-दिन अंतराल के लिए)",
    donor_submit_btn: "सक्रिय रक्तदाता के रूप में जुड़ें →",
    donor_lives_saved: "जीवन बचाए",
    donor_verified: "सत्यापित रक्तदाता",
    donor_cooldown_active: "अंतराल सक्रिय (कूलडाउन)",
    donor_eligible: "रक्तदान के लिए पात्र",

    // Hospital Dashboard & Matching
    hospital_dash_title: "अस्पताल कमांड डेस्क",
    hospital_dash_sub: "मल्टी-फैक्टर मैचिंग के साथ आपातकालीन रक्त अनुरोध उठाएं, या अस्पताल भंडार प्रबंधित करें।",
    tab_request: "🩸 आपातकालीन मैचिंग",
    tab_inventory: "🏥 रक्त भंडार (Inventory)",
    hosp_name_label: "अस्पताल / केंद्र का नाम",
    hosp_blood_group_label: "आवश्यक रक्त समूह *",
    hosp_units_label: "आवश्यक यूनिट",
    hosp_urgency_label: "आपातकाल स्तर",
    hosp_urgency_critical: "अति गंभीर (< 30 मिनट)",
    hosp_urgency_high: "उच्च (< 2 घंटे)",
    hosp_urgency_medium: "मध्यम (< 6 घंटे)",
    hosp_find_matches_btn: "सर्वश्रेष्ठ मैच खोजें →",
    hosp_notify_btn: "📱 रक्तदाताओं को एसएमएस भेजें",
    hosp_confirm_lock: "पुष्टि और लॉक करें",
    hosp_locked_badge: "लॉक किया गया ✓",
    hosp_mark_completed: "सफल रक्तदान दर्ज करें ✓",
    hosp_verify_donor: "रक्तदाता सत्यापित करें ✅",
    hosp_completed_badge: "पूर्ण (🩸 +1 जीवन बचाया)",

    // Predictive Shortage
    shortage_title: "पूर्वानुमानित 7-दिवसीय कमी चेतावनी",
    shortage_sub: "वास्तविक 7-दिवसीय आपातकालीन मांग गति बनाम वर्तमान भंडार से गणना की गई",
  },
};

export type TranslationKey = keyof typeof translations.en;
