<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Http\Requests\UpdateReviewRequest;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/reviews — Lista reseñas. Se puede filtrar por ?article_id= y/o ?user_id=.
     * GET /api/articles/{article}/reviews — Reseñas de un artículo concreto.
     */
    public function index(Request $request): JsonResponse
    {
        $articleId = $request->route('article') ?? $request->query('article_id');
        $userId = $request->query('user_id');

        $query = Review::with(['article', 'user'])->latest();

        if ($articleId !== null) {
            $query->where('article_id', (int) $articleId);
        }

        if ($userId !== null) {
            $query->where('user_id', (int) $userId);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * POST /api/reviews — Crea una reseña. El usuario se toma de la sesión y
     * solo puede reseñar artículos que haya comprado (compra no cancelada).
     */
    public function store(StoreReviewRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $haComprado = $user->purchases()
            ->where('estado', '!=', 'cancelado')
            ->whereHas('items', function ($q) use ($data) {
                $q->where('article_id', $data['article_id']);
            })
            ->exists();

        if (! $haComprado) {
            abort(JsonResponse::HTTP_FORBIDDEN, 'Solo puedes reseñar artículos que hayas comprado.');
        }

        $data['user_id'] = $user->id;
        $review = Review::create($data);

        return response()->json([
            'message' => 'Reseña creada correctamente.',
            'data'    => $review->load(['article', 'user']),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/reviews/{id} — Muestra una reseña.
     */
    public function show($id): JsonResponse
    {
        $review = Review::with(['article', 'user'])->findOrFail($id);

        return response()->json(['data' => $review]);
    }

    /**
     * PUT/PATCH /api/reviews/{id} — Actualiza una reseña.
     */
    public function update(UpdateReviewRequest $request, $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $review->update($request->validated());

        return response()->json([
            'message' => 'Reseña actualizada correctamente.',
            'data'    => $review->load(['article', 'user']),
        ]);
    }

    /**
     * DELETE /api/reviews/{id} — Elimina una reseña.
     */
    public function destroy($id): JsonResponse
    {
        Review::findOrFail($id)->delete();

        return response()->json(['message' => 'Reseña eliminada correctamente.']);
    }
}
