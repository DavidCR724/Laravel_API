<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCartRequest;
use App\Http\Requests\UpdateCartRequest;
use App\Services\CartService;
use App\Support\MemoryStore;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    /** @var MemoryStore */
    protected $carts;

    /** @var CartService */
    protected $service;

    public function __construct(CartService $service)
    {
        $this->carts   = MemoryStore::for(MemoryStore::CARTS);
        $this->service = $service;
    }

    /**
     * GET /api/carts — Lista todos los carritos.
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->carts->all()]);
    }

    /**
     * POST /api/carts — Crea un carrito para un usuario. El costo_total inicia
     * en 0 y se recalcula al agregar items.
     */
    public function store(StoreCartRequest $request): JsonResponse
    {
        $cart = $this->carts->create([
            'user_id'     => (int) $request->validated()['user_id'],
            'costo_total' => 0,
        ]);

        return response()->json([
            'message' => 'Carrito creado correctamente.',
            'data'    => $cart,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/carts/{cart} — Muestra un carrito con sus items y artículos.
     */
    public function show($id): JsonResponse
    {
        $cart = $this->service->withItems((int) $id);

        if ($cart === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Carrito no encontrado.');
        }

        return response()->json(['data' => $cart]);
    }

    /**
     * PUT/PATCH /api/carts/{cart} — Actualiza el usuario dueño del carrito.
     */
    public function update(UpdateCartRequest $request, $id): JsonResponse
    {
        if (! $this->carts->exists($id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Carrito no encontrado.');
        }

        $data = $request->validated();

        if (isset($data['user_id'])) {
            $data['user_id'] = (int) $data['user_id'];
        }

        $cart = $this->carts->update($id, $data);

        return response()->json([
            'message' => 'Carrito actualizado correctamente.',
            'data'    => $cart,
        ]);
    }

    /**
     * DELETE /api/carts/{cart} — Elimina el carrito y todos sus items.
     */
    public function destroy($id): JsonResponse
    {
        if (! $this->service->deleteWithItems((int) $id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Carrito no encontrado.');
        }

        return response()->json(['message' => 'Carrito eliminado correctamente.']);
    }
}
