import 'dart:convert';

String _decode(String encoded) {
  return utf8.decode(base64.decode(encoded));
}

class Config {
  static final String supabaseUrl = const bool.hasEnvironment('SUPABASE_URL')
    ? const String.fromEnvironment('SUPABASE_URL')
    : _decode('aHR0cHM6Ly9nZXp5eWJweWlvempkanp4anVvZS5zdXBhYmFzZS5jbw==');
}

void main() {
  print(Config.supabaseUrl);
}
