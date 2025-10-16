import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Copy, 
  Clock, 
  Mic, 
  Euro,
  FileText,
  MessageSquare,
  Share2
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';
import SatisfactionRating from '@/components/SatisfactionRating';

export default function ProductivityScreen() {
  const { settings, reports, phrases, stats, calculateProductivity, trackInteractionTime } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  const [showSatisfactionModal, setShowSatisfactionModal] = useState<boolean>(false);
  const [sessionStartTime] = useState<number>(Date.now());

  // Track interaction time when component unmounts
  useEffect(() => {
    return () => {
      const sessionTime = Math.round((Date.now() - sessionStartTime) / 60000); // Convert to minutes
      if (sessionTime > 0) {
        trackInteractionTime(sessionTime);
      }
    };
  }, [sessionStartTime, trackInteractionTime]);

  // Calculate comprehensive stats
  const totalReportsCopied = stats?.reportsCopied || 0;
  const totalPhrasesCopied = stats?.phrasesCopied || 0;
  const recordingsCount = stats?.recordingsCount || 0;
  const totalInteractionTime = stats?.totalInteractionTime || 0;
  const aiHallazgosCopied = stats?.aiHallazgosCopied || 0;
  const aiConclusionsCopied = stats?.aiConclusionsCopied || 0;
  const aiDiferencialesCopied = stats?.aiDiferencialesCopied || 0;
  
  // Calculate days since first use
  const firstUseDate = stats?.firstUseDate;
  const daysSinceFirstUse = firstUseDate 
    ? Math.ceil((Date.now() - new Date(firstUseDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
    
  // Calculate total AI copies
  const totalAICopies = aiHallazgosCopied + aiConclusionsCopied + aiDiferencialesCopied;
  const totalAllCopies = totalReportsCopied + totalPhrasesCopied + totalAICopies;
  const totalRecordings = recordingsCount;
  const totalReportsCreated = reports.length;
  const totalPhrasesCreated = phrases.length;
  const reportsShared = stats?.reportsShared || 0;
  
  // Generate interaction time data
  const interactionData: { day: string; minutes: number; date: string }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
    interactionData.push({
      day: dayName,
      minutes: stats?.dailyInteractionTime[dateStr] || 0,
      date: dateStr
    });
  }
  
  const maxInteractionTime = Math.max(...interactionData.map(d => d.minutes), 1);
  
  const renderStatCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    subtitle?: string,
    color?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color || theme.primary + '20' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: color || theme.primary }]}>
          {value}
        </Text>
        <Text style={[styles.statTitle, { color: theme.onSurface }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.outline }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const renderInteractionChart = () => (
    <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
      <View style={styles.chartHeader}>
        <Clock size={20} color={theme.secondary} />
        <Text style={[styles.chartTitle, { color: theme.onSurface }]}>
          Tiempo de Uso de la APP (Minutos/Día)
        </Text>
      </View>
      <View style={styles.chartContainer}>
        {interactionData.map((item) => (
          <View key={item.date} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: Math.max(4, (item.minutes / maxInteractionTime) * 80),
                    backgroundColor: item.minutes === maxInteractionTime && item.minutes > 0 ? theme.secondary : theme.secondary + '60'
                  }
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: theme.onSurface }]}>
              {item.day}
            </Text>
            <Text style={[styles.barValue, { color: theme.outline }]}>
              {item.minutes}m
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMetricsGrid = () => (
    <View style={styles.metricsSection}>
      <View style={styles.metricsRow}>
        {renderMetricCard(
          <Copy size={24} color={theme.primary} />,
          'Copias Totales',
          totalAllCopies.toString(),
          theme.primary
        )}
        {renderMetricCard(
          <Mic size={24} color={theme.secondary} />,
          'Grabaciones',
          totalRecordings.toString(),
          theme.secondary
        )}
      </View>
      
      <View style={styles.metricsRow}>
        {renderMetricCard(
          <FileText size={24} color={theme.success} />,
          'Informes Creados',
          totalReportsCreated.toString(),
          theme.success
        )}
        {renderMetricCard(
          <MessageSquare size={24} color={theme.warning} />,
          'Frases Creadas',
          totalPhrasesCreated.toString(),
          theme.warning
        )}
      </View>
      
      <View style={styles.metricsRow}>
        {renderMetricCard(
          <Share2 size={24} color={theme.info} />,
          'Informes Compartidos',
          reportsShared.toString(),
          theme.info
        )}
        {renderMetricCard(
          <Clock size={24} color='#9C27B0' />,
          'Tiempo Total',
          `${Math.round(totalInteractionTime / 60)}h`,
          '#9C27B0'
        )}
      </View>
      
      <View style={[styles.detailsCopyCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
        <Text style={[styles.detailsCopyTitle, { color: theme.onSurface }]}>Desglose de Copias</Text>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Informes:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{totalReportsCopied}</Text>
        </View>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Frases:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{totalPhrasesCopied}</Text>
        </View>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Textos transcritos:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{recordingsCount}</Text>
        </View>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Hallazgos IA:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{aiHallazgosCopied}</Text>
        </View>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Conclusiones IA:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{aiConclusionsCopied}</Text>
        </View>
        <View style={styles.detailsCopyRow}>
          <Text style={[styles.detailsCopyLabel, { color: theme.outline }]}>Diferenciales IA:</Text>
          <Text style={[styles.detailsCopyValue, { color: theme.primary }]}>{aiDiferencialesCopied}</Text>
        </View>
      </View>
    </View>
  );
  
  const renderMetricCard = (
    icon: React.ReactNode,
    title: string,
    value: string,
    color: string
  ) => (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
      <View style={[styles.metricIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricTitle, { color: theme.onSurface }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Productividad',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.onSurface,
          }}
        />

        {renderMetricsGrid()}
        
        {renderInteractionChart()}
        
        <TouchableOpacity
          style={[styles.profitabilityButton, { backgroundColor: theme.success, borderColor: theme.success }]}
          onPress={() => router.push('/economic-profitability')}
        >
          <Euro size={20} color="white" />
          <Text style={styles.profitabilityButtonText}>Cálculo de Rentabilidad Económica</Text>
        </TouchableOpacity>



        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.outline }]}>
            Las estadísticas se actualizan en tiempo real
          </Text>
          {firstUseDate && (
            <Text style={[styles.footerText, { color: theme.outline, marginTop: 4 }]}>
              Usando la app desde: {new Date(firstUseDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </ScrollView>
      
      <SatisfactionRating
        visible={showSatisfactionModal}
        onClose={() => setShowSatisfactionModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  topSafeArea: {
    width: '100%',
  },
  container: {
    flex: 1,
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  horizontalChart: {
    marginHorizontal: -8,
  },
  barContainer: {
    alignItems: 'center',
    minWidth: 32,
    marginHorizontal: 2,
  },
  barWrapper: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
  },
  overviewCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsGrid: {
    paddingHorizontal: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  ratingButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  satisfactionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  satisfactionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 2,
  },
  profitabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    gap: 8,
  },
  profitabilityButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  compactStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  compactStatCard: {
    width: '23%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  compactStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  compactStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  compactStatTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  profitabilitySummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profitabilitySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  profitabilitySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitabilitySummaryContent: {
    gap: 4,
  },
  profitabilitySummaryText: {
    fontSize: 14,
  },
  profitabilitySummaryDate: {
    fontSize: 12,
    marginTop: 4,
  },
  metricsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailsCopyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailsCopyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsCopyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsCopyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsCopyValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});