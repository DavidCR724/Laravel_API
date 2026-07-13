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

    // Orígenes permitidos = DE DÓNDE carga el navegador el front (la URL en la
    // barra), NO la IP de la API. Como el front puede abrirse desde localhost:8000
    // o desde la IP de la máquina (p. ej. http://10.109.8.62:8000), y usamos tokens
    // Bearer (supports_credentials=false), lo dejamos abierto con '*'.
    //
    // Para restringir, sustituye '*' por la(s) URL(s) del front, por ejemplo:
    //   'http://localhost:8000', 'http://10.109.8.62:8000'
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Usamos tokens Bearer (no cookies), por lo que no se necesitan credenciales.
    'supports_credentials' => false,

];
