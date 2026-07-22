<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAdminPurchaseRequest;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdateAdminPurchaseRequest;
use App\Models\Article;
use App\Models\Cart;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
     * momento), calcula el total y vacía el carrito. El pedido nace en estado
     * 'pendiente_pago' con la forma de pago elegida:
     *   - efectivo: se genera una referencia numérica (para un código de barras
     *     tipo OXXO Pay) y el pago se confirma después vía POST .../pay.
     *   - tarjeta : el cobro también se confirma vía POST .../pay (simulado).
     */
    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $cart = Cart::with('items.article')->findOrFail($data['cart_id']);

        if ($cart->items->isEmpty()) {
            abort(JsonResponse::HTTP_UNPROCESSABLE_ENTITY, 'El carrito está vacío; no se puede generar la compra.');
        }

        $metodo = $data['metodo_pago'];

        $purchase = DB::transaction(function () use ($cart, $metodo) {
            $purchase = Purchase::create([
                'user_id'         => $cart->user_id,
                'total'           => 0,
                'estado'          => 'pendiente_pago',
                'metodo_pago'     => $metodo,
                'referencia_pago' => $metodo === 'efectivo' ? $this->generarReferencia() : null,
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

            // Vacía el carrito tras generar el pedido.
            $cart->items()->delete();
            $cart->update(['costo_total' => 0]);

            return $purchase;
        });

        return response()->json([
            'message' => 'Pedido generado. Falta confirmar el pago.',
            'data'    => $purchase->load('items.article'),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * POST /api/purchases/{id}/pay — Confirma el pago del pedido (SIMULADO).
     *
     * Sirve tanto para el pago con tarjeta como para el pago en efectivo
     * (cuando el cliente "paga" en tienda con el código de barras). Solo el
     * dueño del pedido puede pagarlo y solo si sigue 'pendiente_pago'. No se
     * procesa ninguna tarjeta real: cualquier dato de tarjeta se ignora.
     */
    public function pay(Request $request, $id): JsonResponse
    {
        $purchase = Purchase::where('user_id', $request->user()->id)->findOrFail($id);

        if ($purchase->estado !== 'pendiente_pago') {
            abort(JsonResponse::HTTP_UNPROCESSABLE_ENTITY, 'Este pedido ya no está pendiente de pago.');
        }

        $purchase->update([
            'estado'    => 'pagado',
            'pagado_at' => now(),
        ]);

        return response()->json([
            'message' => 'Pago confirmado correctamente.',
            'data'    => $purchase->load('items.article'),
        ]);
    }

    /**
     * Genera una referencia numérica de 14 dígitos para el pago en efectivo
     * (respalda el "código de barras" tipo OXXO Pay que se muestra al cliente).
     */
    private function generarReferencia(): string
    {
        return (string) mt_rand(1, 9) . str_pad((string) mt_rand(0, 9999999999999), 13, '0', STR_PAD_LEFT);
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
