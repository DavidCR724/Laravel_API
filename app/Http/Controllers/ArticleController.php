<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreArticleRequest;
use App\Http\Requests\UpdateArticleRequest;
use App\Support\MemoryStore;
use Illuminate\Http\JsonResponse;

class ArticleController extends Controller
{
    /** @var MemoryStore */
    protected $articles;

    public function __construct()
    {
        $this->articles = MemoryStore::for(MemoryStore::ARTICLES);
    }

    /**
     * GET /api/articles — Lista todos los artículos.
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->articles->all()]);
    }

    /**
     * POST /api/articles — Crea un nuevo artículo.
     */
    public function store(StoreArticleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['costo'] = round((float) $data['costo'], 2);

        $article = $this->articles->create($data);

        return response()->json([
            'message' => 'Artículo creado correctamente.',
            'data'    => $article,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/articles/{article} — Muestra un artículo.
     */
    public function show($id): JsonResponse
    {
        $article = $this->articles->find($id);

        if ($article === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Artículo no encontrado.');
        }

        return response()->json(['data' => $article]);
    }

    /**
     * PUT/PATCH /api/articles/{article} — Actualiza un artículo.
     */
    public function update(UpdateArticleRequest $request, $id): JsonResponse
    {
        if (! $this->articles->exists($id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Artículo no encontrado.');
        }

        $data = $request->validated();

        if (isset($data['costo'])) {
            $data['costo'] = round((float) $data['costo'], 2);
        }

        $article = $this->articles->update($id, $data);

        return response()->json([
            'message' => 'Artículo actualizado correctamente.',
            'data'    => $article,
        ]);
    }

    /**
     * DELETE /api/articles/{article} — Elimina un artículo.
     */
    public function destroy($id): JsonResponse
    {
        if (! $this->articles->delete($id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Artículo no encontrado.');
        }

        return response()->json(['message' => 'Artículo eliminado correctamente.']);
    }
}
