<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    /**
     * GET /api/articles — Lista de productos (ruta pública).
     *
     * - Invitado (sin token): sólo ve nombre, descripción y costo.
     * - Autenticado (cliente/admin): ve el registro completo.
     */
    public function index(Request $request): JsonResponse
    {
        $articles = Article::all();

        if ($request->user() === null) {
            return response()->json(['data' => $this->publicView($articles)]);
        }

        return response()->json(['data' => $articles]);
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
     * GET /api/articles/{id} — Muestra un producto (ruta pública).
     *
     * - Invitado: sólo nombre, descripción y costo.
     * - Autenticado: producto completo con sus reseñas.
     */
    public function show(Request $request, $id): JsonResponse
    {
        if ($request->user() === null) {
            $article = Article::findOrFail($id);

            return response()->json(['data' => $this->publicFields($article)]);
        }

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
     * Campos que puede ver un invitado: sólo nombre, descripción y costo.
     *
     * @return array<string, mixed>
     */
    protected function publicFields(Article $article): array
    {
        return [
            'nombre'      => $article->nombre,
            'descripcion' => $article->descripcion,
            'costo'       => $article->costo,
        ];
    }

    /**
     * Aplica la vista pública a una colección de productos.
     *
     * @param  \Illuminate\Support\Collection<int, Article>  $articles
     * @return array<int, array<string, mixed>>
     */
    protected function publicView($articles): array
    {
        return $articles->map(function (Article $article) {
            return $this->publicFields($article);
        })->all();
    }
}
