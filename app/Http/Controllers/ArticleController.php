<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Http\Requests\UpdateStockRequest;
use App\Models\Article;
use Illuminate\Http\JsonResponse;

class ArticleController extends Controller
{
    /**
     * GET /api/articles — Lista de productos (ruta pública, visible para todos).
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => Article::all()]);
    }

    /**
     * POST /api/articles — Crea un producto (solo admin, ver rutas).
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        $article = Article::create($request->validated());

        return response()->json([
            'message' => 'Artículo creado correctamente.',
            'data'    => $article,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/articles/{id} — Muestra un producto con sus reseñas (público).
     */
    public function show($id): JsonResponse
    {
        $article = Article::with('reviews')->findOrFail($id);

        return response()->json(['data' => $article]);
    }

    /**
     * PUT/PATCH /api/articles/{id} — Actualiza un producto (solo admin).
     */
    public function update(UpdateArticleRequest $request, $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $article->update($request->validated());

        return response()->json([
            'message' => 'Artículo actualizado correctamente.',
            'data'    => $article,
        ]);
    }

    /**
     * DELETE /api/articles/{id} — Elimina un producto (solo admin).
     */
    public function destroy($id): JsonResponse
    {
        Article::findOrFail($id)->delete();

        return response()->json(['message' => 'Artículo eliminado correctamente.']);
    }

    /**
     * PATCH /api/articles/{id}/stock — Control de stock específico (solo admin).
     *
     * Envía "stock" para fijar el valor absoluto, o "ajuste" para sumar/restar
     * al stock actual (el resultado nunca baja de 0).
     */
    public function updateStock(UpdateStockRequest $request, $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        $data    = $request->validated();

        if (array_key_exists('stock', $data)) {
            $article->stock = (int) $data['stock'];
        } else {
            $article->stock = max(0, $article->stock + (int) $data['ajuste']);
        }

        $article->save();

        return response()->json([
            'message' => 'Stock actualizado correctamente.',
            'data'    => $article,
        ]);
    }
}
