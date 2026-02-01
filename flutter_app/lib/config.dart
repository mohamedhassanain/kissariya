class Config {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://gezyybpyiozjdjzxjuoe.supabase.co',
  );
  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdlenl5YnB5aW96amRqenhqdW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTI3NTYsImV4cCI6MjA4NDA4ODc1Nn0.IF5I_L8BB3KhEFBmz0ouxp1B9O2rkYADoGdZIiCF8bs',
  );
}
