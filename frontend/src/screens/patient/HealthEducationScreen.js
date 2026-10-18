import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, Animated, ImageBackground, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import Header from '../../components/ui/Header';

const EDUCATION_TOPICS = [
  {
    id: '1',
    title: 'Managing Seasonal Flu',
    category: 'Seasonal',
    icon: 'thermometer',
    color: colors.orange,
    time: '3 min read',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    content: 'Seasonal flu (influenza) is a contagious respiratory illness. Common symptoms include fever, cough, sore throat, runny nose, and body aches.\n\n🛡️ Prevention Tips:\n• Wash hands frequently\n• Avoid close contact with sick people\n• Stay home when sick\n• Eat immunity-boosting foods (Vitamin C, zinc)\n• Cover your mouth when coughing\n\n💊 Treatment:\n• Rest and stay hydrated\n• Paracetamol for fever/aches\n• Consult a doctor if symptoms worsen after 3 days',
    link: 'https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)',
    trending: false,
  },
  {
    id: '2',
    title: 'Nutrition during Pregnancy',
    category: 'Maternal',
    icon: 'woman',
    color: '#F472B6',
    time: '5 min read',
    image: 'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=600&q=80',
    content: 'Good nutrition during pregnancy supports baby development and maternal health.\n\n✅ Essential Nutrients:\n• Folic acid — prevents neural tube defects\n• Iron — prevents anemia\n• Calcium — strengthens bones\n• Protein — supports baby growth\n\n🍽️ Foods to Include:\n• Leafy greens (spinach, methi)\n• Legumes (dal, beans, lentils)\n• Dairy (milk, curd, paneer)\n• Fruits (banana, papaya, guava)\n\n⚠️ Foods to Avoid:\n• Raw/undercooked meat\n• Excess caffeine',
    link: 'https://www.nhp.gov.in/healthlyliving/nutrition-in-pregnancy',
    trending: false,
  },
  {
    id: '3',
    title: 'Water & Hygiene Basics',
    category: 'Hygiene',
    icon: 'water',
    color: colors.cyan,
    time: '2 min read',
    image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600&q=80',
    content: 'Safe water and proper hygiene prevent many deadly diseases including cholera, typhoid, and diarrhea.\n\n💧 Water Safety:\n• Boil water before drinking if source is unsafe\n• Use chlorine tablets or water purifier\n• Store water in clean, covered containers\n\n🧼 Hand Hygiene:\n• Wash hands before eating and after toilet use\n• Use soap and clean water for at least 20 seconds\n\n🚽 Sanitation:\n• Use toilet facilities — open defecation causes disease\n• Dispose garbage properly to avoid mosquito breeding',
    link: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water',
    trending: false,
  },
  {
    id: '4',
    title: 'Preventing Dengue This Monsoon',
    category: 'Alert',
    icon: 'warning',
    color: '#EF4444',
    time: '4 min read',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
    content: 'Dengue is a mosquito-borne viral disease spread by Aedes mosquitoes that bite during daytime.\n\n⚠️ Warning Signs:\n• High fever (104°F / 40°C)\n• Severe headache and eye pain\n• Skin rash (appears 2-5 days after fever)\n• Muscle and joint pain\n\n🦟 Prevention:\n• Remove stagnant water from coolers, pots, tyres\n• Use mosquito repellent during the day\n• Wear full-sleeve clothes\n• Use mosquito nets while sleeping\n\n🏥 See a doctor IMMEDIATELY if:\n• Bleeding from gums or nose\n• Severe abdominal pain\n• Difficulty breathing',
    link: 'https://www.mohfw.gov.in/disease/dengue',
    trending: true,
  },
];

