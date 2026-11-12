import 'package:flutter/material.dart';
import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/welcome_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/auth/profile_setup_screen.dart';
import '../../features/home/entrepreneur/entrepreneur_home_screen.dart';
import '../../features/home/customer/customer_home_screen.dart';

/// Application route configuration.
class AppRouter {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String welcome = '/welcome';
  static const String login = '/login';
  static const String register = '/register';
  static const String profileSetup = '/profile/setup';
  static const String entrepreneurHome = '/entrepreneur/home';
  static const String customerHome = '/customer/home';

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
          settings: settings,
        );
      case onboarding:
        return MaterialPageRoute(
          builder: (_) => const OnboardingScreen(),
          settings: settings,
        );
      case welcome:
        return MaterialPageRoute(
          builder: (_) => const WelcomeScreen(),
          settings: settings,
        );
      case login:
        return MaterialPageRoute(
          builder: (_) => const LoginScreen(),
          settings: settings,
        );
      case register:
        final args = settings.arguments as Map<String, dynamic>?;
        final initialRole = args?['role'] as String?;
        return MaterialPageRoute(
          builder: (_) => RegisterScreen(initialRole: initialRole),
          settings: settings,
        );
      case profileSetup:
        return MaterialPageRoute(
          builder: (_) => const ProfileSetupScreen(),
          settings: settings,
        );
      case entrepreneurHome:
        return MaterialPageRoute(
          builder: (_) => const EntrepreneurHomeScreen(),
          settings: settings,
        );
      case customerHome:
        return MaterialPageRoute(
          builder: (_) => const CustomerHomeScreen(),
          settings: settings,
        );
      default:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
          settings: settings,
        );
    }
  }
}
