class Product {
  final String id;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final bool isActive;

  Product({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    required this.isActive,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Product',
      description: json['description'] as String?,
      price: (json['price'] as num? ?? 0).toDouble(),
      imageUrl: json['image_url'] as String?,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
