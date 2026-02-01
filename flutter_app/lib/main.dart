import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'product_list_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://gezyybpyiozjdjzxjuoe.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlenl5YnB5aW96amRqenhqdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTI3NTYsImV4cCI6MjA4NDA4ODc1Nn0.IF5I_L8BB3KhEFBmz0ouxp1B9O2rkYADoGdZIiCF8bs',
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kissariya Shop',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const ProductListView(),
    );
  }
}
