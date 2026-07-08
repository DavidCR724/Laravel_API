<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Models\Cart;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * GET /api/purchases — Lista todas las compras con sus items.
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => Purchase::with('items.article', 'user')->get()]);
    }

    /**
     * POST /api/purchases — Genera una compra a partir de un carrito (checkout).
     *
     * Copia los artículos del carrito a la compra (guardando el costo del
     * momento), calcula el total y vacía el carrito.
     */
    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $cart = Cart::with('items.article')->findOrFail($request->validated()['cart_id']);

        if ($cart->items->isEmpty()) {
            abort(JsonResponse::HTTP_UNPROCESSABLE_ENTITY, 'El carrito está vacío; no se puede generar la compra.');
        }

        $purchase = DB::transaction(function () use ($cart) {
            $purchase = Purchase::create([
                'user_id' => $cart->user_id,
                'total'   => 0,
            ]);

            $total = 0.0;

            foreach ($cart->items as $item) {
                if ($item->article === null) {
                    continue;
                }

                $purchase->items()->create([
                    'article_id' => $item->article_id,
                    'costo'      => $item->article->costo,
                ]);

                $total += (float) $item->article->costo;
            }

            $purchase->update(['total' => round($total, 2)]);

            // Vacía el carrito tras la compra.
            $cart->items()->delete();
            $cart->update(['costo_total' => 0]);

            return $purchase;
        });

        return response()->json([
            'message' => 'Compra realizada correctamente.',
            'data'    => $purchase->load('items.article'),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/purchases/{id} — Muestra una compra con sus items.
     */
    public function show($id): JsonResponse
    {
        $purchase = Purchase::with('items.article', 'user')->findOrFail($id);

        return response()->json(['data' => $purchase]);
    }

    /**
     * DELETE /api/purchases/{id} — Elimina una compra (y sus items en cascada).
     */
    public function destroy($id): JsonResponse
    {
        Purchase::findOrFail($id)->delete();

        return response()->json(['message' => 'Compra eliminada correctamente.']);
    }
}
