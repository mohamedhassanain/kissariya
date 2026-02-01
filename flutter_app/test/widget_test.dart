import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/models/product.dart';

void main() {
  test('Product model should parse from JSON', () {
    final json = {
      'id': '123',
      'name': 'Test Product',
      'description': 'Test Description',
      'price': 9.99,
      'image_url': 'http://example.com/image.jpg',
      'is_active': true,
    };

    final product = Product.fromJson(json);

    expect(product.id, '123');
    expect(product.name, 'Test Product');
    expect(product.description, 'Test Description');
    expect(product.price, 9.99);
    expect(product.imageUrl, 'http://example.com/image.jpg');
    expect(product.isActive, true);
  });
}
