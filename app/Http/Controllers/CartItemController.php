<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartItemController extends Controller
{
    /**
     * GET /api/cart-items — Lista los items. Se puede filtrar por ?cart_id=.
     * GET /api/carts/{cart}/items — Lista los items de un carrito concreto.
     */
    public function index(Request $request): JsonResponse
    {
        // Prioriza el parámetro de la ruta anidada; si no, el query string.
        $cartId = $request->route('cart') ?? $request->query('cart_id');

        $query = CartItem::with('article');

        if ($cartId !== null) {
            $query->where('cart_id', (int) $cartId);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * POST /api/cart-items — Agrega un artículo a un carrito y recalcula el total.
     */
    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $item = CartItem::create($request->validated());
        $item->cart->recalculateTotal();

        return response()->json([
            'message' => 'Artículo agregado al carrito.',
            'data'    => $item->load('article'),
            'cart'    => $item->cart->fresh(),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/cart-items/{id} — Muestra un item.
     */
    public function show($id): JsonResponse
    {
        $item = CartItem::with('article')->findOrFail($id);

        return response()->json(['data' => $item]);
    }

    /**
     * PUT/PATCH /api/cart-items/{id} — Actualiza un item y recalcula los totales
     * de los carritos afectados.
     */
    public function update(UpdateCartItemRequest $request, $id): JsonResponse
    {
        $item = CartItem::findOrFail($id);
        $originalCartId = $item->cart_id;

        $item->update($request->validated());

        // Recalcula el carrito original.
        $original = Cart::find($originalCartId);
        if ($original !== null) {
            $original->recalculateTotal();
        }

        // Si el item cambió de carrito, recalcula también el nuevo.
        if ((int) $item->cart_id !== (int) $originalCartId) {
            $item->cart->recalculateTotal();
        }

        return response()->json([
            'message' => 'Item de carrito actualizado correctamente.',
            'data'    => $item->load('article'),
        ]);
    }

    /**
     * DELETE /api/cart-items/{id} — Elimina un item y recalcula el total.
     */
    public function destroy($id): JsonResponse
    {
        $item = CartItem::findOrFail($id);
        $cart = $item->cart;

        $item->delete();

        if ($cart !== null) {
            $cart->recalculateTotal();
        }

        return response()->json(['message' => 'Item eliminado del carrito.']);
    }
}