const HealthEducationScreen = ({ navigation }) => {
  const [openTopic, setOpenTopic] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(EDUCATION_TOPICS.findIndex(t => t.trending));
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
      setFeaturedIndex(prev => (prev + 1) % EDUCATION_TOPICS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const featured = EDUCATION_TOPICS[featuredIndex];

  const handleOpenLink = (url) => { Linking.openURL(url).catch(() => {}); };

  return (
    <View style={styles.container}>
      <Header title="Health Hub" subtitle="Learn & Prevent" rightIcon="menu" onRightPress={() => navigation.toggleDrawer()} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={true}
      >

        {/* Dynamic Featured Banner with Image */}
        <Animated.View style={[styles.featuredWrapper, { opacity: fadeAnim }]}>
          <ImageBackground
            source={{ uri: featured.image }}
            style={styles.featuredBanner}
            imageStyle={styles.featuredBannerImg}
          >
            {/* Dark gradient overlay */}
            <View style={styles.bannerOverlay}>
              <View style={styles.featuredTop}>
                <View style={[styles.badge, { backgroundColor: featured.color + '40' }]}>
                  <Text style={[styles.badgeText, { color: featured.color }]}>
                    {featured.trending ? '🔴 TRENDING IN YOUR AREA' : '📌 FEATURED TOPIC'}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {EDUCATION_TOPICS.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => setFeaturedIndex(i)}>
                      <View style={[styles.dot, i === featuredIndex && { backgroundColor: featured.color, width: 18 }]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Text style={styles.featuredTitle}>{featured.title}</Text>
              <Text style={styles.featuredDesc} numberOfLines={2}>{featured.content.split('\n')[0]}</Text>
              <View style={styles.featuredActions}>
                <TouchableOpacity style={[styles.readBtn, { borderColor: featured.color }]} onPress={() => setOpenTopic(featured)}>
                  <Ionicons name="book-outline" size={14} color={featured.color} />
                  <Text style={[styles.readBtnText, { color: featured.color }]}>Read Article</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={() => handleOpenLink(`https://www.youtube.com/results?search_query=${encodeURIComponent(featured.title + ' india health')}`)}>
                  <Ionicons name="play-circle" size={14} color="#fff" />
                  <Text style={styles.playText}>Watch Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        <Text style={styles.sectionTitle}>Browse Topics</Text>
        
        {EDUCATION_TOPICS.map(topic => (
          <TouchableOpacity key={topic.id} activeOpacity={0.85} onPress={() => setOpenTopic(topic)}>
            <View style={styles.topicCard}>
              {/* Topic Thumbnail */}
              <Image source={{ uri: topic.image }} style={styles.topicThumb} />
              <View style={styles.topicInfo}>
                <Text style={[styles.topicCat, { color: topic.color }]}>{topic.category}</Text>
                <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
                <View style={styles.topicMeta}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.topicTime}>{topic.time}</Text>
                  {topic.trending && (
                    <View style={styles.trendBadge}>
                      <Text style={styles.trendText}>Trending</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>

      {/* Topic Detail Modal */}
      <Modal visible={!!openTopic} transparent animationType="slide" onRequestClose={() => setOpenTopic(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {openTopic?.image && (
              <ImageBackground source={{ uri: openTopic.image }} style={styles.modalBanner} imageStyle={{ borderRadius: 16, opacity: 0.6 }}>
                <View style={styles.modalBannerOverlay}>
                  <Text style={[styles.modalCat, { color: openTopic?.color }]}>{openTopic?.category}</Text>
                  <Text style={styles.modalTitle}>{openTopic?.title}</Text>
                </View>
              </ImageBackground>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpenTopic(null)}>
              <Ionicons name="close-circle" size={30} color={colors.textMuted} />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.contentText}>{openTopic?.content}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.learnMoreBtn} onPress={() => handleOpenLink(openTopic?.link)}>
              <Ionicons name="open-outline" size={16} color={colors.cyan} />
              <Text style={styles.learnMoreText}>Read Full Article (WHO / Govt Source) ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollView: { flex: 1, width: '100%' },
  scroll: { padding: 20, paddingBottom: 120, ...(Platform.OS === 'web' ? {} : { flexGrow: 1 }) },

  // Featured banner with image
  featuredWrapper: { borderRadius: 24, overflow: 'hidden', marginBottom: 30 },
  featuredBanner: { height: 240, justifyContent: 'flex-end' },
  featuredBannerImg: { borderRadius: 24 },
  bannerOverlay: { padding: 20, paddingTop: 60, backgroundColor: 'rgba(5,10,25,0.72)', borderRadius: 24 },
  featuredTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  featuredTitle: { color: '#fff', fontSize: 20, fontWeight: '900', lineHeight: 26, marginBottom: 6 },
  featuredDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  featuredActions: { flexDirection: 'row', gap: 10 },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  readBtnText: { fontSize: 13, fontWeight: '700' },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  playText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },

  // Topic cards with thumbnail
  topicCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12, borderRadius: 16,
    backgroundColor: '#0D1526', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  topicThumb: { width: 64, height: 64, borderRadius: 12, marginRight: 14, backgroundColor: '#1a2440' },
  topicInfo: { flex: 1 },
  topicCat: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  topicTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6, lineHeight: 20 },
  topicMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topicTime: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  trendBadge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  trendText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end', padding: 12 },
  modalCard: { backgroundColor: '#0F1729', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,201,255,0.15)', paddingBottom: 24 },
  modalBanner: { height: 160, justifyContent: 'flex-end' },
  modalBannerOverlay: { padding: 16, paddingTop: 40, backgroundColor: 'rgba(5,10,25,0.5)' },
  closeBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  modalCat: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 24 },
  contentText: { color: colors.textSecondary, fontSize: 14, lineHeight: 24, padding: 20, paddingTop: 16 },
  learnMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, backgroundColor: 'rgba(0,201,255,0.1)', padding: 14, borderRadius: 12, justifyContent: 'center' },
  learnMoreText: { color: colors.cyan, fontSize: 13, fontWeight: '600' },
});

export default HealthEducationScreen;
