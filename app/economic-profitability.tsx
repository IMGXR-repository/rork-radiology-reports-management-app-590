import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Euro, TrendingUp, Calculator, Award, ArrowLeft, Sparkles, Target } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { lightTheme, darkTheme } from '@/constants/theme';

export default function EconomicProfitabilityScreen() {
  const { settings, saveEconomicProfitability, stats } = useApp();
  const theme = settings.theme === 'dark' ? darkTheme : lightTheme;
  const insets = useSafeAreaInsets();
  
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [productivityIncrease, setProductivityIncrease] = useState<string>('');
  const [calculated, setCalculated] = useState<boolean>(false);
  const [results, setResults] = useState<{
    monthlyBenefit: number;
    yearlyBenefit: number;
    dailyBenefit: number;
    hourlyBenefit: number;
  } | null>(null);

  const calculateProfitability = async () => {
    const income = parseFloat(monthlyIncome);
    const increase = parseFloat(productivityIncrease);
    
    if (isNaN(income) || isNaN(increase) || income <= 0 || increase <= 0) {
      Alert.alert('Error', 'Por favor ingresa valores válidos mayores a 0');
      return;
    }
    
    if (increase > 100) {
      Alert.alert('Advertencia', 'Un aumento de productividad mayor al 100% es muy optimista. ¿Estás seguro?');
    }
    
    const monthlyBenefit = (income * increase) / 100;
    const yearlyBenefit = monthlyBenefit * 12;
    const dailyBenefit = monthlyBenefit / 30;
    const hourlyBenefit = monthlyBenefit / (30 * 8); // Assuming 8 hours work day
    
    const calculationResults = {
      monthlyBenefit,
      yearlyBenefit,
      dailyBenefit,
      hourlyBenefit
    };
    
    // Save the economic profitability data
    const economicData = {
      monthlyIncome: income,
      productivityIncrease: increase,
      monthlyBenefit,
      yearlyBenefit,
      dailyBenefit,
      hourlyBenefit,
      calculatedAt: new Date().toISOString()
    };
    
    await saveEconomicProfitability(economicData);
    
    setResults(calculationResults);
    setCalculated(true);
  };
  
  const reset = () => {
    setMonthlyIncome('');
    setProductivityIncrease('');
    setCalculated(false);
    setResults(null);
  };
  
  const getMotivationalMessage = (increase: number) => {
    if (increase >= 50) {
      return '¡Increíble! Tu productividad ha alcanzado niveles extraordinarios 🚀';
    } else if (increase >= 30) {
      return '¡Excelente! Estás maximizando tu potencial profesional 💪';
    } else if (increase >= 20) {
      return '¡Muy bien! Tu eficiencia está mejorando significativamente 📈';
    } else if (increase >= 10) {
      return '¡Buen trabajo! Cada mejora cuenta hacia tu éxito 🎯';
    } else {
      return '¡Enhorabuena! Cada paso hacia la eficiencia es valioso ✨';
    }
  };
  
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View 
          style={[
            styles.circularProgressBackground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: theme.outline + '30'
            }
          ]}
        />
        <View 
          style={[
            styles.circularProgressForeground,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: percentage > 25 ? color : 'transparent',
              borderLeftColor: percentage > 50 ? color : 'transparent',
              transform: [{ rotate: `${(percentage / 100) * 360}deg` }]
            }
          ]}
        />
        <View style={styles.circularProgressCenter}>
          <Text style={[styles.circularProgressText, { color: theme.onSurface }]}>
            {percentage}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topSafeArea, { height: insets.top, backgroundColor: theme.surface }]} />
      
      <Stack.Screen
        options={{
          title: 'Rentabilidad Económica',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.onSurface,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={theme.onSurface} />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {!calculated ? (
          <View style={styles.inputSection}>
            <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Calculator size={32} color={theme.primary} />
              <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
                Calcula tu Rentabilidad
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.outline }]}>
                Descubre el valor económico que la app aporta a tu trabajo
              </Text>
            </View>
            
            <View style={[styles.inputCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.onSurface }]}>
                  💰 Ingresos Mensuales Base (€)
                </Text>
                <View style={[styles.inputContainer, { borderColor: theme.outline, backgroundColor: theme.background }]}>
                  <Euro size={20} color={theme.outline} />
                  <TextInput
                    style={[styles.textInput, { color: theme.onSurface }]}
                    value={monthlyIncome}
                    onChangeText={setMonthlyIncome}
                    placeholder="Ej: 3000"
                    placeholderTextColor={theme.outline}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.onSurface }]}>
                  📈 Aumento de Productividad (%)
                </Text>
                <View style={[styles.inputContainer, { borderColor: theme.outline, backgroundColor: theme.background }]}>
                  <TrendingUp size={20} color={theme.outline} />
                  <TextInput
                    style={[styles.textInput, { color: theme.onSurface }]}
                    value={productivityIncrease}
                    onChangeText={setProductivityIncrease}
                    placeholder="Ej: 25"
                    placeholderTextColor={theme.outline}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={[styles.inputHint, { color: theme.outline }]}>
                  Estima cuánto ha mejorado tu eficiencia usando la app
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.calculateButton, { backgroundColor: theme.primary }]}
                onPress={calculateProfitability}
              >
                <Calculator size={20} color="white" />
                <Text style={styles.calculateButtonText}>Calcular Rentabilidad</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.resultsSection}>
            <View style={[styles.congratsCard, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
              <Sparkles size={32} color={theme.success} />
              <Text style={[styles.congratsTitle, { color: theme.success }]}>
                ¡Enhorabuena!
              </Text>
              <Text style={[styles.congratsMessage, { color: theme.onSurface }]}>
                {getMotivationalMessage(parseFloat(productivityIncrease))}
              </Text>
            </View>
            
            <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.progressTitle, { color: theme.onSurface }]}>
                Tu Mejora de Productividad
              </Text>
              <View style={styles.progressContainer}>
                <CircularProgress 
                  percentage={Math.min(parseFloat(productivityIncrease), 100)} 
                  color={theme.primary}
                />
              </View>
            </View>
            
            {results && (
              <View style={styles.benefitsGrid}>
                <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
                  <Euro size={24} color={theme.primary} />
                  <Text style={[styles.benefitAmount, { color: theme.primary }]}>
                    €{results.monthlyBenefit.toFixed(0)}
                  </Text>
                  <Text style={[styles.benefitLabel, { color: theme.onSurface }]}>
                    Beneficio Mensual
                  </Text>
                </View>
                
                <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.success }]}>
                  <Target size={24} color={theme.success} />
                  <Text style={[styles.benefitAmount, { color: theme.success }]}>
                    €{results.yearlyBenefit.toFixed(0)}
                  </Text>
                  <Text style={[styles.benefitLabel, { color: theme.onSurface }]}>
                    Beneficio Anual
                  </Text>
                </View>
                
                <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.info }]}>
                  <Award size={24} color={theme.info} />
                  <Text style={[styles.benefitAmount, { color: theme.info }]}>
                    €{results.dailyBenefit.toFixed(1)}
                  </Text>
                  <Text style={[styles.benefitLabel, { color: theme.onSurface }]}>
                    Beneficio Diario
                  </Text>
                </View>
                
                <View style={[styles.benefitCard, { backgroundColor: theme.surface, borderColor: theme.warning }]}>
                  <TrendingUp size={24} color={theme.warning} />
                  <Text style={[styles.benefitAmount, { color: theme.warning }]}>
                    €{results.hourlyBenefit.toFixed(2)}
                  </Text>
                  <Text style={[styles.benefitLabel, { color: theme.onSurface }]}>
                    Beneficio por Hora
                  </Text>
                </View>
              </View>
            )}
            
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.summaryTitle, { color: theme.onSurface }]}>
                💡 Resumen de tu Inversión
              </Text>
              <Text style={[styles.summaryText, { color: theme.outline }]}>
                Con un aumento de productividad del {productivityIncrease}%, 
                la app te está generando un valor económico de 
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                  €{results?.monthlyBenefit.toFixed(0)} mensuales
                </Text>.
                {"\n\n"}
                ¡Esto significa que cada euro invertido en mejorar tu eficiencia 
                se traduce en beneficios reales y medibles!
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.outline + '20', borderColor: theme.outline }]}
              onPress={reset}
            >
              <Calculator size={20} color={theme.outline} />
              <Text style={[styles.resetButtonText, { color: theme.outline }]}>Calcular Nuevamente</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {stats?.monthlyProfitability && Object.keys(stats.monthlyProfitability).length > 0 && (
          <View style={styles.chartsSection}>
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.chartTitle, { color: theme.onSurface }]}>Rentabilidad Mensual (€)</Text>
              <View style={styles.monthlyChart}>
                {Object.entries(stats.monthlyProfitability)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-6)
                  .map(([month, benefit]) => {
                    const maxBenefit = Math.max(...Object.values(stats.monthlyProfitability));
                    const heightPercent = (benefit / maxBenefit) * 100;
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('es-ES', { month: 'short' });
                    
                    return (
                      <View key={month} style={styles.monthBar}>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.monthBarFill,
                              {
                                height: `${Math.max(5, heightPercent)}%`,
                                backgroundColor: theme.success,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.monthLabel, { color: theme.onSurface }]}>
                          {monthName}
                        </Text>
                        <Text style={[styles.monthValue, { color: theme.success }]}>
                          €{benefit.toFixed(0)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </View>
            
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
              <Text style={[styles.chartTitle, { color: theme.onSurface }]}>Proyección Anual</Text>
              <View style={styles.annualProjection}>
                <View style={styles.projectionBar}>
                  <View style={[styles.projectionFill, { backgroundColor: theme.primary, width: '100%' }]} />
                </View>
                <View style={styles.projectionDetails}>
                  <Text style={[styles.projectionLabel, { color: theme.outline }]}>Total Anualizado:</Text>
                  <Text style={[styles.projectionValue, { color: theme.primary }]}>
                    €{(Object.values(stats.monthlyProfitability).reduce((a, b) => a + b, 0) * 12 / Object.keys(stats.monthlyProfitability).length).toFixed(0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSafeArea: {
    width: '100%',
  },
  scrollContainer: {
    flex: 1,
  },
  backButton: {
    padding: 12,
    marginLeft: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  inputSection: {
    padding: 16,
  },
  headerCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 16,
  },
  congratsCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  congratsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  congratsMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressBackground: {
    position: 'absolute',
  },
  circularProgressForeground: {
    position: 'absolute',
  },
  circularProgressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  benefitCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  benefitAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 32,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartsSection: {
    padding: 16,
    paddingTop: 0,
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 8,
  },
  monthBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    height: 100,
    width: '100%',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  monthBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  monthValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  annualProjection: {
    alignItems: 'center',
  },
  projectionBar: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  projectionFill: {
    height: '100%',
    borderRadius: 20,
  },
  projectionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  projectionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  projectionValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});