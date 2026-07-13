<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Integrador con la API de Google Gemini (generateContent) usando el facade
 * Http de Laravel. Lee las credenciales desde config/services.php (.env).
 */
class GeminiService
{
    /** @var string */
    private $apiKey;

    /** @var string */
    private $model;

    /** @var string */
    private $baseUrl;

    public function __construct()
    {
        $this->apiKey  = (string) config('services.gemini.key');
        $this->model   = (string) config('services.gemini.model');
        $this->baseUrl = rtrim((string) config('services.gemini.base_url'), '/');
    }

    /**
     * ¿Está configurada la API key?
     */
    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Envía uno o varios turnos de conversación y devuelve el texto generado.
     *
     * @param array<int, array<string, mixed>> $contents Turnos en formato Gemini.
     * @param string|null $systemInstruction Instrucción de sistema (contexto).
     * @param bool $expectJson Si true, pide a Gemini responder en JSON puro.
     *
     * @throws RuntimeException Si falta la key o la API responde con error.
     */
    public function generateContent(array $contents, ?string $systemInstruction = null, bool $expectJson = false): string
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('La API de Gemini no está configurada: define GEMINI_API_KEY en el archivo .env.');
        }

        $payload = ['contents' => $contents];

        if ($systemInstruction !== null && $systemInstruction !== '') {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemInstruction]],
            ];
        }

        $generationConfig = ['temperature' => 0.2];
        if ($expectJson) {
            $generationConfig['responseMimeType'] = 'application/json';
        }
        $payload['generationConfig'] = $generationConfig;

        $url = $this->baseUrl.'/models/'.$this->model.':generateContent';

        $response = Http::withHeaders([
                'x-goog-api-key' => $this->apiKey,
                'Content-Type'   => 'application/json',
            ])
            ->timeout(30)
            ->post($url, $payload);

        if ($response->failed()) {
            $message = data_get($response->json(), 'error.message', 'Error desconocido al llamar a Gemini.');
            throw new RuntimeException('Gemini respondió con un error: '.$message);
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (! is_string($text) || $text === '') {
            throw new RuntimeException('Gemini no devolvió contenido de texto.');
        }

        return $text;
    }

    /**
     * Atajo para un único mensaje de usuario.
     *
     * @throws RuntimeException
     */
    public function prompt(string $userText, ?string $systemInstruction = null, bool $expectJson = false): string
    {
        $contents = [
            ['role' => 'user', 'parts' => [['text' => $userText]]],
        ];

        return $this->generateContent($contents, $systemInstruction, $expectJson);
    }
}
