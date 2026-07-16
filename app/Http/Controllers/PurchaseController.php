<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdminPurchaseRequest;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdateAdminPurchaseRequest;
use App\Models\Article;
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

    /**
     * POST /api/admin/purchases — El ADMIN crea un pedido a mano.
     *
     * Elige el cliente y arma las líneas (artículo + cantidad). Si no envía el
     * costo unitario de una línea, se toma el costo actual del artículo.
     */
    public function adminStore(StoreAdminPurchaseRequest $request): JsonResponse
    {
        $data = $request->validated();

        $purchase = DB::transaction(function () use ($data) {
            $purchase = Purchase::create([
                'user_id' => $data['user_id'],
                'estado'  => $data['estado'] ?? 'completado',
                'total'   => 0,
            ]);

            $total = $this->syncItems($purchase, $data['items']);
            $purchase->update(['total' => $total]);

            return $purchase;
        });

        return response()->json([
            'message' => 'Pedido creado correctamente.',
            'data'    => $purchase->load('items.article', 'user'),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * PUT/PATCH /api/admin/purchases/{id} — El ADMIN edita un pedido.
     *
     * Puede cambiar el cliente, el estado y/o reemplazar las líneas completas.
     */
    public function adminUpdate(UpdateAdminPurchaseRequest $request, $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        $data = $request->validated();

        DB::transaction(function () use ($purchase, $data) {
            $attrs = array_filter(
                ['user_id' => $data['user_id'] ?? null, 'estado' => $data['estado'] ?? null],
                static fn ($v) => $v !== null
            );

            if (! empty($attrs)) {
                $purchase->update($attrs);
            }

            // Si vienen items, reemplazan por completo las líneas y recalculan total.
            if (isset($data['items'])) {
                $purchase->items()->delete();
                $total = $this->syncItems($purchase, $data['items']);
                $purchase->update(['total' => $total]);
            }
        });

        return response()->json([
            'message' => 'Pedido actualizado correctamente.',
            'data'    => $purchase->fresh()->load('items.article', 'user'),
        ]);
    }

    /**
     * PATCH /api/admin/purchases/{id}/cancel — Marca el pedido como cancelado.
     *
     * No borra el registro: solo cambia el estado (se conserva en el historial).
     */
    public function cancel($id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        $purchase->update(['estado' => 'cancelado']);

        return response()->json([
            'message' => 'Pedido cancelado correctamente.',
            'data'    => $purchase->load('items.article', 'user'),
        ]);
    }

    /**
     * Crea las líneas del pedido a partir del arreglo validado y devuelve el
     * total (suma de costo unitario * cantidad). Si una línea no trae costo,
     * usa el costo actual del artículo.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    private function syncItems(Purchase $purchase, array $items): float
    {
        $total = 0.0;

        foreach ($items as $item) {
            $cantidad = (int) $item['cantidad'];
            $costo = isset($item['costo']) && $item['costo'] !== null
                ? (float) $item['costo']
                : (float) (Article::find($item['article_id'])->costo ?? 0);

            $purchase->items()->create([
                'article_id' => $item['article_id'],
                'costo'      => $costo,
                'cantidad'   => $cantidad,
            ]);

            $total += $costo * $cantidad;
        }

        return round($total, 2);
    }
}
