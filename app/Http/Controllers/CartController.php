<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartRequest;
use App\Http\Requests\UpdateCartRequest;
use App\Models\Cart;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    /**
     * GET /api/carts — Lista todos los carritos con sus items.
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => Cart::with('items.article')->get()]);
    }

    /**
     * POST /api/carts — Crea un carrito para un usuario. El costo_total inicia
     * en 0 y se recalcula al agregar items.
     */
    public function store(StoreCartRequest $request): JsonResponse
    {
        $cart = Cart::create([
            'user_id'     => $request->validated()['user_id'],
            'costo_total' => 0,
        ]);

        return response()->json([
            'message' => 'Carrito creado correctamente.',
            'data'    => $cart,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/carts/{id} — Muestra un carrito con sus items y artículos.
     */
    public function show($id): JsonResponse
    {
        $cart = Cart::with('items.article')->findOrFail($id);

        return response()->json(['data' => $cart]);
    }

    /**
     * PUT/PATCH /api/carts/{id} — Actualiza el usuario dueño del carrito.
     */
    public function update(UpdateCartRequest $request, $id): JsonResponse
    {
        $cart = Cart::findOrFail($id);
        $cart->update($request->validated());

        return response()->json([
            'message' => 'Carrito actualizado correctamente.',
            'data'    => $cart,
        ]);
    }

    /**
     * DELETE /api/carts/{id} — Elimina el carrito (y sus items en cascada).
     */
    public function destroy($id): JsonResponse
    {
        Cart::findOrFail($id)->delete();

        return response()->json(['message' => 'Carrito eliminado correctamente.']);
    }
}
