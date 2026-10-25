import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavigationContext } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import FeatureIcon from './FeatureIcon'
import { useTheme } from '../utils/ThemeContext'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

export const useColors = () => useTheme().colors

const shadow = (colors, isDark, level = 1) =>
  isDark
    ? {}
    : Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOpacity: 0.06 * level,
          shadowRadius: 10 * level,
          shadowOffset: { width: 0, height: 4 * level },
        },
        android: { elevation: 1.5 * level },
        default: {},
      })

// ─── Layout ──────────────────────────────────────────────────────────────────

export function Screen({
  title,
  subtitle,
  overline,
  back = false,
  onBack,
  right,
  scroll = true,
  keyboard = false,
  footer,
  children,
  contentStyle,
  refreshControl,
  scrollRef,
}) {
  const { colors } = useTheme()
  // Outside the NavigationContainer (login, onboarding) there's no navigation.
  const navigation = useContext(NavigationContext)
  const insets = useSafeAreaInsets()
  const showBack = back && navigation
  // Once the big title scrolls away, a slim bar stays on top with the page
  // name and the back button.
  const [compact, setCompact] = useState(false)
  const onScroll = e => {
    const down = e.nativeEvent.contentOffset.y > 48
    if (down !== compact) setCompact(down)
  }

  const header = (title || showBack || right) && (
    <View style={[styles.header, !scroll && { paddingHorizontal: SPACING.xl }]}>
      {(showBack || right) && (
        <View style={styles.headerBar}>
          {showBack ? (
            <IconButton icon="chevron-back" onPress={onBack || (() => navigation.goBack())} accessibilityLabel="Back" />
          ) : (
            <View />
          )}
          {right || null}
        </View>
      )}
      {overline ? <Text style={[TYPE.overline, { color: colors.primary, marginBottom: 4 }]}>{overline}</Text> : null}
      {title ? <Text style={[TYPE.title, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? <Text style={[TYPE.body, { color: colors.muted, marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
  )

  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      onScroll={(title || showBack) ? onScroll : undefined}
      scrollEventThrottle={32}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>
      {header}
      {children}
    </View>
  )

  const stickyBar = scroll && compact && (title || showBack) ? (
    <View style={[styles.sticky, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
      {showBack ? (
        <Pressable onPress={onBack || (() => navigation.goBack())} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={styles.stickyBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      ) : <View style={styles.stickyBack} />}
      <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>{title || ''}</Text>
      <View style={styles.stickyBack}>{right || null}</View>
    </View>
  ) : null

  const content = (
    <>
      <View style={{ flex: 1 }}>
        {body}
        {stickyBar}
      </View>
      {footer ? (
        <View
          style={[
            styles.footer,
            // Without a tab bar underneath (login, onboarding) the footer must clear the home indicator.
            { borderTopColor: colors.border, backgroundColor: colors.bg, paddingBottom: SPACING.md + (navigation ? 0 : insets.bottom) },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  )

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.bg }}>
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

export function LoadingView({ label }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {label ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{label}</Text> : null}
    </View>
  )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

export function Card({ children, style, onPress, tone = 'default', padded = true }) {
  const { colors, isDark } = useTheme()
  const toneStyle = {
    default: { backgroundColor: colors.card, borderColor: colors.border },
    soft: { backgroundColor: colors.primarySoft, borderColor: 'transparent' },
    primary: { backgroundColor: colors.primary, borderColor: 'transparent' },
  }[tone]
  const base = [styles.card, padded && styles.cardPadded, toneStyle, tone === 'default' && shadow(colors, isDark), style]

  if (!onPress) return <View style={base}>{children}</View>
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  )
}

export function SectionHeader({ title, action, onAction, style }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[TYPE.subheading, { color: colors.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function IconCircle({ name, size = 40, color, background, iconSize }) {
  const { colors } = useTheme()
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2.6,
        backgroundColor: background || colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FeatureIcon name={name} size={iconSize || size * 0.5} color={color || colors.primary} focused={name === 'rekod'} />
    </View>
  )
}

// `below`: an extra control under the subtitle (a time chooser…).
export function ListRow({ icon, iconColor, iconBackground, title, subtitle, right, onPress, last, destructive, below = null }) {
  const { colors } = useTheme()
  const content = (
    <View style={[styles.listRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      {icon ? <IconCircle name={icon} size={36} color={iconColor} background={iconBackground} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.bodyStrong, { color: destructive ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{subtitle}</Text> : null}
        {below}
      </View>
      {right !== undefined ? right : onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </View>
  )
  if (!onPress) return content
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      {content}
    </Pressable>
  )
}

// ─── Controls ────────────────────────────────────────────────────────────────

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, size = 'md' }) {
  const { colors } = useTheme()
  const v = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: 'transparent' },
    secondary: { bg: colors.primarySoft, fg: colors.primary, border: 'transparent' },
    outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: 'transparent' },
  }[variant]
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && styles.pressed,
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <FeatureIcon name={icon} size={size === 'sm' ? 16 : 18} color={v.fg} /> : null}
          <Text style={[size === 'sm' ? TYPE.caption : TYPE.bodyStrong, { color: v.fg, fontWeight: '700' }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function IconButton({ icon, onPress, accessibilityLabel, tone = 'default', size = 40 }) {
  const { colors } = useTheme()
  const bg = tone === 'primary' ? colors.primary : colors.card
  const fg = tone === 'primary' ? colors.onPrimary : colors.text
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: tone === 'primary' ? 0 : StyleSheet.hairlineWidth, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={fg} />
    </Pressable>
  )
}

export function Input({ label, style, multiline, ...props }) {
  const { colors } = useTheme()
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginBottom: 6, fontWeight: '600' }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[
          styles.input,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
          multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
          style,
        ]}
        {...props}
      />
    </View>
  )
}

export function Chip({ label, selected, onPress, icon }) {
  const { colors } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={selected ? colors.onPrimary : colors.textSecondary} /> : null}
      <Text style={[TYPE.caption, { color: selected ? colors.onPrimary : colors.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  )
}

export function SegmentedControl({ options, value, onChange }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surface }]}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && { backgroundColor: colors.card }]}
          >
            {opt.icon ? <Ionicons name={opt.icon} size={16} color={active ? colors.primary : colors.muted} /> : null}
            <Text style={[TYPE.caption, { fontWeight: '700', color: active ? colors.text : colors.muted }]}>{opt.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function Stepper({ label, value, onChange, min = 0, max = 10, hint }) {
  const { colors } = useTheme()
  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{label}</Text>
          {hint ? <Text style={[TYPE.caption, { color: colors.muted }]}>{hint}</Text> : null}
        </View>
        <View style={styles.stepperControls}>
          <IconButton icon="remove" size={34} onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel={`Decrease ${label}`} />
          <Text style={[TYPE.subheading, { color: colors.primary, minWidth: 28, textAlign: 'center' }]}>{value}</Text>
          <IconButton icon="add" size={34} onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel={`Increase ${label}`} />
        </View>
      </View>
      <ProgressBar value={(value - min) / (max - min)} style={{ marginTop: SPACING.sm }} />
    </View>
  )
}

export function ProgressBar({ value = 0, color, style, height = 8 }) {
  const { colors } = useTheme()
  const pct = Math.max(0, Math.min(1, value || 0)) * 100
  return (
    <View style={[{ height, borderRadius: height, backgroundColor: colors.surface, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color || colors.primary }} />
    </View>
  )
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function EmptyState({ icon = 'leaf-outline', title, description, action, onAction }) {
  const { colors } = useTheme()
  return (
    <View style={styles.empty}>
      <IconCircle name={icon} size={64} />
      <Text style={[TYPE.subheading, { color: colors.text, marginTop: SPACING.lg, textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text style={[TYPE.body, { color: colors.muted, marginTop: 6, textAlign: 'center', maxWidth: 280 }]}>{description}</Text>
      ) : null}
      {action ? <Button title={action} onPress={onAction} variant="secondary" style={{ marginTop: SPACING.lg }} /> : null}
    </View>
  )
}

export function Banner({ tone = 'error', message, actionLabel, onAction, style }) {
  const { colors } = useTheme()
  const t = {
    error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
    info: { bg: colors.primarySoft, fg: colors.primary, icon: 'cloud-offline-outline' },
    success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
  }[tone]
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }, style]}>
      <Ionicons name={t.icon} size={18} color={t.fg} />
      <Text style={[TYPE.caption, { color: t.fg, flex: 1, fontWeight: '600' }]}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[TYPE.caption, { color: t.fg, fontWeight: '800' }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export function Badge({ label, tone = 'primary' }) {
  const { colors } = useTheme()
  const t = {
    primary: [colors.primarySoft, colors.primary],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
  }[tone]
  return (
    <View style={[styles.badge, { backgroundColor: t[0] }]}>
      <Text style={[TYPE.overline, { color: t[1], fontSize: 10 }]}>{label}</Text>
    </View>
  )
}

export function BottomSheet({ title, onClose, children }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.sheetOverlay, { backgroundColor: colors.overlay }]}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={[styles.rowBetween, { marginBottom: SPACING.lg }]}>
            <Text style={[TYPE.heading, { color: colors.text }]}>{title}</Text>
            <IconButton icon="close" size={34} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  )
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gap8: { gap: SPACING.sm },
  gap12: { gap: SPACING.md },
  mb12: { marginBottom: SPACING.md },
  mb16: { marginBottom: SPACING.lg },
  mb24: { marginBottom: SPACING.xxl },
})

const styles = StyleSheet.create({
  header: { paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  sticky: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  stickyBack: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth },
  cardPadded: { padding: SPACING.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md, marginTop: SPACING.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  button: {
    minHeight: 52,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderWidth: 1.5,
  },
  buttonSm: { minHeight: 38, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 14, fontSize: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.pill, borderWidth: 1 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: RADIUS.md, gap: 4 },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill, alignSelf: 'flex-start' },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, paddingHorizontal: SPACING.xl, paddingTop: SPACING.sm, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: SPACING.md },
})
