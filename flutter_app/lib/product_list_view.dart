import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'models/product.dart';
import 'product_detail_view.dart';

class ProductListView extends StatefulWidget {
  const ProductListView({super.key});

  @override
  State<ProductListView> createState() => _ProductListViewState();
}

class _ProductListViewState extends State<ProductListView> {
  late final SupabaseClient _supabase;
  late Future<List<Product>> _productsFuture;

  @override
  void initState() {
    super.initState();
    try {
      _supabase = Supabase.instance.client;
      _productsFuture = _fetchProducts();
    } catch (e) {
      debugPrint('Supabase client not initialized: $e');
      _productsFuture = Future.error('Initialization error');
    }
  }

  Future<List<Product>> _fetchProducts() async {
    try {
      final List<dynamic> response = await _supabase
          .from('products')
          .select()
          .eq('is_active', true)
          .order('created_at', ascending: false);

      return response.map((json) => Product.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('Error fetching products: $e');
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kissariya Shop'),
      ),
      body: FutureBuilder<List<Product>>(
        future: _productsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'Une erreur est survenue lors du chargement des produits. Veuillez réessayer plus tard.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final products = snapshot.data ?? [];
          if (products.isEmpty) {
            return const Center(child: Text('Aucun produit trouvé.'));
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 300,
              childAspectRatio: 0.7,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              final product = products[index];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ProductDetailView(product: product),
                      ),
                    );
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: product.imageUrl != null
                            ? Image.network(
                                product.imageUrl!,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) =>
                                    const Center(child: Icon(Icons.broken_image)),
                              )
                            : const Center(child: Icon(Icons.image, size: 50)),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              product.name,
                              style: Theme.of(context).textTheme.titleMedium,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${product.price.toStringAsFixed(2)} €',
                              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
