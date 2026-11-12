/// BuildHer application constants.
class AppConstants {
  AppConstants._();

  // API
  // Use localhost on Web / Desktop, 10.0.2.2 on Android emulator
  static const String baseUrl = bool.fromEnvironment('dart.library.js_util') || identical(0, 0.0)
      ? 'http://localhost:8001'
      : 'http://10.0.2.2:8001';
  static const String apiVersion = '/api/v1';
  static const String healthEndpoint = '$baseUrl$apiVersion/health';
  static const String registerEndpoint = '$baseUrl$apiVersion/auth/register';
  static const String loginEndpoint = '$baseUrl$apiVersion/auth/login';
  static const String meEndpoint = '$baseUrl$apiVersion/auth/me';
  static const String updateProfileEndpoint = '$baseUrl$apiVersion/auth/profile';

  // App info
  static const String appName = 'BuildHer';
  static const String appVersion = '1.0.0';
  static const String appTagline = 'Empowering Women Entrepreneurs';

  // SharedPreferences keys
  static const String onboardingShownKey = 'onboarding_shown';
  static const String userRoleKey = 'user_role';
  static const String authTokenKey = 'auth_token';

  // User roles
  static const String roleEntrepreneur = 'entrepreneur';
  static const String roleCustomer = 'customer';
  static const String roleAdmin = 'admin';

  // Animation durations
  static const Duration splashDuration = Duration(milliseconds: 2500);
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationNormal = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);
}
