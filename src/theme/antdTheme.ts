// Ant Design Theme Configuration
// Minimalist customization for Apple/Tesla style

import type { ThemeConfig } from 'antd';
import { colors, typography, borderRadius } from './tokens';

export const antdTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: colors.accent,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,

    // Background
    colorBgContainer: colors.background,
    colorBgElevated: colors.background,
    colorBgLayout: colors.surface,

    // Text
    colorText: colors.primary,
    colorTextSecondary: colors.gray[600],
    colorTextTertiary: colors.gray[500],
    colorTextQuaternary: colors.gray[400],

    // Border
    colorBorder: colors.gray[200],
    colorBorderSecondary: colors.gray[100],

    // Typography
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontSizeHeading1: 48,
    fontSizeHeading2: 36,
    fontSizeHeading3: 24,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    // Border Radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,

    // Motion
    motionDurationFast: '0.15s',
    motionDurationMid: '0.3s',
    motionDurationSlow: '0.5s',

    // Control
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Line width
    lineWidth: 1,
    lineWidthFocus: 2,
  },

  components: {
    Button: {
      borderRadius: parseInt(borderRadius.md),
      controlHeight: 44,
      controlHeightLG: 52,
      controlHeightSM: 36,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },

    Card: {
      borderRadiusLG: parseInt(borderRadius.xl),
      paddingLG: 24,
    },

    Table: {
      borderRadius: parseInt(borderRadius.lg),
      headerBg: colors.gray[50],
      headerColor: colors.gray[700],
      rowHoverBg: colors.accentLight,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },

    Input: {
      borderRadius: parseInt(borderRadius.md),
      controlHeight: 44,
      paddingInline: 16,
    },

    Select: {
      borderRadius: parseInt(borderRadius.md),
      controlHeight: 44,
    },

    Menu: {
      itemBorderRadius: parseInt(borderRadius.md),
      itemMarginBlock: 4,
      itemMarginInline: 8,
    },

    Modal: {
      borderRadiusLG: parseInt(borderRadius.xl),
    },

    Tabs: {
      inkBarColor: colors.accent,
      itemActiveColor: colors.accent,
      itemHoverColor: colors.accentDark,
    },

    Tag: {
      borderRadiusSM: parseInt(borderRadius.full),
    },

    DatePicker: {
      borderRadius: parseInt(borderRadius.md),
      controlHeight: 44,
    },

    Radio: {
      buttonSolidCheckedBg: colors.primary,
      buttonSolidCheckedHoverBg: colors.secondary,
    },

    Spin: {
      colorPrimary: colors.accent,
    },

    Message: {
      contentBg: colors.primary,
    },
  },
};

export default antdTheme;
