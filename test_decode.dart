import 'dart:convert';

String _decode(String encoded) {
  try {
    return utf8.decode(base64.decode(encoded));
  } catch (e) {
    return 'Error: $e';
  }
}

void main() {
  print(_decode('aHR0cHM6Ly9nZXp5eWJweWlvempkanp4anVvZS5zdXBhYmFzZS5jbw=='));
  print(_decode(
    'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6'
    'WlNJc0luSmxaaUk2SW1kbGVubDVZbkI1YVc5NmFtUnFlbmhxZFc5bElpd2ljbTlzWlNJNkltRnVi'
    'MjRpTENKcFlYUWlPakUzTmpnMU1USTNOVFlzSW1WNGNDSTZNakE0TkRBNE9EYzFObjAuSUY1SV9M'
    'OEJCM0toRUZCbXowb3V4cDFCOU8ycmtZQURvR2RaSWlDRjhicw=='
  ));
}
