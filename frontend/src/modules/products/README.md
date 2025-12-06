# Products Module

The Products module handles product listings, search, filtering, and management for the Reacher marketplace.

## Features

- **Product Listing** - Browse all products with pagination
- **Advanced Search** - Search by title/description
- **Filtering** - Filter by category, price range
- **Sorting** - Sort by newest, price, or rating
- **Product Detail** - View complete product information
- **Create Product** - Sellers can list new products
- **Edit Product** - Update product information
- **Delete Product** - Remove products from marketplace

## Directory Structure

```
products/
├── pages/
│   ├── products.tsx           # Main listing page
│   ├── product-detail.tsx     # Single product detail
│   └── create-product.tsx     # Create/edit product form
├── components/
│   ├── ProductCard.tsx        # Product grid card
│   ├── SearchBar.tsx          # Search and filter form
│   ├── ProductForm.tsx        # Create/edit form
│   └── ProductDetail.tsx      # Detail view organism
├── services/
│   └── product-api.ts         # API service functions
└── README.md
```

## Components

### ProductCard
Atom component for displaying a product in grid format.

```tsx
<ProductCard
  id="uuid"
  title="Product Title"
  price={99.99}
  category="Electronics"
  rating={4.5}
  reviews_count={10}
  onClick={() => {}}
/>
```

### SearchBar
Molecule component for product search and filtering.

```tsx
<SearchBar
  onSearch={(filters) => {
    console.log(filters); // { search, category, min_price, max_price }
  }}
  categories={['Electronics', 'Clothing', 'Home']}
/>
```

### ProductForm
Molecule component for creating/editing products.

```tsx
<ProductForm
  onSubmit={async (data) => {
    // { title, description, category, price, quantity, location }
  }}
  initialData={product}
  isLoading={false}
/>
```

### ProductDetail
Organism component for displaying full product details.

```tsx
<ProductDetail
  product={product}
  onContactSeller={() => {}}
  onEdit={() => {}}
  onDelete={async () => {}}
  currentUserId="uuid"
/>
```

## Pages

### /products
Main marketplace page with product listing, search, and filters.

### /products/[id]
Product detail page showing complete information and actions.

### /products/create
Form page for sellers to create new products.

## API Integration

The module uses centralized API service (`product-api.ts`) for all backend communication:

```typescript
// List/search products
getProducts({
  search: 'laptop',
  category: 'Electronics',
  min_price: 100,
  max_price: 1000,
  sort: 'price',
  limit: 20,
  offset: 0
});

// Get product detail
getProductById('product-id');

// Create product
createProduct({
  title: 'My Product',
  description: 'Description...',
  category: 'Electronics',
  price: 99.99,
  quantity: 1,
  location: 'New York, NY'
});

// Update product
updateProduct('product-id', {
  title: 'Updated Title',
  price: 89.99
});

// Delete product
deleteProduct('product-id');
```

## Backend API Endpoints

### GET /api/products
List/search products with filtering and pagination.

**Query Parameters:**
- `search` - Search in title/description
- `category` - Filter by category
- `min_price` - Minimum price
- `max_price` - Maximum price
- `sort` - Sort by `created_at`, `price`, or `rating`
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

### GET /api/products/:id
Get product detail.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Product Title",
    "description": "...",
    "category": "Electronics",
    "price": 99.99,
    "currency": "USD",
    "quantity": 1,
    "location": "New York, NY",
    "rating": 4.5,
    "reviews_count": 10,
    "seller_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/products
Create new product (seller only, requires authentication).

**Request Body:**
```json
{
  "title": "Product Title",
  "description": "Detailed description",
  "category": "Electronics",
  "price": 99.99,
  "quantity": 1,
  "currency": "USD",
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": "uuid",
    "title": "Product Title",
    "price": 99.99,
    ...
  }
}
```

### PUT /api/products/:id
Update product (seller only, ownership required).

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 89.99,
  "location": "Los Angeles, CA"
}
```

### DELETE /api/products/:id
Delete product (seller only, ownership required).

**Response:**
```json
{
  "success": true,
  "message": "Product deleted"
}
```

## State Management

Products use Zustand auth store for user context:

```typescript
const { user, token } = useAuthStore();
```

Authentication is required for:
- Creating products
- Editing own products
- Deleting own products

## Search & Filter Features

### Search
- Searches in product title and description
- Case-insensitive full-text search
- Returns matching products

### Filter by Category
- Predefined categories: Electronics, Clothing, Home, Books, Services
- Single category selection
- Shows products in selected category

### Filter by Price Range
- Set minimum price (default: $0)
- Set maximum price (default: unlimited)
- Shows products within range

### Sort Options
- **Newest** - Sort by created_at (most recent first)
- **Price** - Sort by price (lowest to highest)
- **Rating** - Sort by average rating (highest first)

## Pagination

- Default limit: 20 products per page
- Maximum limit: 100 products per page
- Offset-based pagination
- Shows total count

## Validation

### Create/Update Product Validation
- Title: Required, minimum 3 characters
- Category: Required, must be valid category
- Price: Required, must be > 0
- Quantity: Optional, must be >= 0
- Location: Optional, text
- Description: Optional, text

### Search Validation
- All parameters optional
- Price must be numeric if provided
- Limit capped at 100

## Error Handling

All operations include error handling:

```typescript
try {
  const response = await getProducts(params);
  if (response.success) {
    // Handle success
  } else {
    // Handle API error
  }
} catch (error) {
  // Handle network error
}
```

Common errors:
- 400: Validation failed
- 401: Authentication required (for create/edit/delete)
- 403: Unauthorized (trying to edit/delete other user's product)
- 404: Product not found
- 500: Server error

## Future Enhancements

- [ ] Image upload with preview
- [ ] Multiple images per product
- [ ] Product ratings and reviews
- [ ] Favorite products (wishlist)
- [ ] Similar products recommendation
- [ ] Product comparison
- [ ] Advanced filters (brand, condition, etc.)
- [ ] Product sharing on social media
- [ ] Analytics dashboard for sellers
