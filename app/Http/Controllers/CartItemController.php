<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartItemRequest;
use App\Http\Requests\UpdateCartItemRequest;
use App\Services\CartService;
use App\Support\MemoryStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartItemController extends Controller
{
    /** @var MemoryStore */
    protected $items;

    /** @var CartService */
    protected $service;

    public function __construct(CartService $service)
    {
        $this->items   = MemoryStore::for(MemoryStore::CART_ITEMS);
        $this->service = $service;
    }

    /**
     * GET /api/cart-items — Lista los items. Se puede filtrar por ?cart_id=.
     * GET /api/carts/{cart}/items — Lista los items de un carrito concreto.
     */
    public function index(Request $request): JsonResponse
    {
        // Prioriza el parámetro de la ruta anidada; si no, el query string.
        $cartId = $request->route('cart') ?? $request->query('cart_id');

        $items = $cartId !== null
            ? $this->items->where('cart_id', (int) $cartId)
            : $this->items->all();

        return response()->json(['data' => $items]);
    }

    /**
     * POST /api/cart-items — Agrega un artículo a un carrito y recalcula el total.
     */
    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();

        $item = $this->items->create([
            'cart_id'    => (int) $data['cart_id'],
            'article_id' => (int) $data['article_id'],
        ]);

        $cart = $this->service->recalculateTotal((int) $item['cart_id']);

        return response()->json([
            'message' => 'Artículo agregado al carrito.',
            'data'    => $item,
            'cart'    => $cart,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/cart-items/{cart_item} — Muestra un item.
     */
    public function show($id): JsonResponse
    {
        $item = $this->items->find($id);

        if ($item === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Item de carrito no encontrado.');
        }

        return response()->json(['data' => $item]);
    }

    /**
     * PUT/PATCH /api/cart-items/{cart_item} — Actualiza un item y recalcula los
     * totales de los carritos afectados.
     */
    public function update(UpdateCartItemRequest $request, $id): JsonResponse
    {
        $original = $this->items->find($id);

        if ($original === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Item de carrito no encontrado.');
        }

        $data = $request->validated();

        if (isset($data['cart_id'])) {
            $data['cart_id'] = (int) $data['cart_id'];
        }

        if (isset($data['article_id'])) {
            $data['article_id'] = (int) $data['article_id'];
        }

        $item = $this->items->update($id, $data);

        // Recalcular el carrito original y (si cambió) el nuevo carrito.
        $this->service->recalculateTotal((int) $original['cart_id']);

        if ((int) $item['cart_id'] !== (int) $original['cart_id']) {
            $this->service->recalculateTotal((int) $item['cart_id']);
        }

        return response()->json([
            'message' => 'Item de carrito actualizado correctamente.',
            'data'    => $item,
        ]);
    }

    /**
     * DELETE /api/cart-items/{cart_item} — Elimina un item y recalcula el total.
     */
    public function destroy($id): JsonResponse
    {
        $item = $this->items->find($id);

        if ($item === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Item de carrito no encontrado.');
        }

        $this->items->delete($id);
        $this->service->recalculateTotal((int) $item['cart_id']);

        return response()->json(['message' => 'Item eliminado del carrito.']);
    }
}
