<?php

namespace App\Http\Controllers;

use App\Http\Requests\AiChatRequest;
use App\Http\Requests\AiSearchRequest;
use App\Models\Article;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use RuntimeException;

/**
 * Endpoints de IA (Sprint 2). Consumen Google Gemini a través de GeminiService.
 */
class AiController extends Controller
{
    /** @var GeminiService */
    private $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * POST /api/ai/search — Búsqueda semántica en lenguaje natural sobre las
     * "caracteristicas" (JSONB) de los sombreros. Devuelve los artículos que
     * mejor coinciden, ordenados por relevancia. Ruta pública.
     */
    public function search(AiSearchRequest $request): JsonResponse
    {
        $query = $request->validated()['query'];

        $catalogo = Article::query()
            ->get(['id', 'nombre', 'descripcion', 'costo', 'caracteristicas', 'stock'])
            ->toArray();

        if (count($catalogo) === 0) {
            return response()->json(['query' => $query, 'data' => []]);
        }

        $system = 'Eres un buscador experto de una tienda de sombreros. Recibirás un catálogo en '
            .'JSON (cada sombrero tiene id, nombre, descripcion, costo y "caracteristicas" como '
            .'talla, color, material y estilo de ala) y una consulta en lenguaje natural. Devuelve '
            .'EXCLUSIVAMENTE un JSON con la forma {"ids":[<id>, ...]} con los ids de los sombreros '
            .'que mejor coinciden, ordenados del más relevante al menos relevante. Usa solo ids que '
            .'existan en el catálogo. Si nada coincide, devuelve {"ids":[]}.';

        $userText = 'Consulta del cliente: "'.$query."\"\n\nCatálogo (JSON):\n"
            .json_encode($catalogo, JSON_UNESCAPED_UNICODE);

        try {
            $raw = $this->gemini->prompt($userText, $system, true);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], JsonResponse::HTTP_BAD_GATEWAY);
        }

        $ids = $this->normalizeIds(data_get($this->decodeJson($raw), 'ids', []));

        return response()->json([
            'query' => $query,
            'data'  => $this->articlesInOrder($ids),
        ]);
    }

    /**
     * GET /api/ai/recommendations — Recomendaciones personalizadas a partir del
     * historial de compras y del carrito del cliente autenticado (Sanctum).
     */
    public function recommendations(Request $request): JsonResponse
    {
        $user = $request->user();

        $comprados = $this->articlesFromRelation($user->purchases()->with('items.article')->get());
        $enCarrito = $this->articlesFromRelation($user->carts()->with('items.article')->get());

        $idsPropios = $comprados->pluck('id')
            ->merge($enCarrito->pluck('id'))
            ->unique()
            ->values()
            ->all();

        $candidatos = Article::query()
            ->whereNotIn('id', $idsPropios)
            ->where('stock', '>', 0)
            ->get(['id', 'nombre', 'descripcion', 'costo', 'caracteristicas'])
            ->toArray();

        if (count($candidatos) === 0) {
            return response()->json([
                'message' => 'No hay artículos nuevos para recomendar por ahora.',
                'data'    => [],
            ]);
        }

        $historial = [
            'comprados' => $this->summarize($comprados),
            'carrito'   => $this->summarize($enCarrito),
        ];

        $system = 'Eres un recomendador de una tienda de sombreros. A partir del historial de '
            .'compras y del carrito del cliente, sugiere sombreros del catálogo de candidatos que '
            .'combinen con sus gustos (estilo, material, color, talla). Devuelve EXCLUSIVAMENTE un '
            .'JSON con la forma {"ids":[<id>, ...], "motivo":"<breve explicación>"} usando solo ids '
            .'del catálogo de candidatos, con un máximo de 5 ids.';

        $userText = "Historial del cliente (JSON):\n".json_encode($historial, JSON_UNESCAPED_UNICODE)
            ."\n\nCatálogo de candidatos (JSON):\n".json_encode($candidatos, JSON_UNESCAPED_UNICODE);

        try {
            $raw = $this->gemini->prompt($userText, $system, true);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], JsonResponse::HTTP_BAD_GATEWAY);
        }

        $decoded = $this->decodeJson($raw);
        $ids     = $this->normalizeIds(data_get($decoded, 'ids', []));

        return response()->json([
            'motivo' => data_get($decoded, 'motivo'),
            'data'   => $this->articlesInOrder($ids),
        ]);
    }

    /**
     * POST /api/ai/chat — ChatBot con contexto de la tienda de sombreros.
     * Acepta "message" y un "history" opcional para mantener la conversación.
     * Ruta pública.
     */
    public function chat(AiChatRequest $request): JsonResponse
    {
        $data    = $request->validated();
        $message = $data['message'];
        $history = isset($data['history']) ? $data['history'] : [];

        $contents = [];
        foreach ($history as $turno) {
            $role = (isset($turno['role']) && in_array($turno['role'], ['model', 'assistant', 'bot'], true))
                ? 'model'
                : 'user';
            $text = isset($turno['text']) ? (string) $turno['text'] : '';
            if ($text !== '') {
                $contents[] = ['role' => $role, 'parts' => [['text' => $text]]];
            }
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $system = 'Eres el asistente virtual de "Sombrerería", una tienda de sombreros en línea. '
            .'Respondes en español, de forma clara, amable y breve. Ayudas con dudas sobre '
            .'materiales (fieltro, paja toquilla, lana), tallas y cómo medir la cabeza, cuidados del '
            .'sombrero, estilos (fedora, panamá, bombín, vaquero) y políticas de compra, envío y '
            .'devoluciones. Si te preguntan algo ajeno a la tienda, redirige la conversación con '
            .'cortesía.';

        try {
            $reply = $this->gemini->generateContent($contents, $system, false);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], JsonResponse::HTTP_BAD_GATEWAY);
        }

        // Devuelve el historial actualizado para continuar la conversación.
        $history[] = ['role' => 'user', 'text' => $message];
        $history[] = ['role' => 'model', 'text' => $reply];

        return response()->json([
            'reply'   => $reply,
            'history' => $history,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Aplana los artículos de una colección de compras o carritos (con
     * items.article ya cargados) en una colección de Article únicos.
     *
     * @param Collection $owners
     * @return Collection
     */
    private function articlesFromRelation(Collection $owners): Collection
    {
        $articulos = collect();

        foreach ($owners as $owner) {
            foreach ($owner->items as $item) {
                if ($item->article) {
                    $articulos->push($item->article);
                }
            }
        }

        return $articulos->unique('id')->values();
    }

    /**
     * Carga los artículos de una lista de ids preservando ese orden y
     * descartando ids inexistentes.
     *
     * @param array<int, int> $ids
     * @return array<int, Article>
     */
    private function articlesInOrder(array $ids): array
    {
        if (count($ids) === 0) {
            return [];
        }

        $porId     = Article::whereIn('id', $ids)->get()->keyBy('id');
        $ordenados = [];

        foreach ($ids as $id) {
            if ($porId->has($id)) {
                $ordenados[] = $porId->get($id);
            }
        }

        return $ordenados;
    }

    /**
     * Resume artículos a nombre + caracteristicas para el prompt.
     *
     * @param Collection $articulos
     * @return array<int, array<string, mixed>>
     */
    private function summarize(Collection $articulos): array
    {
        return $articulos->map(function (Article $a) {
            return [
                'nombre'          => $a->nombre,
                'caracteristicas' => $a->caracteristicas,
            ];
        })->values()->all();
    }

    /**
     * Decodifica JSON tolerando envolturas de código Markdown (```json ... ```).
     *
     * @return array<mixed>
     */
    private function decodeJson(string $raw): array
    {
        $text = trim($raw);
        $text = preg_replace('/^```(?:json)?/i', '', $text);
        $text = preg_replace('/```$/', '', $text);
        $text = trim((string) $text);

        $decoded = json_decode($text, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Filtra y normaliza a enteros una lista de ids proveniente de la IA.
     *
     * @param mixed $ids
     * @return array<int, int>
     */
    private function normalizeIds($ids): array
    {
        if (! is_array($ids)) {
            return [];
        }

        $result = [];
        foreach ($ids as $id) {
            if (is_numeric($id)) {
                $result[] = (int) $id;
            }
        }

        return $result;
    }
}
