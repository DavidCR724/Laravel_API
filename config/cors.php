<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Permite que el front (React) consuma la API desde otro origen. El front
    | corre en http://localhost:8000, que es el origen permitido.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Orígenes permitidos. El front de React corre en localhost:8000.
    // (Se incluye 127.0.0.1 porque el navegador lo trata como origen distinto.)
    'allowed_origins' => [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Usamos tokens Bearer (no cookies), por lo que no se necesitan credenciales.
    'supports_credentials' => false,

];
