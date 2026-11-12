import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import 'services/auth_service.dart';

/// Profile Setup Screen for new entrepreneurs
class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _businessNameController = TextEditingController();
  final _bioController = TextEditingController();
  final _locationController = TextEditingController();
  String _selectedCategory = 'Crafts';
  bool _isLoading = false;

  final List<String> _categories = [
    'Cooking & Food',
    'Tailoring & Fashion',
    'Crafts & Handmade',
    'Beauty & Wellness',
    'Tutoring & Education',
    'Art & Design',
    'Other Services',
  ];

  @override
  void dispose() {
    _businessNameController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _handleSaveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final success = await AuthService.updateProfile({
      'business_name': _businessNameController.text.trim(),
      'bio': _bioController.text.trim(),
      'location': _locationController.text.trim(),
      'business_category': _selectedCategory,
    });

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success) {
      Navigator.of(context).pushNamedAndRemoveUntil(
        '/entrepreneur/home',
        (route) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update profile. You can do this later.')),
      );
      Navigator.of(context).pushNamedAndRemoveUntil(
        '/entrepreneur/home',
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Setup Your Profile'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/entrepreneur/home',
                (route) => false,
              );
            },
            child: const Text('Skip'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Tell us about your work',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This helps customers discover your business and allows AI to customize suggestions for you.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 24),
                AppTextField(
                  label: 'Business / Brand Name',
                  hint: 'e.g. Priya Handicrafts',
                  controller: _businessNameController,
                  prefixIcon: Icons.storefront_outlined,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  decoration: InputDecoration(
                    labelText: 'Primary Category',
                    prefixIcon: const Icon(Icons.category_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCategory = val);
                  },
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Area / City',
                  hint: 'e.g. Jayanagar, Bengaluru',
                  controller: _locationController,
                  prefixIcon: Icons.location_on_outlined,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Short Bio / Description',
                  hint: 'What do you make or offer?',
                  controller: _bioController,
                  prefixIcon: Icons.description_outlined,
                ),
                const SizedBox(height: 32),
                AppButton(
                  label: 'Complete Setup',
                  isLoading: _isLoading,
                  onPressed: _handleSaveProfile,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
