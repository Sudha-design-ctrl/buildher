import 'package:flutter/material.dart';
import '../../core/widgets/app_empty_state.dart';

/// Reusable placeholder screen for features not yet implemented.
class PlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;
  final String? subtitle;

  const PlaceholderScreen({
    super.key,
    required this.title,
    required this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: AppEmptyState(
        icon: icon,
        title: title,
        subtitle: subtitle ?? 'Coming in a future update',
      ),
    );
  }
}
