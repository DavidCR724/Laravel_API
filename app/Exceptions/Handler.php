<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * Como la aplicación es una API pura, siempre respondemos JSON estándar.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Formatea cualquier excepción como una respuesta JSON coherente.
     */
    protected function renderApiException($request, Throwable $e): JsonResponse
    {
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Los datos proporcionados no son válidos.',
                'errors'  => $e->errors(),
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'message' => 'No autenticado.',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($e instanceof ModelNotFoundException) {
            return response()->json([
                'message' => $this->modelNotFoundMessage($e),
            ], JsonResponse::HTTP_NOT_FOUND);
        }

        $status = $e instanceof HttpExceptionInterface
            ? $e->getStatusCode()
            : JsonResponse::HTTP_INTERNAL_SERVER_ERROR;

        $payload = [
            'message' => $e->getMessage() ?: 'Ha ocurrido un error inesperado.',
        ];

        if (config('app.debug')) {
            $payload['exception'] = get_class($e);
            $payload['file']      = $e->getFile();
            $payload['line']      = $e->getLine();
        }

        return response()->json($payload, $status);
    }

    /**
     * Traduce el modelo no encontrado a un mensaje amigable en español.
     */
    protected function modelNotFoundMessage(ModelNotFoundException $e): string
    {
        $messages = [
            \App\Models\User::class         => 'Usuario no encontrado.',
            \App\Models\Article::class      => 'Artículo no encontrado.',
            \App\Models\Cart::class         => 'Carrito no encontrado.',
            \App\Models\CartItem::class     => 'Item de carrito no encontrado.',
            \App\Models\Purchase::class     => 'Compra no encontrada.',
            \App\Models\PurchaseItem::class => 'Item de compra no encontrado.',
            \App\Models\Review::class       => 'Reseña no encontrada.',
        ];

        return $messages[$e->getModel()] ?? 'Recurso no encontrado.';
    }
}
