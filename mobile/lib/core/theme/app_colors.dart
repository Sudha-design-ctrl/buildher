import 'package:flutter/material.dart';

/// BuildHer application color palette.
///
/// Uses a deep plum primary with warm rose-pink accent.
/// Designed to feel professional, welcoming, and trustworthy.
class AppColors {
  AppColors._();

  // Primary palette
  static const Color primary = Color(0xFF6B2D8B);
  static const Color primaryLight = Color(0xFF9C4DCC);
  static const Color primaryDark = Color(0xFF4A1564);
  static const Color primarySurface = Color(0xFFF3E5F5);

  // Accent palette
  static const Color accent = Color(0xFFE91E8C);
  static const Color accentLight = Color(0xFFFF5CB8);
  static const Color accentSoft = Color(0xFFFCE4EC);

  // Backgrounds
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Colors.white;
  static const Color darkSurface = Color(0xFF1A1025);
  static const Color scaffoldDark = Color(0xFF120B1A);

  // Text
  static const Color textPrimary = Color(0xFF1A1025);
  static const Color textSecondary = Color(0xFF6B6B7B);
  static const Color textHint = Color(0xFFAAAAAA);
  static const Color textOnPrimary = Colors.white;
  static const Color textOnDark = Color(0xFFE8E0F0);

  // Semantic
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);

  // UI elements
  static const Color divider = Color(0xFFEEEEEE);
  static const Color cardShadow = Color(0x1A6B2D8B);
  static const Color shimmer = Color(0xFFE0E0E0);
  static const Color inputBorder = Color(0xFFE0E0E0);
  static const Color inputFocusBorder = primary;

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, Color(0xFF8E3AAF)],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, Color(0xFFFF5CB8)],
  );

  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF2D1045), Color(0xFF1A1025)],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7B3FA0), Color(0xFF6B2D8B)],
  );
}
