import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_constants.dart';
import '../models/user_model.dart';

/// Authentication Service for Mobile Client
class AuthService {
  static const String _tokenKey = AppConstants.authTokenKey;
  static const String _userRoleKey = AppConstants.userRoleKey;

  /// Register a new account
  static Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    required String role,
    String languagePreference = 'en',
    String? phone,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(AppConstants.registerEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'full_name': fullName,
          'role': role,
          'language_preference': languagePreference,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final token = data['access_token'];
        final userRole = data['role'];
        await _saveSession(token: token, role: userRole);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['detail'] ?? 'Registration failed.'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: Could not reach backend.'};
    }
  }

  /// Login with email and password
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(AppConstants.loginEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        final token = data['access_token'];
        final userRole = data['role'];
        await _saveSession(token: token, role: userRole);
        return {'success': true, 'data': data};
      } else {
        return {'success': false, 'error': data['detail'] ?? 'Invalid email or password.'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Connection error: Could not reach backend.'};
    }
  }

  /// Get current user profile
  static Future<UserModel?> getCurrentProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      if (token == null) return null;

      final response = await http.get(
        Uri.parse(AppConstants.meEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return UserModel.fromJson(data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Update user profile
  static Future<bool> updateProfile(Map<String, dynamic> updates) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      if (token == null) return false;

      final response = await http.put(
        Uri.parse(AppConstants.updateProfileEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(updates),
      );

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Clear token and user session
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userRoleKey);
  }

  /// Check if user has an active session
  static Future<String?> getSavedRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userRoleKey);
  }

  static Future<String?> getSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> _saveSession({required String token, required String role}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userRoleKey, role);
  }
}
