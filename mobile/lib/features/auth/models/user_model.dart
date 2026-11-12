/// User Model for BuildHer
class UserModel {
  final String uid;
  final String email;
  final String fullName;
  final String role;
  final String? phone;
  final String languagePreference;
  final String? location;
  final String? bio;
  final String? businessName;
  final String? businessCategory;
  final bool isVerified;

  const UserModel({
    required this.uid,
    required this.email,
    required this.fullName,
    required this.role,
    this.phone,
    this.languagePreference = 'en',
    this.location,
    this.bio,
    this.businessName,
    this.businessCategory,
    this.isVerified = false,
  });

  bool get isEntrepreneur => role == 'entrepreneur';
  bool get isCustomer => role == 'customer';
  bool get isAdmin => role == 'admin';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      uid: json['uid'] ?? json['user_id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'customer',
      phone: json['phone'],
      languagePreference: json['language_preference'] ?? 'en',
      location: json['location'],
      bio: json['bio'],
      businessName: json['business_name'],
      businessCategory: json['business_category'],
      isVerified: json['is_verified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'full_name': fullName,
      'role': role,
      'phone': phone,
      'language_preference': languagePreference,
      'location': location,
      'bio': bio,
      'business_name': businessName,
      'business_category': businessCategory,
      'is_verified': isVerified,
    };
  }

  UserModel copyWith({
    String? fullName,
    String? phone,
    String? languagePreference,
    String? location,
    String? bio,
    String? businessName,
    String? businessCategory,
    bool? isVerified,
  }) {
    return UserModel(
      uid: uid,
      email: email,
      fullName: fullName ?? this.fullName,
      role: role,
      phone: phone ?? this.phone,
      languagePreference: languagePreference ?? this.languagePreference,
      location: location ?? this.location,
      bio: bio ?? this.bio,
      businessName: businessName ?? this.businessName,
      businessCategory: businessCategory ?? this.businessCategory,
      isVerified: isVerified ?? this.isVerified,
    );
  }
}
